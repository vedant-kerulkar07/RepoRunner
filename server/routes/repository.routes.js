
import express from "express";
import {
  analyzeRepositoryController,
} from "../controllers/repository.controller.js";

const repositoriesrouter = express.Router();

// POST /api/repositories/analyze
repositoriesrouter.post("/analyze", analyzeRepositoryController);

export default repositoriesrouter;
