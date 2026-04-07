import "./styles.css";
import { marked } from "marked";

type ArticleStatus = "draft" | "published" | "recalled";
type UserRole = "viewer" | "owner";

type Article = {
  id: string;
  authorId: string | null;
  authorName: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  categories: string[];
  tags: string[];
  status: ArticleStatus;
  publishedAt: string | null;
  removedFromSiteAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Comment = {
  id: string;
  articleId: string;
  authorName: string;
  body: string;
  status: "approved";
  createdAt: string;
  updatedAt: string;
};

type Profile = {
  id: string;
  name: string;
  role: string;
  bio: string;
  topics: string[];
  links: Array<{ label: string; url: string }>;
};

type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type SessionCapabilities = {
  canManageBlogs: boolean;
  canManageComments: boolean;
  canManageAccounts: boolean;
  canEditOwnProfile: boolean;
};

type Session = {
  currentUser: User | null;
  capabilities: SessionCapabilities;
};

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  categories: string[];
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
};

type AppPage = "home" | "article" | "manage" | "editor" | "search" | "about";

type AppState = {
  currentPage: AppPage;
  articleList: Article[];
  selectedArticleId: string | null;
  editorArticleId: string | null;
  searchQuery: string;
  session: Session;
};

type PreviewElements = {
  input: HTMLTextAreaElement;
  output: HTMLElement;
};

const STORAGE_KEY = "web-blog-session-token";
const INITIAL_MARKDOWN = `# Designing Calm Interfaces

Minimal blog systems should disappear behind the writing.

## Why this layout works

- The navigation stays available but does not follow the reader.
- The table of contents helps with long-form articles.
- The reading column gets the majority of the width.

### Editorial rhythm

Thoughtful spacing creates structure without relying on heavy decoration.
`;

const EMPTY_CAPABILITIES: SessionCapabilities = {
  canManageBlogs: false,
  canManageComments: false,
  canManageAccounts: false,
  canEditOwnProfile: false
};

const state: AppState = {
  currentPage: "home",
  articleList: [],
  selectedArticleId: null,
  editorArticleId: null,
  searchQuery: "",
  session: {
    currentUser: null,
    capabilities: EMPTY_CAPABILITIES
  }
};

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

const pageShellElement = document.querySelector<HTMLElement>("#page-shell");
const primaryNavElement = document.querySelector<HTMLElement>("#primary-nav");
const loginDialogElement = document.querySelector<HTMLDialogElement>("#login-dialog");

if (!pageShellElement || !primaryNavElement || !loginDialogElement) {
  throw new Error("Required shell elements were not found.");
}

const pageShell: HTMLElement = pageShellElement;
const primaryNav: HTMLElement = primaryNavElement;
const loginDialog: HTMLDialogElement = loginDialogElement;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type TocItem = {
  id: string;
  label: string;
  level: 1 | 2 | 3;
};

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function createMarkedRenderer(toc?: TocItem[]) {
  const usedIds = new Map<string, number>();
  const renderer = new marked.Renderer();

  const getUniqueId = (label: string) => {
    const base = slugifyHeading(label) || "section";
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  renderer.link = ({ href, title, tokens }) => {
    const text = renderer.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer"${titleAttr}>${text}</a>`;
  };

  renderer.heading = ({ tokens, depth }) => {
    const text = renderer.parser.parseInline(tokens);
    const label = tokens.map((token) => ("text" in token ? String(token.text) : "")).join("").trim() || "Section";
    const level = Math.min(depth, 3) as 1 | 2 | 3;
    const id = getUniqueId(label);

    if (toc) {
      toc.push({ id, label, level });
    }

    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  return renderer;
}

function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, {
    gfm: true,
    breaks: false,
    renderer: createMarkedRenderer()
  }) as string;
}

function renderArticleContent(markdown: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const html = marked.parse(markdown, {
    gfm: true,
    breaks: false,
    renderer: createMarkedRenderer(toc)
  }) as string;

  return { html, toc };
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Unpublished";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function articleDisplayDate(article: Pick<Article, "publishedAt" | "createdAt">): string {
  return formatDate(article.publishedAt ?? article.createdAt);
}

function getStoredSessionToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function setStoredSessionToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredSessionToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const authHeaders = getAuthHeaders();

  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      // Preserve generic failure text when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function loadSession(): Promise<void> {
  try {
    state.session = await api<Session>("/api/users/session");
  } catch (error) {
    if (getStoredSessionToken()) {
      setStoredSessionToken(null);
      state.session = await api<Session>("/api/users/session");
      return;
    }

    throw error;
  }
}

function renderNav(): void {
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

  primaryNav.innerHTML = `${pageButtons}${authButton}`;
}

function openLoginDialog(): void {
  const feedback = document.querySelector<HTMLElement>("#login-feedback");
  if (feedback) {
    feedback.innerHTML = "";
  }

  if (!loginDialog.open) {
    loginDialog.showModal();
  }
}

function closeLoginDialog(): void {
  if (loginDialog.open) {
    loginDialog.close();
  }
}

function syncChrome(): void {
  renderNav();
  syncActiveNav(state.currentPage);
}

function setPageLoading(): void {
  pageShell.innerHTML = `
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

function renderError(message: string): void {
  pageShell.innerHTML = `
    <section class="panel p-6 sm:p-8">
      <p class="eyebrow">Error</p>
      <h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black">The frontend could not load the requested data</h2>
      <p class="mt-4 text-sm leading-7 text-stone-600">${escapeHtml(message)}</p>
    </section>
  `;
}

function renderAccessDenied(title: string, description: string): void {
  pageShell.innerHTML = `
    <section class="panel p-6 sm:p-8">
      <p class="eyebrow">Restricted</p>
      <h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black">${escapeHtml(title)}</h2>
      <p class="mt-4 text-sm leading-7 text-stone-600">${escapeHtml(description)}</p>
    </section>
  `;
}

function setupPreview(scope: ParentNode): void {
  const input = scope.querySelector<HTMLTextAreaElement>("[data-editor-input]");
  const output = scope.querySelector<HTMLElement>("[data-editor-preview]");

  if (!input || !output) {
    return;
  }

  const previewElements: PreviewElements = { input, output };

  const syncPreview = () => {
    previewElements.output.innerHTML = renderMarkdown(previewElements.input.value);
  };

  if (!previewElements.input.value.trim()) {
    previewElements.input.value = INITIAL_MARKDOWN;
  }

  syncPreview();
  previewElements.input.addEventListener("input", syncPreview);
}

function setupToc(scope: ParentNode): void {
  const tocPanel = scope.querySelector<HTMLElement>("[data-toc-panel]");

  if (!tocPanel) {
    return;
  }

  const links = Array.from(tocPanel.querySelectorAll<HTMLElement>("[data-toc-link]"));
  const sections = links
    .map((link) => {
      const id = link.dataset.tocLink;
      if (!id) {
        return null;
      }

      const section = document.getElementById(id);
      if (!section) {
        return null;
      }

      return { id, link, section };
    })
    .filter((item): item is { id: string; link: HTMLElement; section: HTMLElement } => item !== null);

  const syncActiveSection = () => {
    let activeId = sections[0]?.id;

    for (const item of sections) {
      const top = item.section.getBoundingClientRect().top;
      if (top <= 140) {
        activeId = item.id;
      }
    }

    links.forEach((link) => {
      link.dataset.active = String(link.dataset.tocLink === activeId);
    });
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.tocLink;
      const section = id ? document.getElementById(id) : null;
      if (!section) {
        return;
      }

      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  window.addEventListener("scroll", syncActiveSection, { passive: true });
  syncActiveSection();
}

function syncActiveNav(pageName: AppPage): void {
  const navItems = document.querySelectorAll<HTMLButtonElement>("[data-nav-link]");
  navItems.forEach((item) => {
    item.dataset.active = String(item.dataset.page === pageName);
  });
}

function setMessage(target: HTMLElement | null, message: string, tone: "ok" | "error" = "ok"): void {
  if (!target) {
    return;
  }

  const toneClass = tone === "ok"
    ? "border-black/10 bg-stone-50 text-stone-700"
    : "border-red-200 bg-red-50 text-red-700";

  target.innerHTML = `<div class="rounded-[1rem] border px-4 py-3 text-sm ${toneClass}">${escapeHtml(message)}</div>`;
}

function getStatusBadge(status: ArticleStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getEditorArticle(): Article | undefined {
  return state.articleList.find((article) => article.id === state.editorArticleId);
}

function renderHomePage(profile: Profile | null, articles: Article[]): void {
  const featured = articles[0];
  const highlights = articles.slice(0, 3);

  pageShell.innerHTML = `
    <section class="space-y-8" data-page-name="home">
      <div class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article class="panel p-6 sm:p-8">
          <p class="eyebrow">About this publication</p>
          <h2 class="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-black sm:text-5xl">
            ${escapeHtml(profile?.name ?? "Olim")}
          </h2>
          <p class="mt-3 text-sm uppercase tracking-[0.28em] text-stone-500">${escapeHtml(profile?.role ?? "Designer, developer, and independent publisher")}</p>
          <p class="mt-5 max-w-3xl text-base leading-8 text-stone-700">
            ${escapeHtml(profile?.bio ?? "This site is a place to write clearly about interface design, practical frontend engineering, and the systems behind thoughtful publishing.")}
          </p>
          <div class="mt-6 flex flex-wrap gap-2">
            ${(profile?.topics ?? []).map((topic) => `<span class="rounded-full border border-black/10 px-3 py-2 text-sm text-stone-600">${escapeHtml(topic)}</span>`).join("")}
          </div>
        </article>

        <aside class="panel-muted p-6 sm:p-8">
          <p class="eyebrow !text-stone-400">Why this blog exists</p>
          <div class="mt-4 space-y-4 text-sm leading-7 text-stone-300">
            <p>This blog gathers notes on design systems, content structure, editorial tooling, and the practical tradeoffs that shape day-to-day product work.</p>
            <p>The goal is simple: publish writing that is direct, useful, and calm enough to read without distraction.</p>
          </div>
          ${featured
            ? `
              <div class="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p class="text-xs uppercase tracking-[0.25em] text-stone-400">Featured article</p>
                <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">${escapeHtml(featured.title)}</h3>
                <p class="mt-3 text-sm leading-7 text-stone-300">${escapeHtml(featured.summary)}</p>
                <button class="mt-4 nav-chip border-white/10 bg-white/10 text-white hover:border-white hover:text-white" data-open-article="${featured.id}">
                  Read featured post
                </button>
              </div>
            `
            : ""}
        </aside>
      </div>

      <section class="panel p-6 sm:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="eyebrow">Start reading</p>
            <h3 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black">Recent articles</h3>
          </div>
          <div class="max-w-2xl text-sm leading-7 text-stone-600">
            A short path into the writing, with recent posts linked directly from the homepage.
          </div>
        </div>
        <div class="mt-6 grid gap-5 lg:grid-cols-3">
          ${
            highlights.length > 0
              ? highlights.map((article) => `
                  <article class="panel p-6">
                    <p class="eyebrow">${escapeHtml(article.categories[0] ?? "Article")}</p>
                    <h4 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">${escapeHtml(article.title)}</h4>
                    <p class="mt-3 text-sm leading-7 text-stone-600">${escapeHtml(article.summary)}</p>
                    <div class="mt-4 space-y-2 text-sm text-stone-500">
                      <div>${escapeHtml(articleDisplayDate(article))}</div>
                      <div>By ${escapeHtml(article.authorName)}</div>
                    </div>
                    <button class="mt-4 nav-chip" data-open-article="${article.id}">Read</button>
                  </article>
                `).join("")
              : `<p class="text-sm leading-7 text-stone-600">No published articles available.</p>`
          }
        </div>
      </section>
    </section>
  `;
}

function renderArticlePage(article: Article, comments: Comment[], related: Article[]): void {
  const canComment = state.session.currentUser !== null;
  const articleContent = renderArticleContent(article.content);
  const tocItems = [...articleContent.toc, { id: "comments", label: "Comments", level: 2 as const }];

  pageShell.innerHTML = `
    <section class="space-y-8" data-page-name="article">
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
        <aside class="hidden lg:sticky lg:top-6 lg:block lg:self-start" data-toc-panel>
          <div class="panel max-h-[calc(100vh-3rem)] overflow-hidden">
            <div class="border-b border-black/10 px-5 py-4">
              <p class="text-sm font-medium text-black">On this page</p>
            </div>
            <div data-toc-body class="max-h-[calc(100vh-7.5rem)] space-y-2 overflow-y-auto px-5 py-4 text-sm">
              ${tocItems.map((item) => `
                <button
                  class="toc-link ${item.level === 2 ? "pl-4" : item.level === 3 ? "pl-7" : ""}"
                  type="button"
                  data-toc-link="${item.id}"
                >
                  ${escapeHtml(item.label)}
                </button>
              `).join("")}
            </div>
          </div>
        </aside>

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
                              <button class="text-left font-medium text-black" data-open-article="${item.id}">${escapeHtml(item.title)}</button>
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
                    <form class="grid w-full max-w-xl gap-3" data-comment-form data-article-id="${article.id}">
                      <input class="rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="authorName" type="text" placeholder="Display name" value="${escapeHtml(state.session.currentUser?.name ?? "")}" required />
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
            <div id="comment-feedback" class="mt-4"></div>
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
                  : `<p class="text-sm leading-7 text-stone-600">No comments yet.</p>`
              }
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}

