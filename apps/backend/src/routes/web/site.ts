import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "../../lib/auth/passwords.js";
import { ensureArticleAccess, ensureArticleManagement, requireAuthenticated, requireRole } from "../../lib/auth/auth.js";
import { clearSessionCookie, setSessionCookie } from "../../lib/auth/session.js";
import { slugify } from "../../lib/content/slugify.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { ArticleModel } from "../../models/Article.js";
import { CommentModel } from "../../models/Comment.js";
import { ProfileModel } from "../../models/Profile.js";
import { UserModel } from "../../models/User.js";
import { renderDocument, type Notice } from "../../ui/core/shell.js";
import type { AccountGuestMode } from "../../ui/components/forms.js";
import { renderAccountPage } from "../../ui/pages/account.js";
import { renderAboutPage } from "../../ui/pages/about.js";
import { renderArticlePage } from "../../ui/pages/article.js";
import { renderEditorPage } from "../../ui/pages/editor.js";
import { renderHomePage } from "../../ui/pages/home.js";
import { renderManagePage } from "../../ui/pages/manage.js";
import { renderSearchPage } from "../../ui/pages/search.js";

export const siteRouter = Router();

const INITIAL_MARKDOWN = `# Designing Calm Interfaces

Minimal blog systems should disappear behind the writing.

## Why this layout works

- The navigation stays available but does not follow the reader.
- The table of contents helps with long-form articles.
- The reading column gets the majority of the width.

### Editorial rhythm

Thoughtful spacing creates structure without relying on heavy decoration.
`;

function parseStringList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${fieldName} is required.`);
  }

  return value.trim();
}

function readOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getObjectId(value: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(value)) {
    throw new HttpError(400, "Invalid id.");
  }

  return new mongoose.Types.ObjectId(value);
}

function getRouteParam(value: string | string[] | undefined, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${fieldName} route param is required.`);
  }

  return value;
}

function getAccountGuestMode(value: unknown): AccountGuestMode {
  return value === "register" ? "register" : "login";
}

async function getArticleHref(): Promise<string> {
  const article = await ArticleModel.findOne({
    removedFromSiteAt: null,
    status: "published"
  }).sort({ createdAt: -1 });

  return article ? `/articles/${article.slug}` : "/article";
}

async function sendPage(
  request: Request,
  response: Response,
  page: {
    title: string;
    activePage: "home" | "article" | "manage" | "editor" | "search" | "about" | "account";
    content: string;
    notice?: Notice;
  }
): Promise<void> {
  const articleHref = await getArticleHref();

  response.send(renderDocument({
    title: page.title,
    activePage: page.activePage,
    currentPath: request.originalUrl,
    currentUser: request.currentUser,
    actorRole: request.actorRole,
    articleHref,
    notice: page.notice,
    content: page.content
  }));
}

async function renderHome(request: Request, response: Response, notice?: Notice): Promise<void> {
  const [profile, articles] = await Promise.all([
    ProfileModel.findOne().sort({ createdAt: 1 }),
    ArticleModel.find({
      removedFromSiteAt: null,
      status: "published"
    }).sort({ createdAt: -1 })
  ]);

  await sendPage(request, response, {
    title: "Web Blog",
    activePage: "home",
    notice,
    content: renderHomePage(profile, articles)
  });
}

async function renderArticleBySlug(
  request: Request,
  response: Response,
  slug: string,
  notice?: Notice
): Promise<void> {
  const article = await ArticleModel.findOne({
    slug,
    removedFromSiteAt: null
  });

  if (!article) {
    throw new HttpError(404, "Article not found.");
  }

  ensureArticleAccess(request, article);

  const [comments, related] = await Promise.all([
    CommentModel.find({ article: article._id }).sort({ createdAt: -1 }),
    ArticleModel.find({
      _id: { $ne: article._id },
      removedFromSiteAt: null,
      status: "published"
    }).sort({ createdAt: -1 }).limit(3)
  ]);

  await sendPage(request, response, {
    title: article.title,
    activePage: "article",
    notice,
    content: renderArticlePage(article, comments, related, request.currentUser?.name ?? "")
  });
}

