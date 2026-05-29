import { ERROR_CODES } from "../constants";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code: string = ERROR_CODES.INTERNAL,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message, ERROR_CODES.NOT_FOUND);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(400, message, ERROR_CODES.VALIDATION_ERROR);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, ERROR_CODES.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, ERROR_CODES.FORBIDDEN);
  }
}
