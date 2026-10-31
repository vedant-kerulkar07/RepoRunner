
import express from "express";
import { executeProgramController } from "../controllers/execution.controller.js";
import { executionRateLimiter } from "../middleware/rate-limit.middleware.js";

const executionrouter = express.Router();

executionrouter.post(
  "/:sessionId/execute",
  executionRateLimiter,
  executeProgramController
);

export default executionrouter;
