import { closeLoginDialog, openLoginDialog } from "../core/chrome";
import { dom } from "../core/dom";
import { state } from "../core/state";
import type { AppPage, ArticleAction, EditorMode } from "../core/types";
import {
  login,
  logout,
  refreshSearchResults,
  registerViewer,
  runArticleAction,
  saveEditor,
  showPage,
  submitComment,
  updateOwnProfile
} from "./actions";

export function registerEventHandlers(): void {
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
      void runArticleAction(actionButton.dataset.articleId, actionButton.dataset.articleAction as ArticleAction);
      return;
    }

    const submitButton = target.closest<HTMLElement>("[data-editor-submit]");
    if (submitButton?.dataset.editorSubmit) {
      void saveEditor(submitButton.dataset.editorSubmit as EditorMode);
      return;
    }

    const searchTagButton = target.closest<HTMLElement>("[data-search-tag]");
    if (searchTagButton?.dataset.searchTag) {
      state.searchQuery = searchTagButton.dataset.searchTag;
      if (state.currentPage === "search") {
        const input = dom.pageShell.querySelector<HTMLInputElement>("[data-search-input]");
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
}
