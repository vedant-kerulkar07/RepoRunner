
import { getSourceFile } from "../services/source.service.js";
import { getSession } from "../services/session.service.js";

export const getSourceFileController = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { filePath } = req.body ?? {};

    // Validate session ID.
    if (
      typeof sessionId !== "string" ||
      sessionId.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid repository session ID is required.",
      });
    }

    // Validate the requested path.
    if (
      typeof filePath !== "string" ||
      filePath.trim().length === 0 ||
      filePath.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid source file path is required.",
      });
    }

    const normalizedPath = filePath.trim();

    // Reject absolute paths, traversal, and invalid separators.
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

    // Retrieve the previously analyzed repository session.
    const session = getSession(sessionId.trim());

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Session not found or expired. Analyze the repository again.",
      });
    }

    // Support sessions created using either property.
    const repositoryFiles = session.files ?? session.programs ?? [];

    // Only allow files discovered in this session.
    const fileIsInRepository = repositoryFiles.some(
      (file) => file.path === normalizedPath
    );

    if (!fileIsInRepository) {
      return res.status(403).json({
        success: false,
        message:
          "This file is not part of the analyzed repository.",
      });
    }

    // Retrieve source at the exact analyzed commit.
    const result = await getSourceFile({
      owner: session.owner,
      repo: session.repo,
      commitSha: session.commitSha,
      filePath: normalizedPath,
    });

    return res.status(200).json({
      success: true,
      message: "Source file retrieved successfully.",
      data: {
        ...result,
        sessionId: session.sessionId ?? sessionId.trim(),
      },
    });
  } catch (error) {
    console.error(
      "Source file retrieval error:",
      error.message
    );

    // Map GitHub HTTP errors.
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message:
          "Source file not found at the analyzed commit.",
      });
    }

    if (error.status === 403 || error.status === 429) {
      return res.status(error.status).json({
        success: false,
        message:
          "GitHub API rate limit reached or access denied. Please try again later.",
      });
    }

    if (error.status === 401) {
      return res.status(502).json({
        success: false,
        message: "GitHub authentication failed.",
      });
    }

    // Handle request timeouts.
    if (
      error.name === "TimeoutError" ||
      error.name === "AbortError"
    ) {
      return res.status(504).json({
        success: false,
        message:
          "The request to GitHub timed out. Please try again.",
      });
    }

    // Validation and unsupported-input errors.
    const clientErrors = [
      "Invalid repository owner.",
      "Invalid repository name.",
      "A valid commit SHA is required.",
      "Invalid source file path.",
      "The selected path is not a file.",
      "Source file is too large. The maximum supported size is 500 KB.",
      "GitHub did not return file content in the expected format.",
    ];

    if (clientErrors.includes(error.message)) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Avoid exposing internal implementation details.
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve source file.",
    });
  }
};