async function renderManage(request: Request, response: Response, notice?: Notice): Promise<void> {
  const user = requireRole(request, ["owner"]);
  const articles = await ArticleModel.find({
    author: user._id,
    removedFromSiteAt: null
  }).sort({ createdAt: -1 });

  await sendPage(request, response, {
    title: "Management",
    activePage: "manage",
    notice,
    content: renderManagePage(articles)
  });
}

async function renderEditor(
  request: Request,
  response: Response,
  articleId: string | null,
  notice?: Notice
): Promise<void> {
  const user = requireRole(request, ["owner"]);
  let article = null;

  if (articleId) {
    article = await ArticleModel.findById(getObjectId(articleId));

    if (!article) {
      throw new HttpError(404, "Article not found.");
    }

    if (!article.author || !article.author.equals(user._id)) {
      throw new HttpError(403, "Owners can only manage their own articles.");
    }
  }

  await sendPage(request, response, {
    title: article ? `Edit ${article.title}` : "Create Article",
    activePage: "editor",
    notice,
    content: renderEditorPage(article, INITIAL_MARKDOWN)
  });
}

async function renderSearch(request: Request, response: Response, notice?: Notice): Promise<void> {
  const query = typeof request.query.q === "string" ? request.query.q.trim() : "";
  const year = Number(request.query.year);
  const month = Number(request.query.month);

  const [tags, archives, results] = await Promise.all([
    ArticleModel.aggregate<{ _id: string; count: number }>([
      { $match: { removedFromSiteAt: null, status: "published" } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]),
    ArticleModel.aggregate<{ _id: { year: number; month: number }; count: number }>([
      { $match: { removedFromSiteAt: null, status: "published" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]),
    ArticleModel.find({
      removedFromSiteAt: null,
      status: "published",
      ...(query
        ? {
            $or: [
              { title: new RegExp(query, "i") },
              { summary: new RegExp(query, "i") },
              { content: new RegExp(query, "i") },
              { tags: new RegExp(query, "i") },
              { categories: new RegExp(query, "i") }
            ]
          }
        : !Number.isNaN(year) && year > 0
          ? {
              createdAt: {
                $gte: new Date(Date.UTC(year, !Number.isNaN(month) && month >= 1 ? month - 1 : 0, 1)),
                $lt: !Number.isNaN(month) && month >= 1
                  ? new Date(Date.UTC(year, month, 1))
                  : new Date(Date.UTC(year + 1, 0, 1))
              }
            }
          : {})
    }).sort({ createdAt: -1 })
  ]);

  await sendPage(request, response, {
    title: "Search",
    activePage: "search",
    notice,
    content: renderSearchPage(
      query,
      results,
      tags.map((item) => ({ tag: item._id, count: item.count })),
      archives.map((item) => ({ year: item._id.year, month: item._id.month, count: item.count }))
    )
  });
}

async function renderAbout(request: Request, response: Response, notice?: Notice): Promise<void> {
  const profile = await ProfileModel.findOne().sort({ createdAt: 1 });

  await sendPage(request, response, {
    title: "About",
    activePage: "about",
    notice,
    content: renderAboutPage(profile)
  });
}

async function renderAccount(request: Request, response: Response, notice?: Notice, guestMode?: AccountGuestMode): Promise<void> {
  const resolvedGuestMode = guestMode ?? getAccountGuestMode(request.query.mode);

  await sendPage(request, response, {
    title: request.currentUser ? "Account" : "Sign in",
    activePage: "account",
    notice,
    content: renderAccountPage(request.currentUser, resolvedGuestMode)
  });
}

siteRouter.get("/", asyncHandler(async (request, response) => {
  await renderHome(request, response);
}));

siteRouter.get("/article", asyncHandler(async (request, response) => {
  const article = await ArticleModel.findOne({
    removedFromSiteAt: null,
    status: "published"
  }).sort({ createdAt: -1 });

  if (!article) {
    await renderHome(request, response, { tone: "error", message: "No accessible article is available." });
    return;
  }

  await renderArticleBySlug(request, response, article.slug);
}));

siteRouter.get("/articles/:slug", asyncHandler(async (request, response) => {
  await renderArticleBySlug(request, response, getRouteParam(request.params.slug, "slug"));
}));

siteRouter.post("/articles/:slug/comments", asyncHandler(async (request, response) => {
  const article = await ArticleModel.findOne({
    slug: getRouteParam(request.params.slug, "slug"),
    removedFromSiteAt: null
  });

  if (!article) {
    throw new HttpError(404, "Article not found.");
  }

  ensureArticleAccess(request, article);
  requireRole(request, ["viewer", "owner"]);

  await CommentModel.create({
    article: article._id,
    authorName: requireString(request.body.authorName, "authorName"),
    body: requireString(request.body.body, "body"),
    status: "approved"
  });

  await renderArticleBySlug(request, response, article.slug, { tone: "ok", message: "Comment posted." });
}));

siteRouter.get("/manage", asyncHandler(async (request, response) => {
  await renderManage(request, response);
}));

siteRouter.get("/editor", asyncHandler(async (request, response) => {
  await renderEditor(request, response, null);
}));

siteRouter.get("/editor/:id", asyncHandler(async (request, response) => {
  await renderEditor(request, response, getRouteParam(request.params.id, "id"));
}));

siteRouter.post("/manage/articles", asyncHandler(async (request, response) => {
  const user = requireRole(request, ["owner"]);
  const title = requireString(request.body.title, "title");
  const summary = requireString(request.body.summary, "summary");
  const content = requireString(request.body.content, "content");
  const slug = readOptionalString(request.body.slug) ? slugify(String(request.body.slug)) : slugify(title);

  const existing = await ArticleModel.findOne({ slug });
  if (existing) {
    await renderEditor(request, response, null, { tone: "error", message: "An article with that slug already exists." });
    return;
  }

  const article = await ArticleModel.create({
    author: user._id,
    authorName: user.name,
    title,
    slug,
    summary,
    content,
    categories: parseStringList(readOptionalString(request.body.categories)),
    tags: parseStringList(readOptionalString(request.body.tags)),
    status: request.body.intent === "publish" ? "published" : "draft",
    publishedAt: request.body.intent === "publish" ? new Date() : null
  });

  await renderEditor(request, response, String(article._id), {
    tone: "ok",
    message: request.body.intent === "publish" ? "Article published." : "Draft saved."
  });
}));

siteRouter.post("/manage/articles/:id", asyncHandler(async (request, response) => {
  const article = await ArticleModel.findById(getObjectId(getRouteParam(request.params.id, "id")));

  if (!article) {
    throw new HttpError(404, "Article not found.");
  }

  ensureArticleManagement(request, article);

  article.title = requireString(request.body.title, "title");
  article.summary = requireString(request.body.summary, "summary");
  article.content = requireString(request.body.content, "content");
  article.slug = readOptionalString(request.body.slug) ? slugify(String(request.body.slug)) : slugify(article.title);
  article.categories = parseStringList(readOptionalString(request.body.categories));
  article.tags = parseStringList(readOptionalString(request.body.tags));

  if (request.body.intent === "publish") {
    article.status = "published";
    article.publishedAt = new Date();
    article.removedFromSiteAt = null;
  }

  await article.save();

  await renderEditor(request, response, String(article._id), {
    tone: "ok",
    message: request.body.intent === "publish" ? "Article published." : "Draft saved."
  });
}));

siteRouter.post("/manage/articles/:id/publish", asyncHandler(async (request, response) => {
  const article = await ArticleModel.findById(getObjectId(getRouteParam(request.params.id, "id")));
  if (!article) {
    throw new HttpError(404, "Article not found.");
  }

  ensureArticleManagement(request, article);
  article.status = "published";
  article.publishedAt = new Date();
  article.removedFromSiteAt = null;
  await article.save();

  await renderManage(request, response, { tone: "ok", message: "Article publish action completed." });
}));

siteRouter.post("/manage/articles/:id/recall", asyncHandler(async (request, response) => {
  const article = await ArticleModel.findById(getObjectId(getRouteParam(request.params.id, "id")));
  if (!article) {
    throw new HttpError(404, "Article not found.");
  }

  ensureArticleManagement(request, article);
  article.status = "recalled";
  await article.save();

  await renderManage(request, response, { tone: "ok", message: "Article recall action completed." });
}));

siteRouter.post("/manage/articles/:id/remove", asyncHandler(async (request, response) => {
  const article = await ArticleModel.findById(getObjectId(getRouteParam(request.params.id, "id")));
  if (!article) {
    throw new HttpError(404, "Article not found.");
  }

  ensureArticleManagement(request, article);
  article.removedFromSiteAt = new Date();
  await article.save();

  await renderManage(request, response, { tone: "ok", message: "Article remove action completed." });
}));

siteRouter.get("/search", asyncHandler(async (request, response) => {
  await renderSearch(request, response);
}));

siteRouter.get("/about", asyncHandler(async (request, response) => {
  await renderAbout(request, response);
}));

siteRouter.get("/account", asyncHandler(async (request, response) => {
  await renderAccount(request, response);
}));

siteRouter.post("/auth/register", asyncHandler(async (request, response) => {
  const email = requireString(request.body.email, "email").toLowerCase();
  const password = requireString(request.body.password, "password");
  const existing = await UserModel.findOne({ email });

  if (existing) {
    await renderAccount(request, response, { tone: "error", message: "An account with that email already exists." }, "register");
    return;
  }

  const sessionToken = createSessionToken();
  await UserModel.create({
    email,
    name: requireString(request.body.name, "name"),
    role: "viewer",
    avatarUrl: readOptionalString(request.body.avatarUrl),
    bio: readOptionalString(request.body.bio),
    passwordHash: hashPassword(password),
    sessionTokenHash: hashSessionToken(sessionToken)
  });

  setSessionCookie(response, sessionToken);
  request.currentUser = await UserModel.findOne({ email, active: true });
  request.actorRole = request.currentUser?.role ?? "guest";

  await renderAccount(request, response, { tone: "ok", message: "Viewer account created and selected." });
}));

siteRouter.post("/auth/login", asyncHandler(async (request, response) => {
  const email = requireString(request.body.email, "email").toLowerCase();
  const password = requireString(request.body.password, "password");
  const user = await UserModel.findOne({ email, active: true });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await renderAccount(request, response, { tone: "error", message: "Invalid email or password." });
    return;
  }

  const sessionToken = createSessionToken();
  user.sessionTokenHash = hashSessionToken(sessionToken);
  await user.save();

  setSessionCookie(response, sessionToken);
  request.currentUser = user;
  request.actorRole = user.role;

  await renderAccount(request, response, { tone: "ok", message: "Logged in." });
}));

siteRouter.post("/auth/logout", asyncHandler(async (request, response) => {
  if (request.currentUser) {
    request.currentUser.sessionTokenHash = null;
    await request.currentUser.save();
  }

  clearSessionCookie(response);
  request.currentUser = null;
  request.actorRole = "guest";

  await renderHome(request, response, { tone: "ok", message: "Logged out." });
}));

siteRouter.post("/account/profile", asyncHandler(async (request, response) => {
  const user = requireAuthenticated(request);

  user.name = requireString(request.body.name, "name");
  user.avatarUrl = readOptionalString(request.body.avatarUrl);
  user.bio = readOptionalString(request.body.bio);

  if (readOptionalString(request.body.password)) {
    user.passwordHash = hashPassword(String(request.body.password).trim());
  }

  await user.save();
  request.currentUser = user;

  await renderAccount(request, response, { tone: "ok", message: "Profile updated." });
}));
