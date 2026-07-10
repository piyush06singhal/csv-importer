export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  public readonly details: any;

  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AIProviderError extends ApplicationError {
  constructor(message: string, statusCode: number = 502) {
    super(message, statusCode, 'AI_PROVIDER_ERROR');
  }
}

export class CSVParsingError extends ApplicationError {
  constructor(message: string) {
    super(message, 422, 'CSV_PARSING_ERROR');
  }
}

export class HTTPError extends ApplicationError {
  constructor(message: string, statusCode: number, errorCode: string = 'HTTP_ERROR') {
    super(message, statusCode, errorCode);
  }
}
