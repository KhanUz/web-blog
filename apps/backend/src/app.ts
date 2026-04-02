import cors from "cors";
import express from "express";
import morgan from "morgan";
import { HttpError } from "./lib/httpError.js";
import { articlesRouter } from "./routes/articles.js";
import { commentsRouter } from "./routes/comments.js";
import { healthRouter } from "./routes/health.js";
import { metaRouter } from "./routes/meta.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/", (_request, response) => {
    response.json({
      message: "Web blog backend is running.",
      endpoints: {
        health: "/api/health",
        articles: "/api/articles",
        search: "/api/meta/search?q=design",
        tags: "/api/meta/tags",
        categories: "/api/meta/categories",
        archives: "/api/meta/archives",
        about: "/api/meta/about"
      }
    });
  });

  app.use("/api/health", healthRouter);
  app.use("/api/articles", articlesRouter);
  app.use("/api/comments", commentsRouter);
  app.use("/api/meta", metaRouter);

  app.use((request, _response, next) => {
    next(new HttpError(404, `Route not found: ${request.method} ${request.originalUrl}`));
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof HttpError) {
      response.status(error.statusCode).json({
        error: error.message
      });
      return;
    }

    console.error(error);

    response.status(500).json({
      error: "Internal server error."
    });
  });

  return app;
}
