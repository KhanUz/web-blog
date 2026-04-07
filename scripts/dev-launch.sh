#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
DB_DIR="$ROOT_DIR/db"

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${BACKEND_PORT:-4000}"
MONGODB_PORT="${MONGODB_PORT:-27017}"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:${MONGODB_PORT}/web-blog}"

FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"
BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
HEALTH_URL="${BACKEND_URL}/api/health"

mkdir -p "$LOG_DIR"
mkdir -p "$DB_DIR"

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Missing required command: $name" >&2
    exit 1
  fi
}

require_command npm
require_command mongod
require_command curl

PIDS=()
TAIL_PIDS=()

cleanup() {
  local exit_code=$?

  if ((${#TAIL_PIDS[@]} > 0)); then
    for pid in "${TAIL_PIDS[@]}"; do
      if kill -0 "$pid" >/dev/null 2>&1; then
        kill "$pid" >/dev/null 2>&1 || true
      fi
    done
    wait "${TAIL_PIDS[@]}" 2>/dev/null || true
  fi

  if ((${#PIDS[@]} > 0)); then
    echo
    echo "Stopping services..."
    for pid in "${PIDS[@]}"; do
      if kill -0 "$pid" >/dev/null 2>&1; then
        kill "$pid" >/dev/null 2>&1 || true
      fi
    done
    wait "${PIDS[@]}" 2>/dev/null || true
  fi

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

stream_logs() {
  local name="$1"
  local logfile="$2"
  tail -n +1 -F "$logfile" 2>/dev/null | awk -v prefix="[$name] " '{ print prefix $0; fflush(stdout); }' &
  TAIL_PIDS+=("$!")
}

start_service() {
  local name="$1"
  local workdir="$2"
  local command="$3"
  local logfile="$4"

  : > "$logfile"

  (
    cd "$workdir"
    exec bash -lc "$command"
  ) >>"$logfile" 2>&1 &

  local pid=$!
  PIDS+=("$pid")

  stream_logs "$name" "$logfile"
}

wait_for_http() {
  local name="$1"
  local url="$2"
  local attempts="${3:-60}"
  local sleep_seconds="${4:-1}"

  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name is ready at $url"
      return 0
    fi
    sleep "$sleep_seconds"
  done

  echo "Timed out waiting for $name at $url" >&2
  return 1
}

echo "Launching local stack..."
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo "Health:   $HEALTH_URL"
echo "MongoDB:  $MONGODB_URI"
echo
echo "Logs:"
echo "  MongoDB  $LOG_DIR/mongodb.log"
echo "  Backend  $LOG_DIR/backend.log"
echo "  Frontend $LOG_DIR/frontend.log"
echo
echo "Press Ctrl+C to stop everything."
echo

start_service "mongodb" "$ROOT_DIR" "mongod --dbpath \"$DB_DIR\" --bind_ip 127.0.0.1 --port ${MONGODB_PORT} --nounixsocket" "$LOG_DIR/mongodb.log"
sleep 2
start_service "backend" "$ROOT_DIR/apps/backend" "node --import tsx src/server.ts" "$LOG_DIR/backend.log"
start_service "frontend" "$ROOT_DIR/apps/frontend" "../../node_modules/.bin/vite --host 127.0.0.1 --port ${FRONTEND_PORT}" "$LOG_DIR/frontend.log"

wait_for_http "Backend" "$HEALTH_URL"
wait_for_http "Frontend" "$FRONTEND_URL"

echo
echo "All services are running:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
echo "  Health:   $HEALTH_URL"
echo

wait
