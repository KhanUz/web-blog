import type { ActorRole } from "../../types/blog.js";
import type { UserDocument } from "../../models/User.js";
import { renderFrontendAssetTags } from "./assets.js";

export type Notice = {
    tone: "ok" | "error";
    message: string;
};

export type ShellPage = {
    title: string;
    activePage:
        | "home"
        | "article"
        | "manage"
        | "editor"
        | "search"
        | "about"
        | "account";
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

    const toneClass =
        notice.tone === "ok" ? "notice-ok" : "notice-error";

    return `
    <div class="notice ${toneClass}">
      ${escapeHtml(notice.message)}
    </div>
  `;
}

function renderNavChip(href: string, label: string, active: boolean): string {
    return `<a class="nav-chip" data-active="${String(active)}" href="${href}">${label}</a>`;
}

function renderAccountNav(
    currentUser: UserDocument | null,
    active: boolean,
): string {
    return renderNavChip(
        "/account",
        currentUser ? "Account" : "Sign in",
        active,
    );
}

export function renderAppShell(page: ShellPage): string {
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
      <div class="w-full border-b border-black/10">
        <div class="app-frame py-2">
          <nav class="site-nav" aria-label="Primary">
            <div class="site-nav__inner">
              ${renderNavChip("/", "Home", page.activePage === "home")}
              ${canManageBlogs ? renderNavChip("/manage", "Management", page.activePage === "manage") : ""}
              ${canManageBlogs ? renderNavChip("/editor", "Editor", page.activePage === "editor") : ""}
              ${renderNavChip("/search", "Search", page.activePage === "search")}
              ${renderNavChip("/about", "About", page.activePage === "about")}
              ${renderAccountNav(page.currentUser, page.activePage === "account")}
            </div>
          </nav>
        </div>
      </div>

      <main class="site-main w-full py-8 lg:py-10">
        <div class="app-frame site-main__frame space-y-4">
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
