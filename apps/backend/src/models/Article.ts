import { model, Schema, Types } from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { ArticleStatus } from "../types/blog.js";

export interface Article {
  author: Types.ObjectId | null;
  authorName: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  categories: string[];
  tags: string[];
  status: ArticleStatus;
  publishedAt: Date | null;
  removedFromSiteAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ArticleDocument = HydratedDocument<Article>;

const articleSchema = new Schema<Article>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    authorName: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    summary: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    categories: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["draft", "published", "recalled"],
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date,
      default: null
    },
    removedFromSiteAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

articleSchema.index({
  title: "text",
  summary: "text",
  content: "text",
  tags: "text",
  categories: "text"
});

export const ArticleModel = model<Article>("Article", articleSchema);
