import { config } from "dotenv";

config();

export const env = {
  mongoUri: process.env.MONGODB_URI,
  port: Number(process.env.PORT ?? 4000)
};
