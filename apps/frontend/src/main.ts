import htmx from "htmx.org";
import "./styles.css";

type PreviewElements = {
  input: HTMLTextAreaElement;
  output: HTMLElement;
};

const INITIAL_MARKDOWN = `# Designing Calm Interfaces

Minimal blog systems should disappear behind the writing.

## Why this layout works

- The navigation stays available but does not follow the reader.
- The table of contents helps with long-form articles.
- The reading column gets the majority of the width.

### Editorial rhythm

Thoughtful spacing creates structure without relying on heavy decoration.
`;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App container not found.");
}

app.innerHTML = `
  <div class="site-shell min-h-screen">
    <header class="border-b border-black/10">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-3">
            <p class="text-[0.65rem] uppercase tracking-[0.45em] text-stone-500">Web Blog / Frontend Prototype</p>
            <div class="space-y-2">
              <h1 class="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-black sm:text-5xl">
                Minimal editorial interface built around HTMX swaps and adaptive reading.
              </h1>
              <p class="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                The brief centers on long-form reading, article operations, markdown editing, search, comments, and a restrained black-and-white visual system.
              </p>
            </div>
          </div>
          <div class="grid gap-px overflow-hidden rounded-[1.75rem] border border-black/10 bg-black/10 text-sm sm:grid-cols-3">
            <div class="bg-white px-4 py-4">
              <p class="font-medium text-black">Style</p>
              <p class="mt-1 text-stone-600">Monochrome, narrow lines, quiet contrast.</p>
            </div>
            <div class="bg-white px-4 py-4">
              <p class="font-medium text-black">Structure</p>
              <p class="mt-1 text-stone-600">Frontend first, backend-ready routes to follow.</p>
            </div>
            <div class="bg-white px-4 py-4">
              <p class="font-medium text-black">Interaction</p>
              <p class="mt-1 text-stone-600">HTMX fragments plus TypeScript behaviors.</p>
            </div>
          </div>
        </div>

        <nav class="flex flex-wrap gap-2 border-t border-black/10 pt-4" aria-label="Primary">
          <button class="nav-chip" data-nav-link data-page="home" hx-get="/fragments/home.html" hx-target="#page-shell" hx-swap="innerHTML">Home</button>
          <button class="nav-chip" data-nav-link data-page="article" hx-get="/fragments/article.html" hx-target="#page-shell" hx-swap="innerHTML">Article View</button>
          <button class="nav-chip" data-nav-link data-page="manage" hx-get="/fragments/manage.html" hx-target="#page-shell" hx-swap="innerHTML">Management</button>
          <button class="nav-chip" data-nav-link data-page="editor" hx-get="/fragments/editor.html" hx-target="#page-shell" hx-swap="innerHTML">Editor</button>
          <button class="nav-chip" data-nav-link data-page="search" hx-get="/fragments/search.html" hx-target="#page-shell" hx-swap="innerHTML">Search</button>
          <button class="nav-chip" data-nav-link data-page="about" hx-get="/fragments/about.html" hx-target="#page-shell" hx-swap="innerHTML">About</button>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div id="page-shell" hx-get="/fragments/home.html" hx-trigger="load" hx-swap="innerHTML">
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
`;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function renderMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === "") {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    const safeLine = renderInlineMarkdown(escapeHtml(line.trim()));

    if (line.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${safeLine.slice(4)}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${safeLine.slice(3)}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${safeLine.slice(2)}</h1>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push('<ul class="preview-list">');
        inList = true;
      }
      html.push(`<li>${safeLine.slice(2)}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    html.push(`<p>${safeLine}</p>`);
  }

  if (inList) {
    html.push("</ul>");
  }

  return html.join("");
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
  const tocToggle = scope.querySelector<HTMLButtonElement>("[data-toc-toggle]");

  if (!tocPanel || !tocToggle) {
    return;
  }

  const syncToggleLabel = () => {
    const collapsed = tocPanel.dataset.collapsed === "true";
    tocPanel.classList.toggle("lg:w-[4.5rem]", collapsed);
    tocPanel.classList.toggle("lg:w-[20%]", !collapsed);
    tocPanel.classList.toggle("px-3", collapsed);
    tocPanel.classList.toggle("px-0", collapsed);
    tocPanel.classList.toggle("sm:px-5", !collapsed);
    tocPanel.classList.toggle("lg:px-6", !collapsed);
    tocPanel.querySelectorAll<HTMLElement>("[data-toc-body]").forEach((element) => {
      element.classList.toggle("hidden", collapsed);
    });
    tocToggle.textContent = collapsed ? "Open TOC" : "Collapse TOC";
  };

  tocToggle.addEventListener("click", () => {
    tocPanel.dataset.collapsed = tocPanel.dataset.collapsed === "true" ? "false" : "true";
    syncToggleLabel();
  });

  syncToggleLabel();
}

function setupSearch(scope: ParentNode): void {
  const input = scope.querySelector<HTMLInputElement>("[data-search-input]");
  const items = Array.from(scope.querySelectorAll<HTMLElement>("[data-search-item]"));

  if (!input || items.length === 0) {
    return;
  }

  const syncSearch = () => {
    const query = input.value.trim().toLowerCase();

    items.forEach((item) => {
      const haystack = item.dataset.searchItem?.toLowerCase() ?? "";
      item.classList.toggle("hidden", query.length > 0 && !haystack.includes(query));
    });
  };

  input.addEventListener("input", syncSearch);
}

function syncActiveNav(pageName: string | undefined): void {
  const navItems = document.querySelectorAll<HTMLButtonElement>("[data-nav-link]");

  navItems.forEach((item) => {
    const isActive = item.dataset.page === pageName;
    item.dataset.active = String(isActive);
  });
}

function initializeFragment(scope: ParentNode): void {
  const pageRoot = scope.querySelector<HTMLElement>("[data-page-name]");

  syncActiveNav(pageRoot?.dataset.pageName);
  setupPreview(scope);
  setupToc(scope);
  setupSearch(scope);
}

document.body.addEventListener("htmx:afterSwap", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement) || target.id !== "page-shell") {
    return;
  }

  initializeFragment(target);
});

initializeFragment(document);
