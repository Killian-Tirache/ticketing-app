export class AppError extends Error {
  statusCode: number;
  errorType?: string;
  details?: string[];

  constructor(
    message: string,
    statusCode: number,
    errorType?: string,
    details?: string[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
  }
}
