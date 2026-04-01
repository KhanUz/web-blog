import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectToDatabase(): Promise<void> {
  if (!env.mongoUri) {
    console.warn("MONGODB_URI is not set. Starting backend without a database connection.");
    return;
  }

  await mongoose.connect(env.mongoUri);
}
