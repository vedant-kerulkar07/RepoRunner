
import { getSupportedLanguages } from "../utils/language.utils.js";

const MAX_SOURCE_LENGTH = 500_000;
const MAX_INPUT_LENGTH = 10_000;

export class RunnerError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "RunnerError";
    this.statusCode = statusCode;
  }
}

export const validateExecutionRequest = ({
  language,
  sourceCode,
  stdin = "",
  filePath = "program.js",
}) => {
  const supportedLanguages = getSupportedLanguages();

  if (!supportedLanguages.includes(language)) {
    throw new RunnerError(
      `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(", ")}.`,
      415
    );
  }

  if (
    typeof sourceCode !== "string" ||
    sourceCode.trim().length === 0
  ) {
    throw new RunnerError("Source code is required.");
  }

  if (sourceCode.length > MAX_SOURCE_LENGTH) {
    throw new RunnerError(
      `Source code exceeds the ${MAX_SOURCE_LENGTH}-character limit.`,
      413
    );
  }

  if (typeof stdin !== "string") {
    throw new RunnerError("Program input must be a string.");
  }

  if (stdin.length > MAX_INPUT_LENGTH) {
    throw new RunnerError(
      `Program input exceeds the ${MAX_INPUT_LENGTH}-character limit.`,
      413
    );
  }

  if (
    typeof filePath !== "string" ||
    !filePath.trim() ||
    filePath.length > 1000 ||
    filePath.includes("\0")
  ) {
    throw new RunnerError("Invalid source file path.");
  }

  return {
    language,
    sourceCode,
    stdin,
    filePath,
  };
};

export const createExecutionResult = ({
  status,
  stdout = "",
  stderr = "",
  exitCode = null,
  timedOut = false,
  durationMs = 0,
}) => ({
  status,
  stdout,
  stderr,
  exitCode,
  timedOut,
  durationMs,
});
