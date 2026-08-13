const AppError = require("../utils/AppError");

function notFoundHandler(req, res, next) {
  next(new AppError(`No route matches ${req.method} ${req.originalUrl}`, 404));
}

// Centralized error handler. Every controller can just `throw new AppError(...)`
// or let a rejected promise bubble up through asyncHandler — it all lands here.
function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  if (!isAppError) {
    // Unexpected/programmer errors: log full detail server-side, don't leak internals.
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message: isAppError ? err.message : "Something went wrong on our end.",
      details: isAppError ? err.details : undefined,
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
