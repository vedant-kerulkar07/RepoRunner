
import express from "express";
import {
  getLanguagesController,
} from "../controllers/language.controller.js";

const languageRouter = express.Router();

languageRouter.get("/", getLanguagesController);

export default languageRouter;