function renderManagePage(articles: Article[]): void {
  pageShell.innerHTML = `
    <section class="space-y-8" data-page-name="manage">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Owner workspace</p>
          <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">
            Publish, revise, and organize your writing from one place.
          </h2>
        </div>
        <button class="nav-chip" data-create-article>Create new article</button>
      </header>

      <section class="panel overflow-hidden">
        <div class="flex flex-col gap-3 border-b border-black/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p class="text-sm font-medium text-black">Your articles</p>
            <p class="mt-1 text-sm text-stone-500">
              Drafts, published pieces, and recalled posts all stay together in the owner workspace.
            </p>
          </div>
          <div id="manage-feedback"></div>
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
                        <td class="px-6 py-5">${escapeHtml(getStatusBadge(article.status))}</td>
                        <td class="px-6 py-5 text-right sm:px-8">
                          <div class="inline-flex flex-wrap justify-end gap-2">
                            <button class="nav-chip" data-edit-article="${article.id}">Edit</button>
                            ${article.status === "published"
                              ? `<button class="nav-chip" data-article-action="recall" data-article-id="${article.id}">Recall</button>`
                              : `<button class="nav-chip" data-article-action="publish" data-article-id="${article.id}">Publish</button>`}
                            <button class="nav-chip" data-open-article="${article.id}">View</button>
                            <button class="nav-chip" data-article-action="remove" data-article-id="${article.id}">Remove</button>
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
    </section>
  `;
}

