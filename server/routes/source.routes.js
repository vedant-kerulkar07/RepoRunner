
import express from "express";
import {
  getSourceFileController,
} from "../controllers/source.controller.js";

const sourcerouter = express.Router();

// POST /api/sessions/:sessionId/source
sourcerouter.post("/:sessionId/source", getSourceFileController);

export default sourcerouter;
