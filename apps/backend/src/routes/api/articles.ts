import { Router } from "express";
import mongoose from "mongoose";
import { serializeArticle, serializeComment } from "../../lib/api/serialize.js";
import { ensureArticleAccess, ensureArticleManagement, requireRole } from "../../lib/auth/auth.js";
import { slugify } from "../../lib/content/slugify.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { HttpError } from "../../lib/http/httpError.js";
import { ArticleModel } from "../../models/Article.js";
import { CommentModel } from "../../models/Comment.js";

export const articlesRouter = Router();

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${fieldName} is required.`);
  }

  return value.trim();
}

function getRouteParam(value: string | string[] | undefined, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${fieldName} route param is required.`);
  }

  return value;
}

async function findArticleById(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Invalid article id.");
  }

  const article = await ArticleModel.findById(id);

  if (!article) {
    throw new HttpError(404, "Article not found.");
  }

  return article;
}

articlesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const scope = typeof request.query.scope === "string" ? request.query.scope : "public";
    const status = typeof request.query.status === "string" ? request.query.status : undefined;
    const tag = typeof request.query.tag === "string" ? request.query.tag : undefined;
    const search = typeof request.query.search === "string" ? request.query.search : undefined;
    const year = Number(request.query.year);
    const month = Number(request.query.month);

    const query: Record<string, unknown> = {
      removedFromSiteAt: null
    };

    if (scope === "manage") {
      const user = requireRole(request, ["owner"]);
      query.author = user._id;
    } else {
      query.status = "published";
    }

    if (status && scope === "manage") {
      query.status = status;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search?.trim()) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { summary: new RegExp(search, "i") },
        { content: new RegExp(search, "i") },
        { tags: new RegExp(search, "i") }
      ];
    }

    if (!Number.isNaN(year) && year > 0) {
      const start = new Date(Date.UTC(year, !Number.isNaN(month) && month >= 1 ? month - 1 : 0, 1));
      const end = !Number.isNaN(month) && month >= 1
        ? new Date(Date.UTC(year, month, 1))
        : new Date(Date.UTC(year + 1, 0, 1));

      query.createdAt = {
        $gte: start,
        $lt: end
      };
    }

    const articles = await ArticleModel.find(query).sort({ createdAt: -1 });

    response.json({
      items: articles.map(serializeArticle)
    });
  })
);

articlesRouter.get(
  "/slug/:slug",
  asyncHandler(async (request, response) => {
    const slug = getRouteParam(request.params.slug, "slug");

    const article = await ArticleModel.findOne({
      slug,
      removedFromSiteAt: null
    });

    if (!article) {
      throw new HttpError(404, "Article not found.");
    }

    ensureArticleAccess(request, article);

    const comments = await CommentModel.find({
      article: article._id
    }).sort({ createdAt: -1 });

    response.json({
      article: serializeArticle(article),
      comments: comments.map(serializeComment)
    });
  })
);

articlesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const user = requireRole(request, ["owner"]);
    const title = requireString(request.body.title, "title");
    const summary = requireString(request.body.summary, "summary");
    const content = requireString(request.body.content, "content");
    const slug = typeof request.body.slug === "string" && request.body.slug.trim()
      ? slugify(request.body.slug)
      : slugify(title);

    const existing = await ArticleModel.findOne({ slug });

    if (existing) {
      throw new HttpError(409, "An article with that slug already exists.");
    }

    const article = await ArticleModel.create({
      author: user._id,
      authorName: user.name,
      title,
      slug,
      summary,
      content,
      categories: parseStringList(request.body.categories),
      tags: parseStringList(request.body.tags),
      status: request.body.status === "published" ? "published" : "draft",
      publishedAt: request.body.status === "published" ? new Date() : null
    });

    response.status(201).json({
      article: serializeArticle(article)
    });
  })
);

articlesRouter.patch(
  "/:id",
  asyncHandler(async (request, response) => {
    const article = await findArticleById(getRouteParam(request.params.id, "id"));
    ensureArticleManagement(request, article);

    if (typeof request.body.title === "string" && request.body.title.trim()) {
      article.title = request.body.title.trim();
    }

    if (typeof request.body.summary === "string" && request.body.summary.trim()) {
      article.summary = request.body.summary.trim();
    }

    if (typeof request.body.content === "string" && request.body.content.trim()) {
      article.content = request.body.content;
    }

    if (typeof request.body.slug === "string" && request.body.slug.trim()) {
      article.slug = slugify(request.body.slug);
    }

    if (Array.isArray(request.body.categories)) {
      article.categories = parseStringList(request.body.categories);
    }

    if (Array.isArray(request.body.tags)) {
      article.tags = parseStringList(request.body.tags);
    }

    await article.save();

    response.json({
      article: serializeArticle(article)
    });
  })
);

articlesRouter.post(
  "/:id/publish",
  asyncHandler(async (request, response) => {
    const article = await findArticleById(getRouteParam(request.params.id, "id"));
    ensureArticleManagement(request, article);
    article.status = "published";
    article.publishedAt = new Date();
    article.removedFromSiteAt = null;
    await article.save();

    response.json({
      article: serializeArticle(article)
    });
  })
);

articlesRouter.post(
  "/:id/recall",
  asyncHandler(async (request, response) => {
    const article = await findArticleById(getRouteParam(request.params.id, "id"));
    ensureArticleManagement(request, article);
    article.status = "recalled";
    await article.save();

    response.json({
      article: serializeArticle(article)
    });
  })
);

articlesRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const article = await findArticleById(getRouteParam(request.params.id, "id"));
    ensureArticleManagement(request, article);
    article.removedFromSiteAt = new Date();
    await article.save();

    response.json({
      article: serializeArticle(article)
    });
  })
);

articlesRouter.get(
  "/:id/comments",
  asyncHandler(async (request, response) => {
    const article = await findArticleById(getRouteParam(request.params.id, "id"));
    ensureArticleAccess(request, article);

    const comments = await CommentModel.find({
      article: article._id
    }).sort({ createdAt: -1 });

    response.json({
      items: comments.map(serializeComment)
    });
  })
);

articlesRouter.post(
  "/:id/comments",
  asyncHandler(async (request, response) => {
    const article = await findArticleById(getRouteParam(request.params.id, "id"));
    ensureArticleAccess(request, article);
    requireRole(request, ["viewer", "owner"]);

    const comment = await CommentModel.create({
      article: article._id,
      authorName: requireString(request.body.authorName, "authorName"),
      body: requireString(request.body.body, "body"),
      status: "approved"
    });

    response.status(201).json({
      comment: serializeComment(comment)
    });
  })
);
