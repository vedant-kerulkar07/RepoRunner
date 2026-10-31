
const MAX_INPUT_LENGTH = 10_000;

const VALID_INPUT_MODES = [
  "stdin",
  "arguments",
  "file",
  "interactive",
  "none",
  "uncertain",
];

const VALID_CONFIDENCE = ["high", "medium", "low"];

// --------------------------------------------------
// 1. Validate source analysis
// --------------------------------------------------

const validateAnalysis = (analysis) => {
  if (
    !analysis ||
    typeof analysis !== "object" ||
    Array.isArray(analysis)
  ) {
    throw new Error("Valid source analysis is required.");
  }

  if (
    typeof analysis.requiresInput !== "boolean" ||
    !VALID_INPUT_MODES.includes(analysis.inputMode) ||
    !VALID_CONFIDENCE.includes(analysis.confidence) ||
    !Array.isArray(analysis.sampleInputs) ||
    !analysis.sampleInputs.every(
      (item) => typeof item === "string"
    )
  ) {
    throw new Error("Invalid input analysis data.");
  }

  if (
    analysis.inputPrompt !== undefined &&
    typeof analysis.inputPrompt !== "string"
  ) {
    throw new Error("Invalid input prompt.");
  }

  if (
    analysis.inputFormat !== undefined &&
    typeof analysis.inputFormat !== "string"
  ) {
    throw new Error("Invalid input format.");
  }

  if (
    analysis.inputExplanation !== undefined &&
    typeof analysis.inputExplanation !== "string"
  ) {
    throw new Error("Invalid input explanation.");
  }

  if (
    analysis.warnings !== undefined &&
    (
      !Array.isArray(analysis.warnings) ||
      !analysis.warnings.every(
        (item) => typeof item === "string"
      )
    )
  ) {
    throw new Error("Invalid input analysis warnings.");
  }
};

// --------------------------------------------------
// 2. Validate user-provided input
// --------------------------------------------------

const validateUserInput = (input) => {
  if (typeof input !== "string") {
    throw new Error("Program input must be a string.");
  }

  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Program input must not exceed ${MAX_INPUT_LENGTH} characters.`
    );
  }
};

// --------------------------------------------------
// 3. Create an input plan
// --------------------------------------------------

export const createInputPlan = (
  analysis,
  userProvidedInput
) => {
  validateAnalysis(analysis);

  const {
    inputMode,
    confidence,
    requiresInput,
    sampleInputs,
    inputPrompt = "",
    inputFormat = "",
    inputExplanation = "",
    warnings = [],
  } = analysis;

  const suggestedInputs = sampleInputs.slice(0, 3);

  const commonFields = {
    suggestedInputs,
    inputPrompt,
    inputFormat,
    inputExplanation,
    warnings,
  };

  // Explicit user input takes precedence,
  // including an explicitly provided empty string.
  if (userProvidedInput !== undefined) {
    validateUserInput(userProvidedInput);

    return {
      mode: inputMode,
      stdin: userProvidedInput,
      source: "user",
      requiresUserAction: false,
      readyToExecute: true,
      message: "Using the input provided by the user.",
      ...commonFields,
    };
  }

  // Automatically proceed only when analysis clearly
  // indicates that no external input is required.
  if (inputMode === "none" && !requiresInput) {
    return {
      mode: "none",
      stdin: "",
      source: "automatic",
      requiresUserAction: false,
      readyToExecute: true,
      message: "No standard input is expected.",
      ...commonFields,
    };
  }

  // Never silently supply AI-generated sample input.
  // The user must review and provide input.
  return {
    mode: inputMode,
    stdin: "",
    source: "none",
    requiresUserAction: true,
    readyToExecute: false,
    message: getManualInputMessage(
      inputMode,
      confidence,
      requiresInput,
      inputPrompt
    ),
    ...commonFields,
  };
};

// --------------------------------------------------
// 4. Generate a contextual input message
// --------------------------------------------------

const getManualInputMessage = (
  inputMode,
  confidence,
  requiresInput,
  inputPrompt = ""
) => {
  if (inputMode === "none" && requiresInput) {
    return "The analysis is inconsistent. Review whether this program needs input.";
  }

  if (inputMode === "none" && !requiresInput) {
    return "No standard input is expected.";
  }

  // Show the actual source-code prompt when known.
  // Avoid replacing a known prompt with a generic message
  // just because confidence is medium or low.
  if (
    inputMode === "stdin" &&
    requiresInput &&
    inputPrompt.trim()
  ) {
    return `This program prompts: "${inputPrompt.trim()}" Enter the requested input to continue.`;
  }

  if (
    confidence !== "high" ||
    inputMode === "uncertain"
  ) {
    return "Input requirements are uncertain. Review the suggested examples and provide input if needed.";
  }

  switch (inputMode) {
    case "stdin":
      return requiresInput
        ? "This program requires standard input. Enter the value requested by the program."
        : "The program may or may not need standard input. Confirm whether input is required.";

    case "arguments":
      return "This program may require command-line arguments. Standard input alone may not be sufficient.";

    case "file":
      return "This program may read from a file. Supply or configure the required file before predicting its behavior.";

    case "interactive":
      return "This program may require interactive input. Review its input prompts and provide the required values.";

    default:
      return "Review the input requirements before predicting this program's output.";
  }
};
