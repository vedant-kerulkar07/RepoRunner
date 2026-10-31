
import { executeRepositoryProgram } from "../services/execution.service.js";

const MAX_INPUT_LENGTH = 10_000;
const MAX_FILE_PATH_LENGTH = 1000;

export const executeProgramController = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const body = req.body ?? {};
    const { filePath } = body;

    // 1. Validate session ID.
    if (
      typeof sessionId !== "string" ||
      !sessionId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid repository session ID is required.",
      });
    }

    // 2. Validate file path.
    if (
      typeof filePath !== "string" ||
      !filePath.trim() ||
      filePath.length > MAX_FILE_PATH_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid source file.",
      });
    }

    const normalizedPath = filePath.trim();

    // Reject absolute paths and path traversal.
    if (
      normalizedPath.startsWith("/") ||
      normalizedPath.includes("\\") ||
      normalizedPath.includes("\0") ||
      normalizedPath.split("/").some(
        (part) =>
          part === "." ||
          part === ".." ||
          part.length === 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid source file path.",
      });
    }

    // 3. Validate submitted input only if the property exists.
    // An empty string is valid input; undefined means no submission.
    const hasSubmittedInput = Object.hasOwn(body, "stdin");

    if (
      hasSubmittedInput &&
      typeof body.stdin !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Input must be a string.",
      });
    }

    if (
      hasSubmittedInput &&
      body.stdin.length > MAX_INPUT_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: "Input must not exceed 10000 characters.",
      });
    }

    // 4. Request AI analysis and output prediction.
    const result = await executeRepositoryProgram({
      sessionId: sessionId.trim(),
      filePath: normalizedPath,
      stdin: hasSubmittedInput ? body.stdin : undefined,
    });

    if (!result || typeof result !== "object") {
      throw new Error("The execution service returned an invalid result.");
    }

    const requiresUserInput =
      result.requiresUserInput === true;

    const isAiPrediction =
      result.outputType === "ai_prediction";

    const message = requiresUserInput
      ? "Additional input or input review is required."
      : isAiPrediction
        ? "AI output prediction completed. The program was not executed."
        : "Request completed.";

    // 5. Return a consistent response.
    return res.status(200).json({
      success: true,
      message,
      data: result,
    });
  } catch (error) {
    const statusCode =
      Number.isInteger(error?.statusCode) &&
      error.statusCode >= 400 &&
      error.statusCode <= 599
        ? error.statusCode
        : Number.isInteger(error?.status) &&
            error.status >= 400 &&
            error.status <= 599
          ? error.status
          : 500;

    console.error(
      "AI program analysis/prediction error:",
      {
        message: error?.message,
        status: statusCode,
      }
    );

    const clientErrorMessages = new Set([
      "A valid session ID is required.",
      "Please select a valid source file.",
      "Invalid source file path.",
      "Input must be a string.",
      "Input must not exceed 10000 characters.",
      "Session not found or expired. Analyze the repository again.",
      "The selected file does not belong to this repository session.",
      "Unable to identify the programming language from this file's contents. Please select the language manually or provide a file with a recognizable language.",
    ]);

    const isClientError =
      statusCode < 500 &&
      typeof error?.message === "string" &&
      error.message.length > 0;

    return res.status(statusCode).json({
      success: false,
      message: isClientError
        ? error.message
        : statusCode === 504
          ? "The request timed out. Please try again."
          : statusCode === 502
            ? "Unable to retrieve the selected source file from GitHub."
            : "Unable to analyze the selected program or predict its output.",
    });
  }
};
