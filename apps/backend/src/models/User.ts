import { model, Schema } from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { UserRole } from "../types/blog.js";

export interface User {
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  passwordHash: string;
  sessionTokenHash: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["viewer", "owner"],
      required: true,
      default: "viewer",
      index: true
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true
    },
    bio: {
      type: String,
      default: "",
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    sessionTokenHash: {
      type: String,
      default: null,
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = model<User>("User", userSchema);
