import type { ArticleDocument } from "../../models/Article.js";
import type { ProfileDocument } from "../../models/Profile.js";
import type { UserDocument } from "../../models/User.js";
import { escapeHtml } from "../html.js";
import { articleDisplayDate, renderTagList } from "./common.js";

export function renderManageTable(articles: ArticleDocument[]): string {
  return `
    <section class="panel overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-black/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p class="text-sm font-medium text-black">Your articles</p>
          <p class="mt-1 text-sm text-stone-500">
            Drafts, published pieces, and recalled posts all stay together in the owner workspace.
          </p>
        </div>
        <a class="nav-chip" href="/editor">Create new article</a>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-black/10 bg-stone-50 text-stone-500">
            <tr>
              <th class="px-6 py-4 font-medium sm:px-8">Article</th>
              <th class="px-6 py-4 font-medium">Author</th>
              <th class="px-6 py-4 font-medium">Status</th>
              <th class="px-6 py-4 font-medium text-right sm:px-8">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              articles.length > 0
                ? articles.map((article) => `
                    <tr class="border-b border-black/5 last:border-b-0">
                      <td class="px-6 py-5 sm:px-8">
                        <p class="font-medium text-black">${escapeHtml(article.title)}</p>
                        <p class="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">${escapeHtml(articleDisplayDate(article))}</p>
                      </td>
                      <td class="px-6 py-5">${escapeHtml(article.authorName)}</td>
                      <td class="px-6 py-5">${escapeHtml(article.status)}</td>
                      <td class="px-6 py-5 text-right sm:px-8">
                        <div class="inline-flex flex-wrap justify-end gap-2">
                          <a class="nav-chip" href="/editor/${String(article._id)}">Edit</a>
                          <a class="nav-chip" href="/articles/${escapeHtml(article.slug)}">View</a>
                          <form class="contents" action="/manage/articles/${String(article._id)}/${article.status === "published" ? "recall" : "publish"}" method="post" hx-post="/manage/articles/${String(article._id)}/${article.status === "published" ? "recall" : "publish"}" hx-push-url="false">
                            <button class="nav-chip" type="submit">${article.status === "published" ? "Recall" : "Publish"}</button>
                          </form>
                          <form class="contents" action="/manage/articles/${String(article._id)}/remove" method="post" hx-post="/manage/articles/${String(article._id)}/remove" hx-push-url="false">
                            <button class="nav-chip" type="submit">Remove</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  `).join("")
                : `<tr><td class="px-6 py-5 text-stone-500 sm:px-8" colspan="4">No articles are available in the owner workspace yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderEditorForm(article: ArticleDocument | null, initialMarkdown: string): string {
  return `
    <form action="${article ? `/manage/articles/${String(article._id)}` : "/manage/articles"}" method="post" class="space-y-6">
      <section class="panel p-5 sm:p-6">
        <div class="border-b border-black/10 pb-4">
          <div>
            <p class="text-sm font-medium text-black">Article details</p>
            <p class="mt-1 text-sm text-stone-500">Keep the post metadata together before moving into the main writing area.</p>
          </div>
        </div>
        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="title" type="text" placeholder="Article title" value="${escapeHtml(article?.title ?? "")}" required />
          <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="slug" type="text" placeholder="optional-custom-slug" value="${escapeHtml(article?.slug ?? "")}" />
          <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="categories" type="text" placeholder="Categories, comma separated" value="${escapeHtml(article?.categories.join(", ") ?? "")}" />
          <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="tags" type="text" placeholder="Tags, comma separated" value="${escapeHtml(article?.tags.join(", ") ?? "")}" />
          <textarea class="min-h-32 w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 leading-7 outline-none transition focus:border-black lg:col-span-2" name="summary" placeholder="Summary" required>${escapeHtml(article?.summary ?? "")}</textarea>
        </div>
      </section>

      <section class="panel flex h-full flex-col p-5 sm:p-6">
        <div class="border-b border-black/10 pb-4">
          <div>
            <p class="text-sm font-medium text-black">Content editor</p>
            <p class="mt-1 text-sm text-stone-500">Write the main article body here.</p>
          </div>
        </div>
        <div class="mt-5 flex-1">
          <textarea class="editor-textarea h-full min-h-[28rem] w-full rounded-[1.5rem] border border-black/10 bg-stone-50 px-4 py-4 leading-7 outline-none transition focus:border-black" name="content" required>${escapeHtml(article?.content ?? initialMarkdown)}</textarea>
        </div>
      </section>

      <div class="flex flex-wrap gap-2">
        <button class="nav-chip" type="submit" name="intent" value="draft">${escapeHtml(article ? "Update draft" : "Save draft")}</button>
        <button class="nav-chip" type="submit" name="intent" value="publish">Publish</button>
      </div>
    </form>
  `;
}

export function renderProfilePanel(profile: ProfileDocument | null): string {
  return `
    <section class="panel-muted p-6 sm:p-8">
      <p class="eyebrow !text-stone-400">About the blog</p>
      <div class="mt-5 space-y-4">
        <div class="flex h-32 w-32 items-center justify-center rounded-full border border-white/15 text-3xl font-semibold text-white">
          ${escapeHtml((profile?.name ?? "WB").slice(0, 2).toUpperCase())}
        </div>
        <div>
          <h3 class="text-2xl font-semibold tracking-[-0.03em] text-white">${escapeHtml(profile?.name ?? "No profile yet")}</h3>
          <p class="mt-2 text-sm leading-7 text-stone-300">${escapeHtml(profile?.role ?? "Site profile data is not configured yet.")}</p>
        </div>
        <p class="text-sm leading-7 text-stone-300">${escapeHtml(profile?.bio ?? "Create site profile content in the backend to populate this panel.")}</p>
        <div class="flex flex-wrap gap-2">${renderTagList(profile?.topics ?? [])}</div>
      </div>
    </section>
  `;
}

export function renderAccountPanel(currentUser: UserDocument | null): string {
  if (currentUser) {
    return `
      <section class="panel p-6 sm:p-8">
        <p class="eyebrow">Account</p>
        <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">Update your account</h3>
        <form class="mt-5 grid gap-4" action="/account/profile" method="post" hx-post="/account/profile" hx-push-url="false">
          <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="name" type="text" value="${escapeHtml(currentUser.name)}" placeholder="Display name" required />
          <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="avatarUrl" type="url" value="${escapeHtml(currentUser.avatarUrl)}" placeholder="Avatar URL" />
          <textarea class="min-h-28 w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 leading-7 outline-none transition focus:border-black" name="bio" placeholder="Short bio">${escapeHtml(currentUser.bio)}</textarea>
          <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="password" type="password" placeholder="New password (optional)" />
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-stone-500">Access: ${escapeHtml(currentUser.role)}</p>
            <button class="nav-chip" type="submit">Save profile</button>
          </div>
        </form>
      </section>
    `;
  }

  return `
    <section class="panel p-6 sm:p-8">
      <p class="eyebrow">Account</p>
      <div class="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">Log in</h3>
          <form class="mt-5 grid gap-4" action="/auth/login" method="post" hx-post="/auth/login" hx-push-url="false">
            <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="email" type="email" placeholder="Email" required />
            <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="password" type="password" placeholder="Password" required />
            <div class="flex justify-end">
              <button class="nav-chip" type="submit">Log in</button>
            </div>
          </form>
          <div class="mt-4 text-sm text-stone-600">
            <p class="font-medium text-black">Demo credentials</p>
            <div class="mt-2">Viewer: <code>viewer@example.com</code> / <code>viewer123</code></div>
            <div>Owner: <code>owner@example.com</code> / <code>owner123</code></div>
          </div>
        </div>

        <div>
          <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">Create a viewer account</h3>
          <p class="mt-3 text-sm leading-7 text-stone-600">Reading stays open to everyone. Create a viewer account if you want to comment and keep a simple public profile.</p>
          <form class="mt-5 grid gap-4" action="/auth/register" method="post" hx-post="/auth/register" hx-push-url="false">
            <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="name" type="text" placeholder="Name" required />
            <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="email" type="email" placeholder="Email" required />
            <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="password" type="password" placeholder="Password" required />
            <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="avatarUrl" type="url" placeholder="Avatar URL" />
            <textarea class="min-h-28 w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 leading-7 outline-none transition focus:border-black" name="bio" placeholder="Short bio"></textarea>
            <div class="flex justify-end">
              <button class="nav-chip" type="submit">Create viewer account</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;
}