function renderEditorPage(article?: Article): void {
  pageShell.innerHTML = `
    <section class="space-y-8" data-page-name="editor">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Content editing</p>
          <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">${escapeHtml(article ? "Edit article" : "Create article")}</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="nav-chip" type="button" data-editor-submit="draft">${escapeHtml(article ? "Update draft" : "Save draft")}</button>
          <button class="nav-chip" type="button" data-editor-submit="publish">Publish</button>
        </div>
      </header>

      <form data-editor-form data-article-id="${article?.id ?? ""}" class="space-y-6">
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

        <div class="grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <section class="panel flex h-full flex-col p-5 sm:p-6">
            <div class="border-b border-black/10 pb-4">
              <div>
                <p class="text-sm font-medium text-black">Content editor</p>
                <p class="mt-1 text-sm text-stone-500">Write the main article body here.</p>
              </div>
            </div>
            <div class="mt-5 flex-1">
              <textarea class="editor-textarea h-full min-h-[28rem] w-full rounded-[1.5rem] border border-black/10 bg-stone-50 px-4 py-4 leading-7 outline-none transition focus:border-black" name="content" data-editor-input required>${escapeHtml(article?.content ?? INITIAL_MARKDOWN)}</textarea>
            </div>
          </section>

          <section class="panel flex h-full flex-col p-5 sm:p-6">
            <div class="border-b border-black/10 pb-4">
              <div>
                <p class="text-sm font-medium text-black">Preview</p>
                <p class="mt-1 text-sm text-stone-500">Rendered side by side with the editor on larger screens.</p>
              </div>
            </div>
            <article class="markdown-preview flex-1 pt-5" data-editor-preview></article>
          </section>
        </div>
      </form>

      <div id="editor-feedback"></div>
    </section>
  `;
}

