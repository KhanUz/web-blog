import { Router } from "express";
import mongoose from "mongoose";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    mongoUri: env.mongoUri,
    mongoDbPath: env.mongoDbPath,
    timestamp: new Date().toISOString()
  });
});
