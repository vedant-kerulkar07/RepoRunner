
 // server/src/middleware/rate-limit.middleware.js

import rateLimit from "express-rate-limit";

const createRateLimiter = ({
  windowMs,
  limit,
  message,
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message,
      });
    },
  });

// General API protection: 100 requests per 15 minutes per IP.
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: "Too many requests. Please try again later.",
});

// Execution endpoints are more expensive: 10 requests per minute per IP.
export const executionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  message: "Too many execution requests. Please wait before trying again.",
});
