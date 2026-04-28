import type { ActorRole } from "../types/blog.js";
import type { UserDocument } from "../models/User.js";
import { renderFrontendAssetTags } from "./assets.js";

export type Notice = {
  tone: "ok" | "error";
  message: string;
};

export type ShellPage = {
  title: string;
  activePage: "home" | "article" | "manage" | "editor" | "search" | "about";
  currentPath: string;
  currentUser: UserDocument | null;
  actorRole: ActorRole;
  articleHref?: string;
  notice?: Notice;
  content: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderNotice(notice?: Notice): string {
  if (!notice) {
    return "";
  }

  const toneClass = notice.tone === "ok"
    ? "border-black/10 bg-stone-50 text-stone-700"
    : "border-red-200 bg-red-50 text-red-700";

  return `
    <div class="rounded-[1rem] border px-4 py-3 text-sm ${toneClass}">
      ${escapeHtml(notice.message)}
    </div>
  `;
}

function renderNavChip(href: string, label: string, active: boolean): string {
  return `<a class="nav-chip" data-active="${String(active)}" href="${href}">${label}</a>`;
}

function renderAuthControls(currentUser: UserDocument | null): string {
  if (!currentUser) {
    return `<a class="nav-chip" href="/about">Sign in</a>`;
  }

  return `
    <form
      action="/auth/logout"
      method="post"
      hx-post="/auth/logout"
      hx-push-url="false"
      class="contents"
    >
      <button class="nav-chip" type="submit">Log out</button>
    </form>
  `;
}

export function renderAppShell(page: ShellPage): string {
  const articleHref = page.articleHref ?? "/article";
  const canManageBlogs = page.actorRole === "owner";

  return `
    <div
      id="app-shell"
      class="site-shell min-h-screen"
      hx-boost="true"
      hx-target="#app-shell"
      hx-select="#app-shell"
      hx-swap="outerHTML"
      hx-push-url="true"
    >
      <header class="border-b border-black/10">
        <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
          <div class="space-y-3">
            <p class="text-[0.65rem] uppercase tracking-[0.45em] text-stone-500">Web Blog / Publishing Notes</p>
            <div class="space-y-2">
              <h1 class="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-black sm:text-5xl">
                A clean publishing workspace for one owner and a wider reading audience.
              </h1>
              <p class="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                Readers can discover posts, follow the article structure, and join the discussion. The owner gets a focused writing and publishing workflow.
              </p>
            </div>
          </div>

          <nav class="flex flex-wrap gap-2 border-t border-black/10 pt-4" aria-label="Primary">
            ${renderNavChip("/", "Home", page.activePage === "home")}
            ${renderNavChip(articleHref, "Article View", page.activePage === "article")}
            ${canManageBlogs ? renderNavChip("/manage", "Management", page.activePage === "manage") : ""}
            ${canManageBlogs ? renderNavChip("/editor", "Editor", page.activePage === "editor") : ""}
            ${renderNavChip("/search", "Search", page.activePage === "search")}
            ${renderNavChip("/about", "About / Account", page.activePage === "about")}
            ${renderAuthControls(page.currentUser)}
          </nav>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div class="space-y-4">
          ${renderNotice(page.notice)}
          ${page.content}
        </div>
      </main>
    </div>
  `;
}

export function renderDocument(page: ShellPage): string {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(page.title)}</title>
        <script src="/vendor/htmx.min.js" defer></script>
        ${renderFrontendAssetTags()}
      </head>
      <body>
        ${renderAppShell(page)}
      </body>
    </html>
  `;
}
