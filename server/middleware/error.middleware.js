
 // server/src/middleware/error.middleware.js

export const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorMiddleware = (err, _req, res, _next) => {
  console.error("Unhandled API error:", err.message);

  if (res.headersSent) {
    return;
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
    });
  }

  return res.status(err.statusCode || err.status || 500).json({
    success: false,
    message:
      err.statusCode && err.statusCode < 500
        ? err.message
        : "An unexpected server error occurred.",
  });
};
