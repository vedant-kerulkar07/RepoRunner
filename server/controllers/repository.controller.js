
import { analyzeRepository } from "../services/github.service.js";
import { createSession } from "../services/session.service.js";

export const analyzeRepositoryController = async (req, res) => {
  try {
    const { repositoryUrl } = req.body ?? {};

    // Validate the repository URL.
    if (
      typeof repositoryUrl !== "string" ||
      repositoryUrl.trim().length === 0 ||
      repositoryUrl.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid repository URL.",
      });
    }

    // Fetch repository metadata and all eligible files.
    const result = await analyzeRepository(repositoryUrl.trim());

    // Get the owner and repository name from the full GitHub name.
    const fullName = result.repository.name;
    const separatorIndex = fullName.indexOf("/");

    if (
      separatorIndex <= 0 ||
      separatorIndex === fullName.length - 1
    ) {
      return res.status(500).json({
        success: false,
        message: "GitHub returned an invalid repository name.",
      });
    }

    const owner = fullName.slice(0, separatorIndex);
    const repo = fullName.slice(separatorIndex + 1);

    // Use all discovered files, including extensionless files.
    const programs = result.files ?? result.programs ?? [];

    // Create a session pinned to the analyzed commit.
    const session = createSession({
      owner,
      repo,
      commitSha: result.repository.commitSha,
      programs,
    });

    // Return repository information and file-list statistics.
    return res.status(200).json({
      success: true,
      message: result.truncated
        ? "Repository analyzed, but the file listing may be incomplete."
        : "Repository analyzed successfully.",

      data: {
        ...result,

        // Keep both properties for compatibility with the frontend.
        files: programs,
        programs,

        totalFiles: programs.length,
        truncated: result.truncated ?? false,

        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error(
      "Repository analysis error:",
      error.message
    );

    const statusCode = error.status;

    // GitHub resource not found.
    if (statusCode === 404) {
      return res.status(404).json({
        success: false,
        message:
          "Repository not found or not publicly accessible.",
      });
    }

    // GitHub rate limit or access restriction.
    if (statusCode === 403 || statusCode === 429) {
      return res.status(statusCode).json({
        success: false,
        message:
          "GitHub API rate limit reached or access denied. Please try again later.",
      });
    }

    // Invalid repository URL or unsupported host.
    if (
      error.message.includes("valid GitHub repository URL") ||
      error.message.includes("Only GitHub repository URLs") ||
      error.message.includes("Enter a URL like") ||
      error.message.includes("GitHub")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Archived repositories are not supported.
    if (error.message === "This repository is archived.") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Unsupported private repositories.
    if (
      error.message ===
      "Private repositories are not supported yet."
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle network timeouts and unexpected failures.
    if (
      error.name === "TimeoutError" ||
      error.name === "AbortError"
    ) {
      return res.status(504).json({
        success: false,
        message:
          "GitHub request timed out. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to analyze repository.",
    });
  }
};
