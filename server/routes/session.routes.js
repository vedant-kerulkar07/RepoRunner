
import express from "express";

import {
  getSessionController,
  deleteSessionController,
} from "../controllers/session.controller.js";

const sessionsrouter = express.Router();

// GET /api/sessions/:sessionId
sessionsrouter.get("/:sessionId", getSessionController);

// DELETE /api/sessions/:sessionId
sessionsrouter.delete("/:sessionId", deleteSessionController);

export default sessionsrouter;
