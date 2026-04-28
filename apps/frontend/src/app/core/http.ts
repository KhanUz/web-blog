import { STORAGE_KEY, state } from "./state";
import type { Article, Session } from "./types";

export function getStoredSessionToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredSessionToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredSessionToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const authHeaders = getAuthHeaders();

  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      // Preserve generic failure text when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function loadSession(): Promise<void> {
  try {
    state.session = await api<Session>("/api/users/session");
  } catch (error) {
    if (getStoredSessionToken()) {
      setStoredSessionToken(null);
      state.session = await api<Session>("/api/users/session");
      return;
    }

    throw error;
  }
}

export async function loadArticles(scope: "public" | "manage"): Promise<Article[]> {
  const response = await api<{ items: Article[] }>(`/api/articles${scope === "manage" ? "?scope=manage" : ""}`);
  state.articleList = response.items;
  return response.items;
}
