import type { Article, ArticleStatus } from "./types";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "Unpublished";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function articleDisplayDate(article: Pick<Article, "publishedAt" | "createdAt">): string {
  return formatDate(article.publishedAt ?? article.createdAt);
}

export function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getStatusBadge(status: ArticleStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function setMessage(target: HTMLElement | null, message: string, tone: "ok" | "error" = "ok"): void {
  if (!target) {
    return;
  }

  const toneClass = tone === "ok"
    ? "border-black/10 bg-stone-50 text-stone-700"
    : "border-red-200 bg-red-50 text-red-700";

  target.innerHTML = `<div class="rounded-[1rem] border px-4 py-3 text-sm ${toneClass}">${escapeHtml(message)}</div>`;
}
