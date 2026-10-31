
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 30_000;

export async function analyzeRepository(repositoryUrl) {
  if (
    typeof repositoryUrl !== "string" ||
    !repositoryUrl.trim()
  ) {
    throw new Error("Please enter a valid GitHub repository URL.");
  }

  const normalizedUrl = repositoryUrl.trim();

  let parsedUrl;

  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    throw new Error("Please enter a valid GitHub repository URL.");
  }

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname.toLowerCase() !== "github.com" ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new Error(
      "Please provide a valid HTTPS GitHub repository URL."
    );
  }

  const pathSegments = parsedUrl.pathname
    .split("/")
    .filter(Boolean);

  if (
    pathSegments.length !== 2 ||
    pathSegments.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        segment.includes("\\")
    )
  ) {
    throw new Error(
      "Use a repository URL in the format https://github.com/owner/repository."
    );
  }

  // Remove query parameters and fragments from the submitted URL.
  const cleanRepositoryUrl =
    `https://github.com/${pathSegments[0]}/${pathSegments[1]}`;

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/repositories/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: cleanRepositoryUrl,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );
  } catch (error) {
    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    ) {
      throw new Error(
        "Repository analysis timed out. Please try again."
      );
    }

    throw new Error(
      "Unable to connect to the RepoRunner server. Check that the backend is running and the API URL is correct."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    const message =
      typeof data?.message === "string" && data.message.trim()
        ? data.message
        : `Repository analysis failed (${response.status}).`;

    throw new Error(message);
  }

  if (
    !data.data ||
    typeof data.data !== "object" ||
    Array.isArray(data.data)
  ) {
    throw new Error(
      "The server returned an unexpected repository analysis response."
    );
  }

  return data.data;
}
