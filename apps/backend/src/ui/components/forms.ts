import type { ArticleDocument } from "../../models/Article.js";
import type { ProfileDocument } from "../../models/Profile.js";
import type { UserDocument } from "../../models/User.js";
import { escapeHtml } from "../core/shell.js";
import { articleDisplayDate, renderTagList } from "./common.js";

export type AccountGuestMode = "login" | "register";

export function renderManageTable(articles: ArticleDocument[]): string {
  return `
    <section class="panel flex flex-1 flex-col overflow-hidden">
      <header class="panel-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium text-black">Your articles</p>
          <p class="body-text mt-1">
            Drafts, published pieces, and recalled posts all stay together in the owner workspace.
          </p>
        </div>
        <a class="nav-chip" href="/editor">Create new article</a>
      </header>
      <div class="flex-1 overflow-x-auto">
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
        <header class="panel-head-compact">
          <p class="text-sm font-medium text-black">Article details</p>
          <p class="body-text mt-1">Keep the post metadata together before moving into the main writing area.</p>
        </header>
        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <input class="field-input" name="title" type="text" placeholder="Article title" value="${escapeHtml(article?.title ?? "")}" required />
          <input class="field-input" name="slug" type="text" placeholder="optional-custom-slug" value="${escapeHtml(article?.slug ?? "")}" />
          <input class="field-input" name="categories" type="text" placeholder="Categories, comma separated" value="${escapeHtml(article?.categories.join(", ") ?? "")}" />
          <input class="field-input" name="tags" type="text" placeholder="Tags, comma separated" value="${escapeHtml(article?.tags.join(", ") ?? "")}" />
          <textarea class="field-textarea min-h-32 lg:col-span-2" name="summary" placeholder="Summary" required>${escapeHtml(article?.summary ?? "")}</textarea>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-2 xl:items-stretch" data-editor-shell>
        <section class="panel flex h-full flex-col p-5 sm:p-6">
          <header class="panel-head-compact">
            <p class="text-sm font-medium text-black">Content editor</p>
            <p class="body-text mt-1">Write the main article body here. Markdown updates the preview immediately.</p>
          </header>
          <div class="mt-5 flex-1">
            <textarea
              class="editor-textarea field-textarea min-h-[28rem] rounded-[1.5rem] py-4"
              name="content"
              data-editor-input
              required
            >${escapeHtml(article?.content ?? initialMarkdown)}</textarea>
          </div>
        </section>

        <section class="panel flex h-full flex-col p-5 sm:p-6">
          <header class="panel-head-compact">
            <p class="text-sm font-medium text-black">Preview</p>
            <p class="body-text mt-1">Headings, lists, links, and code blocks render as you type.</p>
          </header>
          <article class="markdown-preview flex-1 pt-5" data-editor-preview></article>
        </section>
      </div>

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
      <div class="mt-5">
        <div class="flex h-32 w-32 items-center justify-center rounded-full border border-white/15 text-3xl font-semibold text-white">
          ${escapeHtml((profile?.name ?? "WB").slice(0, 2).toUpperCase())}
        </div>
        <h3 class="section-title mt-4 text-white">${escapeHtml(profile?.name ?? "No profile yet")}</h3>
        <p class="body-text-muted mt-2">${escapeHtml(profile?.role ?? "Site profile data is not configured yet.")}</p>
        <p class="body-text-muted mt-4">${escapeHtml(profile?.bio ?? "Create site profile content in the backend to populate this panel.")}</p>
        <div class="flex flex-wrap gap-2">${renderTagList(profile?.topics ?? [])}</div>
      </div>
    </section>
  `;
}

export function renderAccountPanel(currentUser: UserDocument | null, guestMode: AccountGuestMode = "login"): string {
  if (currentUser) {
    return `
      <section class="panel p-6 sm:p-8">
        <p class="eyebrow">Account</p>
        <h3 class="section-title">Update your account</h3>
        <form class="mt-5 grid gap-4" action="/account/profile" method="post" hx-post="/account/profile" hx-push-url="false">
          <input class="field-input" name="name" type="text" value="${escapeHtml(currentUser.name)}" placeholder="Display name" required />
          <input class="field-input" name="avatarUrl" type="url" value="${escapeHtml(currentUser.avatarUrl)}" placeholder="Avatar URL" />
          <textarea class="field-textarea" name="bio" placeholder="Short bio">${escapeHtml(currentUser.bio)}</textarea>
          <input class="field-input" name="password" type="password" placeholder="New password (optional)" />
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-stone-500">Access: ${escapeHtml(currentUser.role)}</p>
            <button class="nav-chip" type="submit">Save profile</button>
          </div>
        </form>
        <div class="mt-4 flex justify-end">
          <form action="/auth/logout" method="post" hx-post="/auth/logout" hx-push-url="false">
            <button class="nav-chip" type="submit">Log out</button>
          </form>
        </div>
      </section>
    `;
  }

  const showLogin = guestMode !== "register";

  return `
    <section class="panel p-6 sm:p-8">
      <div class="panel-head-compact flex flex-wrap gap-2">
        <a class="nav-chip" data-active="${String(showLogin)}" href="/account">Log in</a>
        <a class="nav-chip" data-active="${String(!showLogin)}" href="/account?mode=register">Sign in</a>
      </div>
      ${
        showLogin
          ? `
            <h3 class="section-title mt-5">Log in</h3>
            <form class="mt-5 grid gap-4" action="/auth/login" method="post" hx-post="/auth/login" hx-push-url="false">
              <input class="field-input" name="email" type="email" placeholder="Email" required />
              <input class="field-input" name="password" type="password" placeholder="Password" required />
              <div class="flex justify-end">
                <button class="nav-chip" type="submit">Log in</button>
              </div>
            </form>
            <div class="body-text mt-4">
              <p class="font-medium text-black">Demo credentials</p>
              <p class="mt-2">Viewer: <code>viewer@example.com</code> / <code>viewer123</code></p>
              <p>Owner: <code>owner@example.com</code> / <code>owner123</code></p>
            </div>
          `
          : `
            <h3 class="section-title mt-5">Create a viewer account</h3>
            <p class="body-text mt-3">Reading stays open to everyone. Create a viewer account if you want to comment and keep a simple public profile.</p>
            <form class="mt-5 grid gap-4" action="/auth/register" method="post" hx-post="/auth/register" hx-push-url="false">
              <input class="field-input" name="name" type="text" placeholder="Name" required />
              <input class="field-input" name="email" type="email" placeholder="Email" required />
              <input class="field-input" name="password" type="password" placeholder="Password" required />
              <input class="field-input" name="avatarUrl" type="url" placeholder="Avatar URL" />
              <textarea class="field-textarea" name="bio" placeholder="Short bio"></textarea>
              <div class="flex justify-end">
                <button class="nav-chip" type="submit">Create viewer account</button>
              </div>
            </form>
          `
      }
    </section>
  `;
}
