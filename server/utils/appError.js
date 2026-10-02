module.exports = class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    // This removes the AppError constructor itself from the stack trace, so the trace starts where the error was actually created
    Error.captureStackTrace(this, this.constructor);
  }
};
