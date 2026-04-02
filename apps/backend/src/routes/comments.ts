import { Router } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { serializeComment } from "../lib/serialize.js";
import { CommentModel } from "../models/Comment.js";

export const commentsRouter = Router();

commentsRouter.post(
  "/:id/review",
  asyncHandler(async (request, response) => {
    const id = typeof request.params.id === "string" ? request.params.id : "";

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpError(400, "Invalid comment id.");
    }

    const comment = await CommentModel.findById(id);

    if (!comment) {
      throw new HttpError(404, "Comment not found.");
    }

    const status = request.body.status;

    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      throw new HttpError(400, "status must be approved, rejected, or pending.");
    }

    comment.status = status;
    await comment.save();

    response.json({
      comment: serializeComment(comment)
    });
  })
);
