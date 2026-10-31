
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pathToFileURL } from "node:url";

import repositoriesrouter from "./routes/repository.routes.js";
import sourcerouter from "./routes/source.routes.js";
import sessionsrouter from "./routes/session.routes.js";
import executionrouter from "./routes/execution.routes.js";

import {
  apiRateLimiter,
  executionRateLimiter,
} from "./middleware/rate-limit.middleware.js";

import {
  notFoundMiddleware,
  errorMiddleware,
} from "./middleware/error.middleware.js";
import languageRouter from "./routes/language.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "100kb" }));

// Health check
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "RepoRunner API is running",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
  });
});

// General API rate limiting
app.use("/api", apiRateLimiter);

// API routes
app.use("/api/repositories", repositoriesrouter);
app.use("/api/sessions", sourcerouter);
app.use("/api/sessions", sessionsrouter);
app.use("/api/languages", languageRouter);
// Execution routes apply their own stricter rate limit.
app.use("/api/sessions", executionrouter);

// Handle unknown routes
app.use(notFoundMiddleware);

// Central error handler — must be registered last
app.use(errorMiddleware);

// Start listening only when this file is run directly.
// This allows Supertest to import app without opening a port.
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  app.listen(PORT, () => {
    console.log(`RepoRunner API running at http://localhost:${PORT}`);
  });
}

export default app;