function renderSearchResults(results: SearchResult[]): string {
  return results.length > 0
    ? results.map((article) => `
        <article class="panel p-6">
          <p class="text-xs uppercase tracking-[0.25em] text-stone-500">${escapeHtml(article.categories.join(" / ") || "Article")}</p>
          <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">${escapeHtml(article.title)}</h3>
          <p class="mt-2 text-sm leading-7 text-stone-600">${escapeHtml(article.summary)}</p>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div class="text-sm text-stone-500">${escapeHtml(formatDate(article.publishedAt ?? article.createdAt))}</div>
            <button class="nav-chip" data-open-article="${article.id}">Open article</button>
          </div>
        </article>
      `).join("")
    : `<p class="text-sm leading-7 text-stone-600">No articles matched the current query.</p>`;
}

function renderSearchPage(
  results: SearchResult[],
  tags: Array<{ tag: string; count: number }>,
  archives: Array<{ year: number; month: number; count: number }>
): void {
  pageShell.innerHTML = `
    <section class="space-y-8" data-page-name="search">
      <header>
        <p class="eyebrow">Search and tags</p>
        <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">Full-text search over published writing</h2>
      </header>

      <section class="panel p-6 sm:p-8">
        <div class="space-y-4">
          <input
            class="w-full rounded-[1.35rem] border border-black/10 bg-stone-50 px-5 py-4 text-lg outline-none transition focus:border-black"
            type="search"
            placeholder="Search by title, phrase, or tag"
            data-search-input
            value="${escapeHtml(state.searchQuery)}"
          />
          <div class="flex flex-wrap gap-2">
            ${tags.map((item) => `<button class="nav-chip" type="button" data-search-tag="${escapeHtml(item.tag)}">${escapeHtml(item.tag)} (${item.count})</button>`).join("")}
          </div>
        </div>
      </section>

      <section class="panel-muted p-6 sm:p-8">
        <p class="eyebrow !text-stone-400">Archive</p>
        <div class="mt-3 grid gap-3 text-sm text-stone-300 md:grid-cols-2 xl:grid-cols-3">
          ${
            archives.length > 0
              ? archives.map((item) => `
                  <div class="flex items-center justify-between rounded-[1.2rem] border border-white/10 px-4 py-3">
                    <span>${item.year} / ${String(item.month).padStart(2, "0")}</span>
                    <span>${item.count} post${item.count === 1 ? "" : "s"}</span>
                  </div>
                `).join("")
              : "<div>No archive data yet.</div>"
          }
        </div>
      </section>

      <div class="grid gap-4" id="search-results">
        ${renderSearchResults(results)}
      </div>
    </section>
  `;
}

let searchRequestId = 0;

async function refreshSearchResults(): Promise<void> {
  const requestId = ++searchRequestId;
  const resultsContainer = pageShell.querySelector<HTMLElement>("#search-results");

  if (!resultsContainer || state.currentPage !== "search") {
    return;
  }

  resultsContainer.innerHTML = `<div class="panel p-6 text-sm text-stone-500">Searching…</div>`;

  try {
    const response = await api<{ items: SearchResult[] }>(`/api/meta/search?q=${encodeURIComponent(state.searchQuery)}`);

    if (requestId !== searchRequestId || state.currentPage !== "search") {
      return;
    }

    resultsContainer.innerHTML = renderSearchResults(response.items);
    const input = pageShell.querySelector<HTMLInputElement>("[data-search-input]");
    if (input && input.value !== state.searchQuery) {
      input.value = state.searchQuery;
    }
  } catch (error) {
    if (requestId !== searchRequestId || state.currentPage !== "search") {
      return;
    }

    resultsContainer.innerHTML = `
      <div class="panel p-6 text-sm text-red-700">
        ${escapeHtml(error instanceof Error ? error.message : "Unable to load search results.")}
      </div>
    `;
  }
}

