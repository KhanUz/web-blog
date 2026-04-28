import type { ArticleDocument } from "../../models/Article.js";
import type { ProfileDocument } from "../../models/Profile.js";
import { escapeHtml } from "../core/shell.js";
import { renderArticleCard } from "../components/articles.js";
import { renderTagList } from "../components/common.js";

export function renderHomePage(profile: ProfileDocument | null, articles: ArticleDocument[]): string {
  const featured = articles[0];
  const highlights = articles.slice(0, 3);

  return `
    <section class="space-y-8">
      <div class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article class="panel p-6 sm:p-8">
          <p class="eyebrow">About this publication</p>
          <h2 class="page-title max-w-3xl sm:text-5xl">
            ${escapeHtml(profile?.name ?? "Olim")}
          </h2>
          <p class="mt-3 text-sm uppercase tracking-[0.28em] text-stone-500">${escapeHtml(profile?.role ?? "Designer, developer, and independent publisher")}</p>
          <p class="mt-5 max-w-3xl text-base leading-8 text-stone-700">
            ${escapeHtml(profile?.bio ?? "This site is a place to write clearly about interface design, practical frontend engineering, and the systems behind thoughtful publishing.")}
          </p>
          <div class="mt-6 flex flex-wrap gap-2">${renderTagList(profile?.topics ?? [])}</div>
        </article>

        <aside class="panel-muted p-6 sm:p-8">
          <p class="eyebrow !text-stone-400">Why this blog exists</p>
          <div class="body-text-muted mt-4 space-y-4">
            <p>This blog gathers notes on design systems, content structure, editorial tooling, and the practical tradeoffs that shape day-to-day product work.</p>
            <p>The goal is simple: publish writing that is direct, useful, and calm enough to read without distraction.</p>
          </div>
          ${featured
            ? `
              <div class="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p class="text-xs uppercase tracking-[0.25em] text-stone-400">Featured article</p>
                <h3 class="section-title text-white">${escapeHtml(featured.title)}</h3>
                <p class="body-text-muted mt-3">${escapeHtml(featured.summary)}</p>
                <a class="mt-4 inline-flex nav-chip border-white/10 bg-white/10 text-white hover:border-white hover:text-white" href="/articles/${escapeHtml(featured.slug)}">
                  Read featured post
                </a>
              </div>
            `
            : ""}
        </aside>
      </div>

      <section class="panel p-6 sm:p-8">
        <div class="page-header items-start gap-6">
          <header>
            <p class="eyebrow">Start reading</p>
            <h3 class="section-title-lg">Recent articles</h3>
          </header>
          <p class="body-text max-w-2xl">
            A short path into the writing, with recent posts linked directly from the homepage.
          </p>
        </div>
        <div class="mt-6 grid gap-5 lg:grid-cols-3">
          ${highlights.length > 0 ? highlights.map(renderArticleCard).join("") : `<p class="text-sm leading-7 text-stone-600">No published articles available.</p>`}
        </div>
      </section>
    </section>
  `;
}
