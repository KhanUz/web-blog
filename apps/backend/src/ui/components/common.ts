import type { Notice } from "../core/shell.js";
import { escapeHtml } from "../core/shell.js";

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
  return items.map((item) => `<span class="tag-pill">${escapeHtml(item)}</span>`).join("");
}

export function renderEmptyState(message: string): string {
  return `<p class="text-sm leading-7 text-stone-600">${escapeHtml(message)}</p>`;
}

export function renderInlineNotice(notice?: Notice): string {
  if (!notice) {
    return "";
  }

  const toneClass = notice.tone === "ok"
    ? "notice-ok"
    : "notice-error";

  return `<div class="notice ${toneClass}">${escapeHtml(notice.message)}</div>`;
}
