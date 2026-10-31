
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const MAX_INPUT_LENGTH = 10_000;
const MAX_FILE_PATH_LENGTH = 1000;
const REQUEST_TIMEOUT_MS = 60_000;

export async function executeProgram({
  sessionId,
  filePath,
  stdin,
}) {
  // 1. Validate repository session.
  if (
    typeof sessionId !== "string" ||
    !sessionId.trim()
  ) {
    throw new Error(
      "Repository session is missing. Analyze the repository again."
    );
  }

  // 2. Validate selected source file.
  if (
    typeof filePath !== "string" ||
    !filePath.trim()
  ) {
    throw new Error(
      "Select a source file before analyzing the program."
    );
  }

  const normalizedPath = filePath.trim();

  if (
    normalizedPath.length > MAX_FILE_PATH_LENGTH ||
    normalizedPath.startsWith("/") ||
    normalizedPath.includes("\\") ||
    normalizedPath.includes("\0") ||
    normalizedPath.split("/").some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        segment.length === 0
    )
  ) {
    throw new Error("The selected source file path is invalid.");
  }

  // 3. Validate optional input.
  if (
    stdin !== undefined &&
    typeof stdin !== "string"
  ) {
    throw new Error("Program input must be a string.");
  }

  if (
    typeof stdin === "string" &&
    stdin.length > MAX_INPUT_LENGTH
  ) {
    throw new Error(
      "Program input must not exceed 10000 characters."
    );
  }

  const requestBody = {
    filePath: normalizedPath,
  };

  // Preserve the difference between omitted input and "".
  if (stdin !== undefined) {
    requestBody.stdin = stdin;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/sessions/${encodeURIComponent(
        sessionId.trim()
      )}/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );
  } catch (error) {
    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    ) {
      throw new Error(
        "AI analysis timed out. Please try again."
      );
    }

    throw new Error(
      "Unable to connect to RepoRunner's server. Check that the backend is running and the API URL is correct."
    );
  }

  // 4. Parse response safely.
  const data = await response.json().catch(() => null);

  // 5. Handle API errors.
  if (!response.ok || !data?.success) {
    throw new Error(
      typeof data?.message === "string" &&
      data.message.trim()
        ? data.message
        : `AI analysis request failed (${response.status}).`
    );
  }

  // 6. Validate response data.
  if (
    !data.data ||
    typeof data.data !== "object" ||
    Array.isArray(data.data)
  ) {
    throw new Error(
      "The server returned an unexpected analysis response."
    );
  }

  return data.data;
}
