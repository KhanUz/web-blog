import mongoose from "mongoose";
import type express from "express";
import { HttpError } from "./httpError.js";
import { UserModel } from "../models/User.js";
import type { ArticleDocument } from "../models/Article.js";
import type { UserDocument } from "../models/User.js";
import type { UserRole } from "../types/blog.js";
import { hashSessionToken } from "./passwords.js";

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  return undefined;
}

export async function resolveCurrentUser(
  request: express.Request,
  _response: express.Response,
  next: express.NextFunction
): Promise<void> {
  const authHeader = getHeaderValue(request.header("authorization"));
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;

  request.currentUser = null;
  request.actorRole = "guest";

  if (!token) {
    next();
    return;
  }

  const sessionTokenHash = hashSessionToken(token);
  const user = await UserModel.findOne({
    sessionTokenHash,
    active: true
  });

  if (!user) {
    next(new HttpError(401, "Authenticated session was not found or is inactive."));
    return;
  }

  request.currentUser = user;
  request.actorRole = user.role;
  next();
}

export function requireAuthenticated(request: express.Request): UserDocument {
  if (!request.currentUser) {
    throw new HttpError(401, "Authentication is required for this action.");
  }

  return request.currentUser;
}

export function requireRole(request: express.Request, roles: UserRole[]): UserDocument {
  const user = requireAuthenticated(request);

  if (!roles.includes(user.role)) {
    throw new HttpError(403, "You do not have permission to perform this action.");
  }

  return user;
}

export function ensureArticleAccess(request: express.Request, article: ArticleDocument): void {
  if (article.removedFromSiteAt && request.actorRole !== "owner") {
    throw new HttpError(404, "Article not found.");
  }

  if (request.actorRole === "owner") {
    return;
  }

  if (request.currentUser && article.author && article.author.equals(request.currentUser._id)) {
    return;
  }

  if (article.status !== "published" || article.removedFromSiteAt !== null) {
    throw new HttpError(404, "Article not found.");
  }
}

export function ensureArticleManagement(request: express.Request, article: ArticleDocument): UserDocument {
  const user = requireRole(request, ["owner"]);

  if (!article.author || !article.author.equals(user._id)) {
    throw new HttpError(403, "Owners can only manage their own articles.");
  }

  return user;
}
