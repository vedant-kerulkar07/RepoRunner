
import { explainExecutionResult } from "./groq.service.js";

const getAuthoritativeStatus = (result) => {
  if (result.timedOut) return "timeout";
  if (result.outputLimitExceeded) return "output_limit";
  if (result.exitCode === 0) return "success";
  if (result.exitCode !== null) return "runtime_error";
  return "unknown";
};

export const createResultExplanationService = ({
  explainExecutionResult: explainResult = explainExecutionResult,
  logger = console,
} = {}) => {
  return async ({
    language,
    filePath,
    sourceCode,
    stdin,
    result,
  }) => {
    const status = getAuthoritativeStatus(result);

    try {
      const explanation = await explainResult({
        language,
        filePath,
        sourceCode,
        stdin,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
      });

      return {
        status,
        explanation,
        explanationAvailable: true,
      };
    } catch (error) {
      logger.error("AI explanation unavailable:", error.message);

      return {
        status,
        explanation: null,
        explanationAvailable: false,
        explanationMessage:
          "The program ran, but its AI explanation is temporarily unavailable.",
      };
    }
  };
};

export const explainProgramResult = createResultExplanationService();
