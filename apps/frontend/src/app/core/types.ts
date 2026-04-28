export type ArticleStatus = "draft" | "published" | "recalled";
export type UserRole = "viewer" | "owner";

export type Article = {
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

export type Comment = {
  id: string;
  articleId: string;
  authorName: string;
  body: string;
  status: "approved";
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  name: string;
  role: string;
  bio: string;
  topics: string[];
  links: Array<{ label: string; url: string }>;
};

export type User = {
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

export type SessionCapabilities = {
  canManageBlogs: boolean;
  canManageComments: boolean;
  canManageAccounts: boolean;
  canEditOwnProfile: boolean;
};

export type Session = {
  currentUser: User | null;
  capabilities: SessionCapabilities;
};

export type SearchResult = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  categories: string[];
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
};

export type TagCount = {
  tag: string;
  count: number;
};

export type ArchiveEntry = {
  year: number;
  month: number;
  count: number;
};

export type AppPage = "home" | "article" | "manage" | "editor" | "search" | "about";

export type AppState = {
  currentPage: AppPage;
  articleList: Article[];
  selectedArticleId: string | null;
  editorArticleId: string | null;
  searchQuery: string;
  session: Session;
};

export type PreviewElements = {
  input: HTMLTextAreaElement;
  output: HTMLElement;
};

export type TocItem = {
  id: string;
  label: string;
  level: 1 | 2 | 3;
};

export type DomRefs = {
  pageShell: HTMLElement;
  primaryNav: HTMLElement;
  loginDialog: HTMLDialogElement;
};

export type ArticleScope = "public" | "manage";
export type EditorMode = "draft" | "publish";
export type ArticleAction = "publish" | "recall" | "remove";
