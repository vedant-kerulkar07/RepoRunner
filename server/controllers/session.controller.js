
import {
  getSession,
  deleteSession,
} from "../services/session.service.js";

export const getSessionController = (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or expired. Analyze the repository again.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        repository: `${session.owner}/${session.repo}`,
        commitSha: session.commitSha,
        programs: session.programs,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Get session error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve session.",
    });
  }
};

export const deleteSessionController = (req, res) => {
  try {
    const { sessionId } = req.params;

    const deleted = deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Session not found or already expired.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session deleted successfully.",
    });
  } catch (error) {
    console.error("Delete session error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete session.",
    });
  }
};
