import type { ArticleDocument } from "../../models/Article.js";
import type { CommentDocument } from "../../models/Comment.js";
import { escapeHtml } from "../html.js";
import type { TocItem } from "../markdown.js";
import { articleDisplayDate, formatDate, renderEmptyState } from "./common.js";

export function renderArticleCard(article: ArticleDocument): string {
  return `
    <article class="panel p-6">
      <p class="eyebrow">${escapeHtml(article.categories[0] ?? "Article")}</p>
      <h4 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">${escapeHtml(article.title)}</h4>
      <p class="mt-3 text-sm leading-7 text-stone-600">${escapeHtml(article.summary)}</p>
      <div class="mt-4 space-y-2 text-sm text-stone-500">
        <div>${escapeHtml(articleDisplayDate(article))}</div>
        <div>By ${escapeHtml(article.authorName)}</div>
      </div>
      <a class="mt-4 inline-flex nav-chip" href="/articles/${escapeHtml(article.slug)}">Read</a>
    </article>
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
      <div class="border-b border-black/10 px-6 py-4 sm:px-8">
        <p class="eyebrow">Similar posts</p>
        <h3 class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-black">Continue reading</h3>
      </div>
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
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="eyebrow">Discussion</p>
          <h3 class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-black">Join the conversation</h3>
          <p class="mt-3 text-sm leading-7 text-stone-600">${comments.length} visible response${comments.length === 1 ? "" : "s"} so far.</p>
        </div>
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
                <input class="rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="authorName" type="text" placeholder="Display name" value="${escapeHtml(currentUserName)}" required />
                <textarea class="min-h-28 rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="body" placeholder="Share a thoughtful response" required></textarea>
                <div class="flex justify-end">
                  <button class="nav-chip" type="submit">Post comment</button>
                </div>
              </form>
            `
            : `
              <div class="w-full max-w-xl rounded-[1.5rem] border border-black/10 bg-stone-50 p-5 text-sm leading-7 text-stone-600">
                Sign in as a viewer or the owner to join the discussion. Readers without an account can still browse the article and existing comments.
              </div>
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
                  <p class="mt-3 text-sm leading-7 text-stone-700">${escapeHtml(comment.body)}</p>
                </article>
              `).join("")
            : renderEmptyState("No comments yet.")
        }
      </div>
    </section>
  `;
}
