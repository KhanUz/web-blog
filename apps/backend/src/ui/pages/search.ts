import type { ArticleDocument } from "../../models/Article.js";
import { escapeHtml } from "../core/shell.js";
import { formatDate } from "../components/common.js";

type TagCount = {
    tag: string;
    count: number;
};

function renderSearchResults(results: ArticleDocument[]): string {
    return results.length > 0
        ? results
              .map(
                  (article) => `
        <article class="panel p-6">
          <p class="meta-pill inline-flex">${escapeHtml(article.categories.join(" / ") || "Article")}</p>
          <h3 class="section-title">${escapeHtml(article.title)}</h3>
          <p class="body-text mt-2">${escapeHtml(article.summary)}</p>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div class="text-sm text-stone-500">${escapeHtml(formatDate(article.publishedAt ?? article.createdAt))}</div>
            <a class="nav-chip" href="/articles/${escapeHtml(article.slug)}">Open article</a>
          </div>
        </article>
      `,
              )
              .join("")
        : `<p class="text-sm leading-7 text-stone-600">No articles matched the current query.</p>`;
}

export function renderSearchPage(
    query: string,
    results: ArticleDocument[],
    tags: TagCount[],
): string {
    return `
    <section class="space-y-8">
      <header>
        <p class="eyebrow">Search and tags</p>
        <h2 class="page-title">Full-text search over published writing</h2>
      </header>

      <section class="panel panel-pad">
        <form action="/search" method="get" class="space-y-5">
          <input
            class="field-search"
            type="search"
            name="q"
            placeholder="Search by title, phrase, or tag"
            value="${escapeHtml(query)}"
          />

          <div class="space-y-5">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-xs uppercase tracking-[0.25em] text-stone-500">Tags</p>
              ${tags.map((item) => `<a class="nav-chip" href="/search?q=${encodeURIComponent(item.tag)}">${escapeHtml(item.tag)} (${item.count})</a>`).join("")}
            </div>
          </div>
        </form>
      </section>

      <div class="grid gap-4">
        ${renderSearchResults(results)}
      </div>
    </section>
  `;
}
