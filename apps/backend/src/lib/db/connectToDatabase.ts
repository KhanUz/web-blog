import mongoose from "mongoose";
import { env } from "../../config/env.js";

export async function connectToDatabase(): Promise<void> {
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected using ${env.mongoUri}`);
  console.log(`MongoDB data path is expected at ${env.mongoDbPath}`);
}
