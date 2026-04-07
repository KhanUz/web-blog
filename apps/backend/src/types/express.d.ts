import type { ActorRole } from "./blog.js";
import type { UserDocument } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      currentUser: UserDocument | null;
      actorRole: ActorRole;
    }
  }
}

export {};
