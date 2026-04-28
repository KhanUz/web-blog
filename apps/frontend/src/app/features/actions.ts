import { closeLoginDialog, renderAccessDenied, renderError, setPageLoading, syncChrome } from "../core/chrome";
import { dom } from "../core/dom";
import { parseList, setMessage } from "../core/helpers";
import { api, loadArticles, loadSession, setStoredSessionToken } from "../core/http";
import { state } from "../core/state";
import {
  renderAboutPage,
  renderArticlePage,
  renderEditorPage,
  renderHomePage,
  renderManagePage,
  renderSearchPage,
  renderSearchResults,
  setupPreview,
  setupToc
} from "../pages/render";
import type { AppPage, Article, ArticleAction, EditorMode, Profile, SearchResult, TagCount, ArchiveEntry, Comment, User } from "../core/types";

let searchRequestId = 0;

export async function refreshSearchResults(): Promise<void> {
  const requestId = ++searchRequestId;
  const resultsContainer = dom.pageShell.querySelector<HTMLElement>("#search-results");

  if (!resultsContainer || state.currentPage !== "search") {
    return;
  }

  resultsContainer.innerHTML = `<div class="panel p-6 text-sm text-stone-500">Searching...</div>`;

  try {
    const response = await api<{ items: SearchResult[] }>(`/api/meta/search?q=${encodeURIComponent(state.searchQuery)}`);

    if (requestId !== searchRequestId || state.currentPage !== "search") {
      return;
    }

    resultsContainer.innerHTML = renderSearchResults(response.items);
    const input = dom.pageShell.querySelector<HTMLInputElement>("[data-search-input]");
    if (input && input.value !== state.searchQuery) {
      input.value = state.searchQuery;
    }
  } catch (error) {
    if (requestId !== searchRequestId || state.currentPage !== "search") {
      return;
    }

    resultsContainer.innerHTML = `
      <div class="panel p-6 text-sm text-red-700">
        ${error instanceof Error ? error.message : "Unable to load search results."}
      </div>
    `;
  }
}

export async function showPage(page: AppPage): Promise<void> {
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
        setupToc(dom.pageShell);
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
        setupPreview(dom.pageShell);
        break;
      }
      case "search": {
        const [resultsResponse, tagsResponse, archivesResponse] = await Promise.all([
          api<{ items: SearchResult[] }>(`/api/meta/search?q=${encodeURIComponent(state.searchQuery)}`),
          api<{ items: TagCount[] }>("/api/meta/tags"),
          api<{ items: ArchiveEntry[] }>("/api/meta/archives")
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

export async function saveEditor(mode: EditorMode): Promise<void> {
  const form = dom.pageShell.querySelector<HTMLFormElement>("[data-editor-form]");
  const feedback = dom.pageShell.querySelector<HTMLElement>("#editor-feedback");

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
    setupPreview(dom.pageShell);
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Unable to save article.", "error");
  }
}

export async function runArticleAction(articleId: string, action: ArticleAction): Promise<void> {
  const feedback = dom.pageShell.querySelector<HTMLElement>("#manage-feedback");

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
    setMessage(dom.pageShell.querySelector<HTMLElement>("#manage-feedback"), `Article ${action} action completed.`);
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Action failed.", "error");
  }
}

export async function submitComment(form: HTMLFormElement): Promise<void> {
  const feedback = dom.pageShell.querySelector<HTMLElement>("#comment-feedback");
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
    setMessage(dom.pageShell.querySelector<HTMLElement>("#comment-feedback"), "Comment posted.");
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Unable to submit comment.", "error");
  }
}

export async function updateOwnProfile(form: HTMLFormElement): Promise<void> {
  const feedback = dom.pageShell.querySelector<HTMLElement>("#profile-feedback");
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

export async function registerViewer(form: HTMLFormElement): Promise<void> {
  const feedback = dom.pageShell.querySelector<HTMLElement>("#register-feedback");
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
    setMessage(dom.pageShell.querySelector<HTMLElement>("#register-feedback"), "Viewer account created and selected.");
  } catch (error) {
    setMessage(feedback, error instanceof Error ? error.message : "Unable to create account.", "error");
  }
}

export async function login(form: HTMLFormElement): Promise<void> {
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

export async function logout(): Promise<void> {
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
