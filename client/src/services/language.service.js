
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 15_000;

export async function fetchSupportedLanguages() {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/languages`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    ) {
      throw new Error(
        "Fetching supported languages timed out. Please try again."
      );
    }

    throw new Error(
      "Unable to connect to RepoRunner's server. Check that the backend is running."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      typeof data?.message === "string" && data.message.trim()
        ? data.message
        : `Failed to fetch supported languages (${response.status}).`
    );
  }

  if (!Array.isArray(data.data)) {
    throw new Error(
      "The server returned an unexpected supported languages response."
    );
  }

  // Ensure every language entry is usable by the frontend.
  const languages = data.data.filter(
    (language) =>
      typeof language === "string" && language.trim().length > 0
  );

  return languages.map((language) => language.trim());
}
