import cors from "cors";
import express from "express";
import morgan from "morgan";
import { healthRouter } from "./routes/health.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/", (_request, response) => {
    response.json({
      message: "Web blog backend is running."
    });
  });

  app.use("/api/health", healthRouter);

  return app;
}