function renderAboutPage(profile: Profile | null): void {
  const { currentUser } = state.session;

  pageShell.innerHTML = `
    <section class="space-y-8" data-page-name="about">
      <header>
        <p class="eyebrow">About / Account</p>
        <h2 class="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black">About the publication and your account</h2>
      </header>

      <div class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
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
          </div>
        </section>

        <section class="panel p-6 sm:p-8">
          <p class="eyebrow">Account</p>
          ${
            currentUser
              ? `
                <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">Update your account</h3>
                <form class="mt-5 grid gap-4" data-profile-form>
                  <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="name" type="text" value="${escapeHtml(currentUser.name)}" placeholder="Display name" required />
                  <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="avatarUrl" type="url" value="${escapeHtml(currentUser.avatarUrl)}" placeholder="Avatar URL" />
                  <textarea class="min-h-28 w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 leading-7 outline-none transition focus:border-black" name="bio" placeholder="Short bio">${escapeHtml(currentUser.bio)}</textarea>
                  <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="password" type="password" placeholder="New password (optional)" />
                  <div class="flex items-center justify-between gap-4">
                    <p class="text-sm text-stone-500">Access: ${escapeHtml(currentUser.role)}</p>
                    <button class="nav-chip" type="submit">Save profile</button>
                  </div>
                </form>
                <div id="profile-feedback" class="mt-4"></div>
              `
              : `
                <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">Create a viewer account</h3>
                <p class="mt-3 text-sm leading-7 text-stone-600">Reading stays open to everyone. Create a viewer account if you want to comment and keep a simple public profile.</p>
                <form class="mt-5 grid gap-4" data-register-form>
                  <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="name" type="text" placeholder="Name" required />
                  <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="email" type="email" placeholder="Email" required />
                  <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="password" type="password" placeholder="Password" required />
                  <input class="w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-black" name="avatarUrl" type="url" placeholder="Avatar URL" />
                  <textarea class="min-h-28 w-full rounded-[1.2rem] border border-black/10 bg-stone-50 px-4 py-3 leading-7 outline-none transition focus:border-black" name="bio" placeholder="Short bio"></textarea>
                  <div class="flex justify-end">
                    <button class="nav-chip" type="submit">Create viewer account</button>
                  </div>
                </form>
                <div id="register-feedback" class="mt-4"></div>
              `
          }
        </section>
      </div>

      <section class="panel p-6 sm:p-8">
        <p class="eyebrow">Topics</p>
        <div class="article-copy">
          <ul>
            ${
              profile && profile.topics.length > 0
                ? profile.topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")
                : "<li>No topics configured.</li>"
            }
          </ul>
        </div>
      </section>
    </section>
  `;
}

async function loadArticles(scope: "public" | "manage"): Promise<Article[]> {
  const response = await api<{ items: Article[] }>(`/api/articles${scope === "manage" ? "?scope=manage" : ""}`);
  state.articleList = response.items;
  return response.items;
}

async function showPage(page: AppPage): Promise<void> {
  state.currentPage = page;
  syncChrome();
  setPageLoading();

  try {
    switch (page) {
      case "home": {
        const [articles, profileResponse] = await Promise.all([
          loadArticles("public"),
          api<{ profile: Profile | null }>("/api/meta/about")
        ]);
        renderHomePage(profileResponse.profile, articles);
        break;
      }
      case "article": {
        let sourceArticles = state.articleList;

        if (sourceArticles.length === 0) {
          sourceArticles = await loadArticles("public");
        }

        let article = sourceArticles.find((item) => item.id === state.selectedArticleId);

        if (!article) {
          const publicArticles = await loadArticles("public");
          article = publicArticles[0];
        }

        if (!article) {
          throw new Error("No accessible article is available.");
        }

        state.selectedArticleId = article.id;
        const articleResponse = await api<{ article: Article; comments: Comment[] }>(`/api/articles/slug/${article.slug}`);
        const publicArticles = await api<{ items: Article[] }>("/api/articles");
        const related = publicArticles.items.filter((item) => item.id !== articleResponse.article.id).slice(0, 3);
        renderArticlePage(articleResponse.article, articleResponse.comments, related);
        setupToc(pageShell);
        break;
      }
      case "manage": {
        if (!state.session.capabilities.canManageBlogs) {
          renderAccessDenied(
            "Management is not available for this role",
            "The publishing workspace belongs to the owner account. Viewers can read posts and join the discussion."
          );
          break;
        }

        const articles = await loadArticles("manage");
        renderManagePage(articles);
        break;
      }
      case "editor": {
        if (!state.session.capabilities.canManageBlogs) {
          renderAccessDenied(
            "Editing is not available for this role",
            "Only the owner account can create or update blog posts."
          );
          break;
        }

        const articles = await loadArticles("manage");
        const article = articles.find((item) => item.id === state.editorArticleId);
        renderEditorPage(article);
        setupPreview(pageShell);
        break;
      }
      case "search": {
        const [resultsResponse, tagsResponse, archivesResponse] = await Promise.all([
          api<{ items: SearchResult[] }>(`/api/meta/search?q=${encodeURIComponent(state.searchQuery)}`),
          api<{ items: Array<{ tag: string; count: number }> }>("/api/meta/tags"),
          api<{ items: Array<{ year: number; month: number; count: number }> }>("/api/meta/archives")
        ]);

        renderSearchPage(resultsResponse.items, tagsResponse.items, archivesResponse.items);
        break;
      }
      case "about": {
        const profileResponse = await api<{ profile: Profile | null }>("/api/meta/about");
        renderAboutPage(profileResponse.profile);
        break;
      }
    }
  } catch (error) {
    renderError(error instanceof Error ? error.message : "Unknown error");
  }
}

