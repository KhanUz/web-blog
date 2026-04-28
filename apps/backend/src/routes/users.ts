import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuthenticated } from "../lib/auth.js";
import { HttpError } from "../lib/httpError.js";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "../lib/passwords.js";
import { clearSessionCookie, setSessionCookie } from "../lib/session.js";
import { serializeUser } from "../lib/serialize.js";
import { UserModel } from "../models/User.js";
import type { UserRole } from "../types/blog.js";

export const usersRouter = Router();

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${fieldName} is required.`);
  }

  return value.trim();
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function readRole(value: unknown): UserRole | undefined {
  if (value === "viewer" || value === "owner") {
    return value;
  }

  return undefined;
}

usersRouter.get(
  "/session",
  asyncHandler(async (request, response) => {
    response.json({
      currentUser: request.currentUser ? serializeUser(request.currentUser) : null,
      capabilities: {
        canManageBlogs: request.actorRole === "owner",
        canManageComments: false,
        canManageAccounts: false,
        canEditOwnProfile: request.currentUser !== null
      }
    });
  })
);

usersRouter.post(
  "/register",
  asyncHandler(async (request, response) => {
    const email = requireString(request.body.email, "email").toLowerCase();
    const password = requireString(request.body.password, "password");
    const existing = await UserModel.findOne({ email });

    if (existing) {
      throw new HttpError(409, "An account with that email already exists.");
    }

    const sessionToken = createSessionToken();
    const user = await UserModel.create({
      email,
      name: requireString(request.body.name, "name"),
      role: "viewer",
      avatarUrl: readOptionalString(request.body.avatarUrl) ?? "",
      bio: readOptionalString(request.body.bio) ?? "",
      passwordHash: hashPassword(password),
      sessionTokenHash: hashSessionToken(sessionToken)
    });

    setSessionCookie(response, sessionToken);

    response.status(201).json({
      user: serializeUser(user),
      sessionToken
    });
  })
);

usersRouter.post(
  "/login",
  asyncHandler(async (request, response) => {
    const email = requireString(request.body.email, "email").toLowerCase();
    const password = requireString(request.body.password, "password");

    const user = await UserModel.findOne({ email, active: true });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, "Invalid email or password.");
    }

    const sessionToken = createSessionToken();
    user.sessionTokenHash = hashSessionToken(sessionToken);
    await user.save();

    setSessionCookie(response, sessionToken);

    response.json({
      user: serializeUser(user),
      sessionToken
    });
  })
);

usersRouter.post(
  "/logout",
  asyncHandler(async (request, response) => {
    const user = requireAuthenticated(request);
    user.sessionTokenHash = null;
    await user.save();
    clearSessionCookie(response);

    response.json({
      success: true
    });
  })
);

usersRouter.get(
  "/me",
  asyncHandler(async (request, response) => {
    const user = requireAuthenticated(request);

    response.json({
      user: serializeUser(user)
    });
  })
);

usersRouter.patch(
  "/me",
  asyncHandler(async (request, response) => {
    const user = requireAuthenticated(request);

    const name = readOptionalString(request.body.name);
    const avatarUrl = readOptionalString(request.body.avatarUrl);
    const bio = readOptionalString(request.body.bio);

    if (name) {
      user.name = name;
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (typeof request.body.password === "string" && request.body.password.trim() !== "") {
      user.passwordHash = hashPassword(request.body.password.trim());
    }

    await user.save();

    response.json({
      user: serializeUser(user)
    });
  })
);
