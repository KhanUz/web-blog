import type { ArticleDocument } from "../../models/Article.js";
import type { CommentDocument } from "../../models/Comment.js";
import { escapeHtml } from "../html.js";
import { renderArticleContent } from "../markdown.js";
import { renderComments, renderRelatedArticles, renderToc } from "../components/articles.js";
import { articleDisplayDate } from "../components/common.js";

export function renderArticlePage(
  article: ArticleDocument,
  comments: CommentDocument[],
  related: ArticleDocument[],
  currentUserName: string
): string {
  const articleContent = renderArticleContent(article.content);
  const tocItems = [...articleContent.toc, { id: "comments", label: "Comments", level: 2 as const }];

  return `
    <section class="space-y-8">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Article</p>
          <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">${escapeHtml(article.title)}</h2>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-stone-600">${escapeHtml(article.summary)}</p>
        </div>
        <div class="text-right text-sm text-stone-500">
          <div>${escapeHtml(articleDisplayDate(article))}</div>
          <div class="mt-1">By ${escapeHtml(article.authorName)}</div>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        ${renderToc(tocItems)}

        <div class="space-y-6">
          <article class="panel px-6 py-8 sm:px-10 sm:py-12">
            <div class="flex flex-wrap items-center gap-3 border-b border-black/10 pb-6">
              <span class="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-stone-500">${escapeHtml(articleDisplayDate(article))}</span>
              <span class="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-stone-500">${escapeHtml(article.authorName)}</span>
              ${article.categories.map((category) => `
                <span class="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-stone-500">${escapeHtml(category)}</span>
              `).join("")}
            </div>

            <div class="article-copy pt-8">${articleContent.html}</div>
          </article>

          ${renderRelatedArticles(related)}
          ${renderComments(article, comments, currentUserName.length > 0, currentUserName)}
        </div>
      </div>
    </section>
  `;
}