async function saveEditor(mode: "draft" | "publish"): Promise<void> {
  const form = pageShell.querySelector<HTMLFormElement>("[data-editor-form]");
  const feedback = pageShell.querySelector<HTMLElement>("#editor-feedback");

  if (!form) {
    return;
  }

  const formData = new FormData(form);
  const body = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""),
    categories: parseList(String(formData.get("categories") ?? "")),
    tags: parseList(String(formData.get("tags") ?? "")),
    status: mode === "publish" ? "published" : "draft"
  };

  try {
    const articleId = form.dataset.articleId?.trim();
    let article: Article;

    if (articleId) {
      const response = await api<{ article: Article }>(`/api/articles/${articleId}`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });
      article = response.article;
    } else {
      const response = await api<{ article: Article }>("/api/articles", {
        method: "POST",
        body: JSON.stringify(body)
      });
      article = response.article;
    }

    if (mode === "publish") {
      const response = await api<{ article: Article }>(`/api/articles/${article.id}/publish`, {
        method: "POST",
        body: JSON.stringify({})
      });
      article = response.article;
    }

    await loadArticles("manage");
    state.editorArticleId = article.id;
    setMessage(feedback, mode === "publish" ? "Article published." : "Draft saved.");
    renderEditorPage(article);
    setupPreview(pageShell);
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Unable to save article.", "error");
  }
}

async function runArticleAction(articleId: string, action: "publish" | "recall" | "remove"): Promise<void> {
  const feedback = pageShell.querySelector<HTMLElement>("#manage-feedback");

  try {
    if (action === "publish") {
      await api(`/api/articles/${articleId}/publish`, { method: "POST", body: JSON.stringify({}) });
    }

    if (action === "recall") {
      await api(`/api/articles/${articleId}/recall`, { method: "POST", body: JSON.stringify({}) });
    }

    if (action === "remove") {
      await api(`/api/articles/${articleId}`, { method: "DELETE" });
    }

    const articles = await loadArticles("manage");
    renderManagePage(articles);
    setMessage(pageShell.querySelector<HTMLElement>("#manage-feedback"), `Article ${action} action completed.`);
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Action failed.", "error");
  }
}

