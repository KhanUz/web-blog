import type { ArticleDocument } from "../../models/Article.js";
import type { CommentDocument } from "../../models/Comment.js";
import { escapeHtml } from "../core/shell.js";
import type { TocItem } from "../core/markdown.js";
import { articleDisplayDate, formatDate, renderEmptyState } from "./common.js";

export function renderArticleCard(article: ArticleDocument): string {
  return `
    <a class="panel block p-6 transition hover:border-black/20 hover:bg-white" href="/articles/${escapeHtml(article.slug)}">
      <p class="eyebrow">${escapeHtml(article.categories[0] ?? "Article")}</p>
      <h4 class="section-title">${escapeHtml(article.title)}</h4>
      <p class="body-text">${escapeHtml(article.summary)}</p>
      <div class="mt-4 space-y-2 text-sm text-stone-500">
        <div>${escapeHtml(articleDisplayDate(article))}</div>
        <div>By ${escapeHtml(article.authorName)}</div>
      </div>
    </a>
  `;
}

export function renderToc(items: TocItem[]): string {
  if (items.length === 0) {
    return "";
  }

  return `
    <aside class="hidden lg:sticky lg:top-6 lg:block lg:self-start">
      <div class="panel max-h-[calc(100vh-3rem)] overflow-hidden">
        <div class="border-b border-black/10 px-5 py-4">
          <p class="text-sm font-medium text-black">On this page</p>
        </div>
        <div class="max-h-[calc(100vh-7.5rem)] space-y-2 overflow-y-auto px-5 py-4 text-sm">
          ${items.map((item) => `
            <a class="toc-link ${item.level === 2 ? "pl-4" : item.level === 3 ? "pl-7" : ""}" href="#${escapeHtml(item.id)}">
              ${escapeHtml(item.label)}
            </a>
          `).join("")}
        </div>
      </div>
    </aside>
  `;
}

export function renderRelatedArticles(related: ArticleDocument[]): string {
  return `
    <section class="panel overflow-hidden">
      <header class="panel-head">
        <p class="eyebrow">Similar posts</p>
        <h3 class="section-title">Continue reading</h3>
      </header>
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-black/10 text-stone-500">
            <tr>
              <th class="px-6 py-4 font-medium sm:px-8">Title</th>
              <th class="px-6 py-4 font-medium">Date</th>
              <th class="px-6 py-4 font-medium">Author</th>
            </tr>
          </thead>
          <tbody>
            ${
              related.length > 0
                ? related.map((item) => `
                    <tr class="border-b border-black/5 last:border-b-0">
                      <td class="px-6 py-4 sm:px-8">
                        <a class="font-medium text-black" href="/articles/${escapeHtml(item.slug)}">${escapeHtml(item.title)}</a>
                      </td>
                      <td class="px-6 py-4">${escapeHtml(articleDisplayDate(item))}</td>
                      <td class="px-6 py-4">${escapeHtml(item.authorName)}</td>
                    </tr>
                  `).join("")
                : `<tr><td class="px-6 py-4 text-stone-500 sm:px-8" colspan="3">No related published posts available.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderComments(article: ArticleDocument, comments: CommentDocument[], canComment: boolean, currentUserName: string): string {
  return `
    <section id="comments" class="panel p-6 sm:p-8">
      <div class="page-header items-start gap-5">
        <header>
          <p class="eyebrow">Discussion</p>
          <h3 class="section-title">Join the conversation</h3>
          <p class="body-text">${comments.length} visible response${comments.length === 1 ? "" : "s"} so far.</p>
        </header>
        ${
          canComment
            ? `
              <form
                class="grid w-full max-w-xl gap-3"
                action="/articles/${escapeHtml(article.slug)}/comments"
                method="post"
                hx-post="/articles/${escapeHtml(article.slug)}/comments"
                hx-push-url="false"
              >
                <input class="field-input" name="authorName" type="text" placeholder="Display name" value="${escapeHtml(currentUserName)}" required />
                <textarea class="field-textarea" name="body" placeholder="Share a thoughtful response" required></textarea>
                <div class="flex justify-end">
                  <button class="nav-chip" type="submit">Post comment</button>
                </div>
              </form>
            `
            : `
              <p class="body-text w-full max-w-xl rounded-[1.5rem] border border-black/10 bg-stone-50 p-5">
                Sign in as a viewer or the owner to join the discussion. Readers without an account can still browse the article and existing comments.
              </p>
            `
        }
      </div>
      <div class="mt-6 space-y-4">
        ${
          comments.length > 0
            ? comments.map((comment) => `
                <article class="rounded-[1.5rem] border border-black/10 bg-stone-50 p-5">
                  <div class="flex items-center justify-between gap-4">
                    <p class="font-medium text-black">${escapeHtml(comment.authorName)}</p>
                    <p class="text-sm text-stone-500">${escapeHtml(formatDate(comment.createdAt))}</p>
                  </div>
                  <p class="body-text mt-3 text-stone-700">${escapeHtml(comment.body)}</p>
                </article>
              `).join("")
            : renderEmptyState("No comments yet.")
        }
      </div>
    </section>
  `;
}
