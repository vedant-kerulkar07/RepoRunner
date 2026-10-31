
import { getSupportedLanguages } from "../utils/language.utils.js";

export const getLanguagesController = (req, res) => {
  try {
    const languages = getSupportedLanguages();

    const data = languages.map((language) => ({
      id: language,
      name: language,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "Failed to fetch supported languages:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch supported languages.",
    });
  }
};
