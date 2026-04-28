import type { Notice } from "../html.js";
import { escapeHtml } from "../html.js";

export function formatDate(value: Date | null): string {
  if (!value) {
    return "Unpublished";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(value);
}

export function articleDisplayDate(article: { publishedAt: Date | null; createdAt: Date }): string {
  return formatDate(article.publishedAt ?? article.createdAt);
}

export function renderTagList(items: string[]): string {
  return items.map((item) => `<span class="rounded-full border border-black/10 px-3 py-2 text-sm text-stone-600">${escapeHtml(item)}</span>`).join("");
}

export function renderEmptyState(message: string): string {
  return `<p class="text-sm leading-7 text-stone-600">${escapeHtml(message)}</p>`;
}

export function renderInlineNotice(notice?: Notice): string {
  if (!notice) {
    return "";
  }

  const toneClass = notice.tone === "ok"
    ? "border-black/10 bg-stone-50 text-stone-700"
    : "border-red-200 bg-red-50 text-red-700";

  return `<div class="rounded-[1rem] border px-4 py-3 text-sm ${toneClass}">${escapeHtml(notice.message)}</div>`;
}
