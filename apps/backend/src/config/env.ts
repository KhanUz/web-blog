import { config } from "dotenv";

config();

export const env = {
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/web-blog",
  mongoDbPath: process.env.MONGODB_DB_PATH ?? "../../db",
  port: Number(process.env.PORT ?? 4000)
};
