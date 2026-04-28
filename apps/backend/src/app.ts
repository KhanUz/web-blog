import cors from "cors";
import express from "express";
import morgan from "morgan";
import { resolve } from "node:path";
import { resolveCurrentUser } from "./lib/auth.js";
import { HttpError } from "./lib/httpError.js";
import { articlesRouter } from "./routes/articles.js";
import { healthRouter } from "./routes/health.js";
import { metaRouter } from "./routes/meta.js";
import { siteRouter } from "./routes/site.js";
import { usersRouter } from "./routes/users.js";
import { getFrontendDistDir } from "./ui/assets.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use(resolveCurrentUser);
  app.use("/vendor", express.static(resolve(process.cwd(), "../../node_modules/htmx.org/dist")));
  app.use("/assets", express.static(resolve(getFrontendDistDir(), "assets")));

  app.use("/api/health", healthRouter);
  app.use("/api/articles", articlesRouter);
  app.use("/api/meta", metaRouter);
  app.use("/api/users", usersRouter);
  app.use(siteRouter);

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
