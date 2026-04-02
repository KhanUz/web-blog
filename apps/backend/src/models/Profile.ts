import { model, Schema } from "mongoose";
import type { HydratedDocument } from "mongoose";

export interface ProfileLink {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  role: string;
  bio: string;
  topics: string[];
  links: ProfileLink[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProfileDocument = HydratedDocument<Profile>;

const profileLinkSchema = new Schema<ProfileLink>(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const profileSchema = new Schema<Profile>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      required: true,
      trim: true
    },
    topics: {
      type: [String],
      default: []
    },
    links: {
      type: [profileLinkSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const ProfileModel = model<Profile>("Profile", profileSchema);
