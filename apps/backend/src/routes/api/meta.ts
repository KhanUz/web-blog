import { Router } from "express";
import { serializeArticle, serializeProfile } from "../../lib/api/serialize.js";
import { asyncHandler } from "../../lib/http/asyncHandler.js";
import { ArticleModel } from "../../models/Article.js";
import { ProfileModel } from "../../models/Profile.js";

export const metaRouter = Router();

metaRouter.get(
  "/categories",
  asyncHandler(async (_request, response) => {
    const result = await ArticleModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          removedFromSiteAt: null,
          status: "published"
        }
      },
      { $unwind: "$categories" },
      {
        $group: {
          _id: "$categories",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1, _id: 1 } }
    ]);

    response.json({
      items: result.map((item) => ({
        category: item._id,
        count: item.count
      }))
    });
  })
);

metaRouter.get(
  "/tags",
  asyncHandler(async (_request, response) => {
    const result = await ArticleModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          removedFromSiteAt: null,
          status: "published"
        }
      },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1, _id: 1 } }
    ]);

    response.json({
      items: result.map((item) => ({
        tag: item._id,
        count: item.count
      }))
    });
  })
);

metaRouter.get(
  "/search",
  asyncHandler(async (request, response) => {
    const query = typeof request.query.q === "string" ? request.query.q.trim() : "";

    if (!query) {
      response.json({
        items: []
      });
      return;
    }

    const articles = await ArticleModel.find({
      removedFromSiteAt: null,
      status: "published",
      $or: [
        { title: new RegExp(query, "i") },
        { summary: new RegExp(query, "i") },
        { content: new RegExp(query, "i") },
        { tags: new RegExp(query, "i") },
        { categories: new RegExp(query, "i") }
      ]
    }).sort({ createdAt: -1 });

    response.json({
      items: articles.map(serializeArticle)
    });
  })
);

metaRouter.get(
  "/archives",
  asyncHandler(async (_request, response) => {
    const result = await ArticleModel.aggregate<{
      _id: { year: number; month: number };
      count: number;
    }>([
      {
        $match: {
          removedFromSiteAt: null,
          status: "published"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1
        }
      }
    ]);

    response.json({
      items: result.map((item) => ({
        year: item._id.year,
        month: item._id.month,
        count: item.count
      }))
    });
  })
);

metaRouter.get(
  "/about",
  asyncHandler(async (_request, response) => {
    const profile = await ProfileModel.findOne().sort({ createdAt: 1 });

    response.json({
      profile: profile ? serializeProfile(profile) : null
    });
  })
);

metaRouter.put(
  "/about",
  asyncHandler(async (request, response) => {
    const current = await ProfileModel.findOne().sort({ createdAt: 1 });

    const nextValues = {
      name: typeof request.body.name === "string" ? request.body.name.trim() : current?.name ?? "",
      role: typeof request.body.role === "string" ? request.body.role.trim() : current?.role ?? "",
      bio: typeof request.body.bio === "string" ? request.body.bio.trim() : current?.bio ?? "",
      topics: Array.isArray(request.body.topics)
        ? request.body.topics.filter((item: unknown): item is string => typeof item === "string" && item.trim() !== "")
        : current?.topics ?? [],
      links: Array.isArray(request.body.links)
        ? request.body.links.filter(
            (item: unknown): item is { label: string; url: string } =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as { label?: unknown }).label === "string" &&
              typeof (item as { url?: unknown }).url === "string"
          )
        : current?.links ?? []
    };

    const profile = current
      ? await ProfileModel.findByIdAndUpdate(current._id, nextValues, { new: true, runValidators: true })
      : await ProfileModel.create(nextValues);

    response.json({
      profile: profile ? serializeProfile(profile) : null
    });
  })
);
