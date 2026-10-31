
import { getSession } from "./session.service.js";
import { getSourceFile } from "./source.service.js";
import {
  analyzeSourceCode,
  predictProgramOutput,
} from "./groq.service.js";
import { createInputPlan } from "./input.service.js";
import { RunnerError } from "../runners/runner.interface.js";
import { detectLanguage } from "../utils/language.utils.js";

const MAX_INPUT_LENGTH = 10_000;

const isKnownLanguage = (language) => {
  return (
    typeof language === "string" &&
    language.trim().length > 0 &&
    language.trim().toLowerCase() !== "unknown"
  );
};

export const createExecutionService = ({
  getSession: findSession = getSession,
  getSourceFile: fetchSource = getSourceFile,
  analyzeSourceCode: analyzeSource = analyzeSourceCode,
  createInputPlan: planInput = createInputPlan,
  predictProgramOutput: predictOutput = predictProgramOutput,
  RunnerErrorClass = RunnerError,
  logger = console,
} = {}) => {
  return async ({ sessionId, filePath, stdin }) => {
    // 1. Validate the request.
    if (
      typeof sessionId !== "string" ||
      !sessionId.trim()
    ) {
      throw new RunnerErrorClass(
        "A valid session ID is required.",
        400
      );
    }

    if (
      typeof filePath !== "string" ||
      !filePath.trim() ||
      filePath.length > 1000
    ) {
      throw new RunnerErrorClass(
        "Please select a valid source file.",
        400
      );
    }

    if (
      stdin !== undefined &&
      typeof stdin !== "string"
    ) {
      throw new RunnerErrorClass(
        "Program input must be a string.",
        400
      );
    }

    if (
      typeof stdin === "string" &&
      stdin.length > MAX_INPUT_LENGTH
    ) {
      throw new RunnerErrorClass(
        "Program input must not exceed 10000 characters.",
        400
      );
    }

    const normalizedSessionId = sessionId.trim();
    const normalizedPath = filePath.trim();

    // Reject invalid repository-relative paths.
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
      throw new RunnerErrorClass(
        "Invalid source file path.",
        400
      );
    }

    logger.info?.("[RepoRunner] Starting AI prediction", {
      filePath: normalizedPath,
      hasSubmittedInput: stdin !== undefined,
    });

    // 2. Retrieve the repository session.
    const session = findSession(normalizedSessionId);

    if (!session) {
      throw new RunnerErrorClass(
        "Session not found or expired. Analyze the repository again.",
        404
      );
    }

    if (
      !session.owner ||
      !session.repo ||
      !session.commitSha
    ) {
      throw new RunnerErrorClass(
        "Repository session is missing its owner, repository, or commit information.",
        400
      );
    }

    // 3. Validate that the file belongs to this session.
    // Support both the new "files" field and the legacy "programs" field.
    const programs = Array.isArray(session.files)
      ? session.files
      : Array.isArray(session.programs)
        ? session.programs
        : [];

    const selectedProgram = programs.find(
      (program) => program.path === normalizedPath
    );

    if (!selectedProgram) {
      throw new RunnerErrorClass(
        "The selected file does not belong to this repository session.",
        403
      );
    }

    // 4. Fetch source BEFORE final language detection.
    // Extensionless files cannot reliably be classified by their names.
    let sourceFile;

    try {
      logger.info?.("[RepoRunner] Fetching GitHub source", {
        owner: session.owner,
        repo: session.repo,
        commitSha: session.commitSha,
        filePath: normalizedPath,
      });

      sourceFile = await fetchSource({
        owner: session.owner,
        repo: session.repo,
        commitSha: session.commitSha,
        filePath: normalizedPath,
      });

      logger.info?.("[RepoRunner] Source fetch completed", {
        filePath: sourceFile?.path || normalizedPath,
        sourceLength:
          typeof sourceFile?.sourceCode === "string"
            ? sourceFile.sourceCode.length
            : 0,
        detectedLanguage: sourceFile?.language || "Unknown",
      });
    } catch (error) {
      logger.error?.("[RepoRunner] GitHub source fetch failed", {
        filePath: normalizedPath,
        message: error?.message,
        cause: error?.cause?.message,
      });

      // Preserve existing HTTP-style errors.
      if (
        Number.isInteger(error?.statusCode) &&
        error.statusCode >= 400
      ) {
        throw error;
      }

      if (
        Number.isInteger(error?.status) &&
        error.status >= 400
      ) {
        throw new RunnerErrorClass(
          error.message || "GitHub source retrieval failed.",
          error.status
        );
      }

      if (
        error?.name === "TimeoutError" ||
        error?.name === "AbortError"
      ) {
        throw new RunnerErrorClass(
          "The request to GitHub timed out. Please try again.",
          504
        );
      }

      throw new RunnerErrorClass(
        "Unable to fetch the selected source file from GitHub. Check the server's network connection and try again.",
        502
      );
    }

    if (
      !sourceFile ||
      typeof sourceFile.sourceCode !== "string" ||
      !sourceFile.sourceCode.trim()
    ) {
      throw new RunnerErrorClass(
        "The selected source file is empty or could not be retrieved.",
        422
      );
    }

    const resolvedFilePath =
      sourceFile.path || normalizedPath;

    // 5. Determine the language using the fetched file information.
    //
    // source.service.js now detects languages using both the extension
    // and, when needed, the actual source contents.
    const sourceDetectedLanguage = sourceFile.language;

    let language;

    if (isKnownLanguage(sourceDetectedLanguage)) {
      language = sourceDetectedLanguage;
    } else {
      // Fallback to the existing language utility.
      // This may still return Unknown for ambiguous extensionless files.
      const fallbackLanguage = detectLanguage(
        resolvedFilePath,
        selectedProgram.language
      );

      if (isKnownLanguage(fallbackLanguage)) {
        language = fallbackLanguage;
      }
    }

    if (!isKnownLanguage(language)) {
      throw new RunnerErrorClass(
        "Unable to identify the programming language from this file's contents. Please select the language manually or provide a file with a recognizable language.",
        415
      );
    }

    logger.info?.("[RepoRunner] Language resolved", {
      filePath: resolvedFilePath,
      language,
      commitSha: session.commitSha,
    });

    // 6. Analyze source code with Groq.
    let analysis;

    try {
      logger.info?.("[RepoRunner] Starting Groq source analysis", {
        language,
        filePath: resolvedFilePath,
        sourceLength: sourceFile.sourceCode.length,
      });

      analysis = await analyzeSource({
        language,
        sourceCode: sourceFile.sourceCode,
        filePath: resolvedFilePath,
      });

      if (
        !analysis ||
        typeof analysis !== "object" ||
        Array.isArray(analysis)
      ) {
        throw new Error(
          "Groq returned an invalid source analysis."
        );
      }

      logger.info?.("[RepoRunner] Source analysis completed", {
        language,
        filePath: resolvedFilePath,
        inputMode: analysis.inputMode,
        requiresInput: analysis.requiresInput,
        confidence: analysis.confidence,
      });
    } catch (error) {
      logger.error?.("[RepoRunner] AI source analysis failed", {
        language,
        filePath: resolvedFilePath,
        message: error?.message,
        statusCode: error?.statusCode,
        cause: error?.cause?.message,
      });

      throw error;
    }

    // 7. Create the input plan.
    let inputPlan;

    try {
      inputPlan = await planInput(analysis, stdin);

      if (
        !inputPlan ||
        typeof inputPlan !== "object" ||
        Array.isArray(inputPlan)
      ) {
        throw new Error(
          "Unable to prepare a valid input plan."
        );
      }

      logger.info?.("[RepoRunner] Input plan created", {
        readyToExecute: inputPlan.readyToExecute,
        mode: inputPlan.mode,
        hasInput: typeof inputPlan.stdin === "string",
      });
    } catch (error) {
      logger.error?.("[RepoRunner] Input planning failed", {
        message: error?.message,
        statusCode: error?.statusCode,
      });

      if (
        Number.isInteger(error?.statusCode) &&
        error.statusCode >= 400
      ) {
        throw error;
      }

      throw new RunnerErrorClass(
        error?.message || "Unable to prepare program input.",
        400
      );
    }

    // 8. Return an input request if more user input is needed.
    if (inputPlan.readyToExecute !== true) {
      return {
        executed: false,
        outputType: "ai_prediction",
        requiresUserInput: true,
        message:
          inputPlan.message ||
          "Review the input requirements before predicting output.",
        file: resolvedFilePath,
        language,
        commitSha: session.commitSha,
        analysis,
        inputPlan,
        result: null,
        resultExplanation: null,
      };
    }

    // 9. Predict output with Groq.
    // This is AI prediction, not actual compilation or execution.
    let result;

    try {
      logger.info?.("[RepoRunner] Starting output prediction", {
        language,
        filePath: resolvedFilePath,
        inputLength: (inputPlan.stdin ?? "").length,
      });

      result = await predictOutput({
        language,
        filePath: resolvedFilePath,
        sourceCode: sourceFile.sourceCode,
        stdin: inputPlan.stdin ?? "",
      });

      if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result)
      ) {
        throw new Error(
          "Groq returned an invalid output prediction."
        );
      }

      logger.info?.("[RepoRunner] Output prediction completed", {
        language,
        filePath: resolvedFilePath,
        compilationLikely: result.compilationLikely,
        confidence: result.confidence,
      });
    } catch (error) {
      logger.error?.("[RepoRunner] Output prediction failed", {
        language,
        filePath: resolvedFilePath,
        message: error?.message,
        statusCode: error?.statusCode,
        cause: error?.cause?.message,
      });

      throw error;
    }

    // 10. Return the prediction with explicit execution status.
    const safeResult = {
      ...result,
      executed: false,
      outputType: "ai_prediction",
    };

    logger.info?.("[RepoRunner] Prediction request completed", {
      language,
      filePath: resolvedFilePath,
      executed: false,
    });

    return {
      executed: false,
      outputType: "ai_prediction",
      requiresUserInput: false,
      file: resolvedFilePath,
      language,
      commitSha: session.commitSha,
      analysis,

      inputPlan: {
        mode: inputPlan.mode,
        source: inputPlan.source,
        message: inputPlan.message,
        inputFormat: inputPlan.inputFormat ?? "",
        suggestedInputs: inputPlan.suggestedInputs ?? [],
        warnings: inputPlan.warnings ?? [],
      },

      result: safeResult,

      resultExplanation: {
        available: true,
        explanation: safeResult.explanation ?? "",
        resultType: "ai_prediction",
        keyPoints: safeResult.executionSteps ?? [],
        suggestions: safeResult.potentialIssues ?? [],
        confidence: safeResult.confidence ?? "low",
        limitations: safeResult.limitations ?? [],
      },
    };
  };
};

export const executeRepositoryProgram =
  createExecutionService();
