
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export async function fetchSourceFile(sessionId, filePath) {
  if (!sessionId) {
    throw new Error(
      "Repository session is missing. Analyze the repository again."
    );
  }

  if (!filePath) {
    throw new Error("Select a source file first.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}/source`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filePath }),
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || `Unable to retrieve source file (${response.status}).`
    );
  }

  if (!result.data) {
    throw new Error("The server returned an unexpected source response.");
  }

  return result.data;
}
