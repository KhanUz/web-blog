import type { DomRefs } from "./types";

function initializeShell(): DomRefs {
  const app = document.querySelector<HTMLDivElement>("#app");

  if (!app) {
    throw new Error("App container not found.");
  }

  app.innerHTML = `
    <div class="site-shell min-h-screen">
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

          <nav id="primary-nav" class="flex flex-wrap gap-2 border-t border-black/10 pt-4" aria-label="Primary"></nav>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div id="page-shell">
          <div class="space-y-3">
            <div class="skeleton h-5 w-28"></div>
            <div class="skeleton h-16 w-full"></div>
            <div class="grid gap-4 lg:grid-cols-3">
              <div class="skeleton h-40"></div>
              <div class="skeleton h-40"></div>
              <div class="skeleton h-40"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <dialog id="login-dialog" class="login-dialog">
      <form method="dialog" class="login-dialog__backdrop"></form>
      <div class="login-dialog__panel">
        <div class="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
          <div>
            <p class="eyebrow">Sign in</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-black">Access your account</h2>
          </div>
          <button class="nav-chip" type="button" data-close-login>Close</button>
        </div>
        <form class="grid gap-4 px-6 py-5" data-login-form>
          <input class="w-full rounded-[1rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="email" type="email" placeholder="Email" required />
          <input class="w-full rounded-[1rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="password" type="password" placeholder="Password" required />
          <div class="flex justify-end">
            <button class="nav-chip" type="submit">Log in</button>
          </div>
        </form>
        <div id="login-feedback" class="px-6 pb-4"></div>
        <div class="border-t border-black/10 px-6 py-5 text-sm text-stone-600">
          <p class="font-medium text-black">Demo credentials</p>
          <div class="mt-2">Viewer: <code>viewer@example.com</code> / <code>viewer123</code></div>
          <div>Owner: <code>owner@example.com</code> / <code>owner123</code></div>
        </div>
      </div>
    </dialog>
  `;

  const pageShell = document.querySelector<HTMLElement>("#page-shell");
  const primaryNav = document.querySelector<HTMLElement>("#primary-nav");
  const loginDialog = document.querySelector<HTMLDialogElement>("#login-dialog");

  if (!pageShell || !primaryNav || !loginDialog) {
    throw new Error("Required shell elements were not found.");
  }

  return { pageShell, primaryNav, loginDialog };
}

export const dom = initializeShell();
