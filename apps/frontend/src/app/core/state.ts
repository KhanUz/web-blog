import type { AppState, SessionCapabilities } from "./types";

export const STORAGE_KEY = "web-blog-session-token";

export const INITIAL_MARKDOWN = `# Designing Calm Interfaces

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

export const state: AppState = {
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
