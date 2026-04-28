import type { ArticleDocument } from "../../models/Article.js";
import { escapeHtml } from "../html.js";
import { formatDate } from "../components/common.js";

type TagCount = {
  tag: string;
  count: number;
};

type ArchiveEntry = {
  year: number;
  month: number;
  count: number;
};

function renderSearchResults(results: ArticleDocument[]): string {
  return results.length > 0
    ? results.map((article) => `
        <article class="panel p-6">
          <p class="text-xs uppercase tracking-[0.25em] text-stone-500">${escapeHtml(article.categories.join(" / ") || "Article")}</p>
          <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">${escapeHtml(article.title)}</h3>
          <p class="mt-2 text-sm leading-7 text-stone-600">${escapeHtml(article.summary)}</p>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div class="text-sm text-stone-500">${escapeHtml(formatDate(article.publishedAt ?? article.createdAt))}</div>
            <a class="nav-chip" href="/articles/${escapeHtml(article.slug)}">Open article</a>
          </div>
        </article>
      `).join("")
    : `<p class="text-sm leading-7 text-stone-600">No articles matched the current query.</p>`;
}

export function renderSearchPage(query: string, results: ArticleDocument[], tags: TagCount[], archives: ArchiveEntry[]): string {
  return `
    <section class="space-y-8">
      <header>
        <p class="eyebrow">Search and tags</p>
        <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">Full-text search over published writing</h2>
      </header>

      <section class="panel p-6 sm:p-8">
        <form action="/search" method="get" class="space-y-4">
          <input
            class="w-full rounded-[1.35rem] border border-black/10 bg-stone-50 px-5 py-4 text-lg outline-none transition focus:border-black"
            type="search"
            name="q"
            placeholder="Search by title, phrase, or tag"
            value="${escapeHtml(query)}"
          />
          <div class="flex flex-wrap gap-2">
            ${tags.map((item) => `<a class="nav-chip" href="/search?q=${encodeURIComponent(item.tag)}">${escapeHtml(item.tag)} (${item.count})</a>`).join("")}
          </div>
        </form>
      </section>

      <section class="panel-muted p-6 sm:p-8">
        <p class="eyebrow !text-stone-400">Archive</p>
        <div class="mt-3 grid gap-3 text-sm text-stone-300 md:grid-cols-2 xl:grid-cols-3">
          ${
            archives.length > 0
              ? archives.map((item) => `
                  <a class="flex items-center justify-between rounded-[1.2rem] border border-white/10 px-4 py-3" href="/search?year=${item.year}&month=${item.month}">
                    <span>${item.year} / ${String(item.month).padStart(2, "0")}</span>
                    <span>${item.count} post${item.count === 1 ? "" : "s"}</span>
                  </a>
                `).join("")
              : "<div>No archive data yet.</div>"
          }
        </div>
      </section>

      <div class="grid gap-4">
        ${renderSearchResults(results)}
      </div>
    </section>
  `;
}
