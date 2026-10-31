
import { randomUUID } from "node:crypto";

const sessions = new Map();

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 1000;

export const createSession = ({
  owner,
  repo,
  commitSha,
  programs,
}) => {
  cleanupExpiredSessions();

  if (sessions.size >= MAX_SESSIONS) {
    const error = new Error(
      "Server is busy. Please try again later."
    );
    error.status = 503;
    throw error;
  }

  const sessionId = randomUUID();

  const session = {
    sessionId,
    owner,
    repo,
    commitSha,
    programs,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  sessions.set(sessionId, session);

  return session;
};

export const getSession = (sessionId) => {
  if (typeof sessionId !== "string") {
    return null;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  // Refresh expiration after activity.
  session.expiresAt = Date.now() + SESSION_TTL_MS;

  return session;
};

export const deleteSession = (sessionId) => {
  return sessions.delete(sessionId);
};

export const cleanupExpiredSessions = () => {
  const now = Date.now();

  for (const [sessionId, session] of sessions) {
    if (session.expiresAt <= now) {
      sessions.delete(sessionId);
    }
  }
};

// Remove expired sessions periodically.
const cleanupInterval = setInterval(() => {
  cleanupExpiredSessions();
}, 60 * 1000);

// Allow Node.js to exit naturally when no other work remains.
cleanupInterval.unref();
