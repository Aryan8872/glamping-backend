// src/core/upload/multerErrors.js
/**
 * Normalize multer errors into consistent HTTP responses.
 */
export function multerErrorHandler(err, req, res, next) {
  if (!err) return next();

  // Multer-specific errors
  if (err instanceof Error && err.name === "MulterError") {
    // Examples: LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, LIMIT_UNEXPECTED_FILE
    const code = err.code || "MULTER_ERROR";
    const message = err.message || "File upload error";

    return res.status(400).json({ error: message, code });
  }

  // Custom thrown errors from fileFilter or elsewhere
  if (err.message && /Invalid file type/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }

  // Fallback
  return next(err);
}
