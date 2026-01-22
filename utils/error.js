// utils/errors.js
export class AppError extends Error {
  constructor(message, status = 500, code = "APP_ERROR", extras = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.extras = extras;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", extras = {}) {
    super(message, 400, "BAD_REQUEST", extras);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", extras = {}) {
    super(message, 404, "NOT_FOUND", extras);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", extras = {}) {
    super(message, 409, "CONFLICT", extras);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", extras = {}) {
    super(message, 403, "FORBIDDEN", extras);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", extras = {}) {
    super(message, 401, "UNAUTHORIZED", extras);
  }
}
