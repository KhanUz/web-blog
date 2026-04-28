import { dom } from "./dom";
import { escapeHtml } from "./helpers";
import { state } from "./state";
import type { AppPage } from "./types";

function syncActiveNav(pageName: AppPage): void {
  const navItems = document.querySelectorAll<HTMLButtonElement>("[data-nav-link]");
  navItems.forEach((item) => {
    item.dataset.active = String(item.dataset.page === pageName);
  });
}

export function renderNav(): void {
  const canManageBlogs = state.session.capabilities.canManageBlogs;
  const pageButtons = [
    { page: "home", label: "Home", visible: true },
    { page: "article", label: "Article View", visible: true },
    { page: "manage", label: "Management", visible: canManageBlogs },
    { page: "editor", label: "Editor", visible: canManageBlogs },
    { page: "search", label: "Search", visible: true },
    { page: "about", label: "About / Account", visible: true }
  ]
    .filter((item) => item.visible)
    .map((item) => `<button class="nav-chip" data-nav-link data-page="${item.page}">${item.label}</button>`)
    .join("");

  const authButton = state.session.currentUser
    ? `<button class="nav-chip" type="button" data-logout>Log out</button>`
    : `<button class="nav-chip" type="button" data-open-login>Log in</button>`;

  dom.primaryNav.innerHTML = `${pageButtons}${authButton}`;
}

export function openLoginDialog(): void {
  const feedback = document.querySelector<HTMLElement>("#login-feedback");
  if (feedback) {
    feedback.innerHTML = "";
  }

  if (!dom.loginDialog.open) {
    dom.loginDialog.showModal();
  }
}

export function closeLoginDialog(): void {
  if (dom.loginDialog.open) {
    dom.loginDialog.close();
  }
}

export function syncChrome(): void {
  renderNav();
  syncActiveNav(state.currentPage);
}

export function setPageLoading(): void {
  dom.pageShell.innerHTML = `
    <div class="space-y-3">
      <div class="skeleton h-5 w-28"></div>
      <div class="skeleton h-16 w-full"></div>
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="skeleton h-40"></div>
        <div class="skeleton h-40"></div>
        <div class="skeleton h-40"></div>
      </div>
    </div>
  `;
}

export function renderError(message: string): void {
  dom.pageShell.innerHTML = `
    <section class="panel p-6 sm:p-8">
      <p class="eyebrow">Error</p>
      <h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black">The frontend could not load the requested data</h2>
      <p class="mt-4 text-sm leading-7 text-stone-600">${escapeHtml(message)}</p>
    </section>
  `;
}

export function renderAccessDenied(title: string, description: string): void {
  dom.pageShell.innerHTML = `
    <section class="panel p-6 sm:p-8">
      <p class="eyebrow">Restricted</p>
      <h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black">${escapeHtml(title)}</h2>
      <p class="mt-4 text-sm leading-7 text-stone-600">${escapeHtml(description)}</p>
    </section>
  `;
}
