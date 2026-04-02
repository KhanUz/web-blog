import { model, Schema, Types } from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { CommentStatus } from "../types/blog.js";

export interface Comment {
  article: Types.ObjectId;
  authorName: string;
  body: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CommentDocument = HydratedDocument<Comment>;

const commentSchema = new Schema<Comment>(
  {
    article: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true
    },
    authorName: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const CommentModel = model<Comment>("Comment", commentSchema);