async function submitComment(form: HTMLFormElement): Promise<void> {
  const feedback = pageShell.querySelector<HTMLElement>("#comment-feedback");
  const formData = new FormData(form);
  const articleId = form.dataset.articleId;

  if (!articleId) {
    return;
  }

  try {
    await api(`/api/articles/${articleId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        authorName: String(formData.get("authorName") ?? ""),
        body: String(formData.get("body") ?? "")
      })
    });

    form.reset();
    await showPage("article");
    setMessage(pageShell.querySelector<HTMLElement>("#comment-feedback"), "Comment posted.");
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Unable to submit comment.", "error");
  }
}

async function updateOwnProfile(form: HTMLFormElement): Promise<void> {
  const feedback = pageShell.querySelector<HTMLElement>("#profile-feedback");
  const formData = new FormData(form);

  try {
    const response = await api<{ user: User }>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        avatarUrl: String(formData.get("avatarUrl") ?? ""),
        bio: String(formData.get("bio") ?? ""),
        password: String(formData.get("password") ?? "")
      })
    });

    state.session.currentUser = response.user;
    syncChrome();
    setMessage(feedback, "Profile updated.");
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Unable to update profile.", "error");
  }
}

async function registerViewer(form: HTMLFormElement): Promise<void> {
  const feedback = pageShell.querySelector<HTMLElement>("#register-feedback");
  const formData = new FormData(form);

  try {
    const response = await api<{ user: User; sessionToken: string }>("/api/users/register", {
      method: "POST",
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        avatarUrl: String(formData.get("avatarUrl") ?? ""),
        bio: String(formData.get("bio") ?? "")
      })
    });

    setStoredSessionToken(response.sessionToken);
    await loadSession();
    syncChrome();
    await showPage("about");
    setMessage(pageShell.querySelector<HTMLElement>("#register-feedback"), "Viewer account created and selected.");
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Unable to create account.", "error");
  }
}

async function login(form: HTMLFormElement): Promise<void> {
  const feedback = document.querySelector<HTMLElement>("#login-feedback");
  const formData = new FormData(form);

  try {
    const response = await api<{ user: User; sessionToken: string }>("/api/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? "")
      })
    });

    setStoredSessionToken(response.sessionToken);
    await loadSession();
    syncChrome();
    closeLoginDialog();
    await showPage("home");
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Unable to log in.", "error");
  }
}

async function logout(): Promise<void> {
  try {
    await api("/api/users/logout", {
      method: "POST",
      body: JSON.stringify({})
    });
  } catch {
    // Clear the client session even if the token is already invalid server-side.
  }

  setStoredSessionToken(null);
  state.selectedArticleId = null;
  state.editorArticleId = null;
  state.articleList = [];
  closeLoginDialog();
  const loginForm = document.querySelector<HTMLFormElement>("[data-login-form]");
  loginForm?.reset();
  const loginFeedback = document.querySelector<HTMLElement>("#login-feedback");
  if (loginFeedback) {
    loginFeedback.innerHTML = "";
  }
  await loadSession();
  syncChrome();
  await showPage("home");
}

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const navButton = target.closest<HTMLElement>("[data-nav-link]");
  if (navButton?.dataset.page) {
    void showPage(navButton.dataset.page as AppPage);
    return;
  }

  const articleButton = target.closest<HTMLElement>("[data-open-article]");
  if (articleButton?.dataset.openArticle) {
    state.selectedArticleId = articleButton.dataset.openArticle;
    void showPage("article");
    return;
  }

  const editButton = target.closest<HTMLElement>("[data-edit-article]");
  if (editButton?.dataset.editArticle) {
    state.editorArticleId = editButton.dataset.editArticle;
    void showPage("editor");
    return;
  }

  if (target.closest("[data-create-article]")) {
    state.editorArticleId = null;
    void showPage("editor");
    return;
  }

  const actionButton = target.closest<HTMLElement>("[data-article-action]");
  if (actionButton?.dataset.articleAction && actionButton.dataset.articleId) {
    void runArticleAction(
      actionButton.dataset.articleId,
      actionButton.dataset.articleAction as "publish" | "recall" | "remove"
    );
    return;
  }

  const submitButton = target.closest<HTMLElement>("[data-editor-submit]");
  if (submitButton?.dataset.editorSubmit) {
    void saveEditor(submitButton.dataset.editorSubmit as "draft" | "publish");
    return;
  }

  const searchTagButton = target.closest<HTMLElement>("[data-search-tag]");
  if (searchTagButton?.dataset.searchTag) {
    state.searchQuery = searchTagButton.dataset.searchTag;
    if (state.currentPage === "search") {
      const input = pageShell.querySelector<HTMLInputElement>("[data-search-input]");
      if (input) {
        input.value = state.searchQuery;
      }
      void refreshSearchResults();
    } else {
      void showPage("search");
    }
    return;
  }

  if (target.closest("[data-logout]")) {
    void logout();
    return;
  }

  if (target.closest("[data-open-login]")) {
    openLoginDialog();
    return;
  }

  if (target.closest("[data-close-login]")) {
    closeLoginDialog();
  }
});

document.addEventListener("submit", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLFormElement)) {
    return;
  }

  if (target.matches("[data-comment-form]")) {
    event.preventDefault();
    void submitComment(target);
    return;
  }

  if (target.matches("[data-profile-form]")) {
    event.preventDefault();
    void updateOwnProfile(target);
    return;
  }

  if (target.matches("[data-register-form]")) {
    event.preventDefault();
    void registerViewer(target);
    return;
  }

  if (target.matches("[data-login-form]")) {
    event.preventDefault();
    void login(target);
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;

  if (target instanceof HTMLInputElement && target.matches("[data-search-input]")) {
    state.searchQuery = target.value.trim();
    if (state.currentPage === "search") {
      void refreshSearchResults();
    }
  }
});

void (async () => {
  await loadSession();
  syncChrome();
  await showPage("home");
})();
