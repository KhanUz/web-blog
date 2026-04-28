import { dom } from "../core/dom";
import { articleDisplayDate, escapeHtml, formatDate, getStatusBadge } from "../core/helpers";
import { renderArticleContent, renderMarkdown } from "../core/markdown";
import { INITIAL_MARKDOWN, state } from "../core/state";
import type { ArchiveEntry, Article, Comment, PreviewElements, Profile, SearchResult, TagCount } from "../core/types";

export function setupPreview(scope: ParentNode): void {
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

export function setupToc(scope: ParentNode): void {
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

export function renderHomePage(profile: Profile | null, articles: Article[]): void {
  const featured = articles[0];
  const highlights = articles.slice(0, 3);

  dom.pageShell.innerHTML = `
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

export function renderArticlePage(article: Article, comments: Comment[], related: Article[]): void {
  const canComment = state.session.currentUser !== null;
  const articleContent = renderArticleContent(article.content);
  const tocItems = [...articleContent.toc, { id: "comments", label: "Comments", level: 2 as const }];

  dom.pageShell.innerHTML = `
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

export function renderManagePage(articles: Article[]): void {
  dom.pageShell.innerHTML = `
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

export function renderEditorPage(article?: Article): void {
  dom.pageShell.innerHTML = `
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

export function renderSearchResults(results: SearchResult[]): string {
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

export function renderSearchPage(results: SearchResult[], tags: TagCount[], archives: ArchiveEntry[]): void {
  dom.pageShell.innerHTML = `
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

export function renderAboutPage(profile: Profile | null): void {
  const { currentUser } = state.session;

  dom.pageShell.innerHTML = `
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
