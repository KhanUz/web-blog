import type { ArticleDocument } from "../../models/Article.js";
import type { CommentDocument } from "../../models/Comment.js";
import { escapeHtml } from "../core/shell.js";
import { renderArticleContent } from "../core/markdown.js";
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
      <header class="page-header">
        <div>
          <p class="eyebrow">Article</p>
          <h2 class="page-title">${escapeHtml(article.title)}</h2>
          <p class="body-text max-w-3xl">${escapeHtml(article.summary)}</p>
        </div>
        <div class="text-right text-sm text-stone-500">
          <div>${escapeHtml(articleDisplayDate(article))}</div>
          <div class="mt-1">By ${escapeHtml(article.authorName)}</div>
        </div>
      </header>

      <div class="article-layout">
        ${renderToc(tocItems)}

        <div class="space-y-6">
          <article class="panel px-6 py-8 sm:px-10 sm:py-12">
            <div class="flex flex-wrap items-center gap-3 border-b border-black/10 pb-6">
              <span class="meta-pill">${escapeHtml(articleDisplayDate(article))}</span>
              <span class="meta-pill">${escapeHtml(article.authorName)}</span>
              ${article.categories.map((category) => `
                <span class="meta-pill">${escapeHtml(category)}</span>
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
