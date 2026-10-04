const AppError = require('../utils/appError');

function handleCastError(error) {
  return new AppError(`Invalid value '${error.value}' for path '${error.path}'`, 400);
}

function handleDuplicateKeyError(error) {
  const key = Object.keys(error.keyValue)[0];
  const value = error.keyValue[key];
  return new AppError(`Duplicate value '${value}' for key '${key}'`, 400);
}

function handleValidationError(error) {
  return new AppError(error.message, 400);
}

function handleTokenExpiredError(error) {
  return new AppError('Token has expired. Please login again.', 401);
}

function handleJsonWebTokenError(error) {
  return new AppError('Token is invalid. Please provide valid token', 401);
}

function handleMulterError(error) {
  return new AppError(error.message, 400);
}

function sendErrorDev(error, res) {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message || 'Something went wrong!',
    stack: error.stack,
    error,
  });
}

function sendErrorProd(error, res) {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message || 'Something went wrong!',
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'An unknown error occcured!',
    });
  }
}

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    let err;

    if (error.name === 'CastError') {
      err = handleCastError(error);
    }
    if (error.code === 11000) {
      err = handleDuplicateKeyError(error);
    }
    if (error.name === 'ValidationError') {
      err = handleValidationError(error);
    }
    if (error.name === 'TokenExpiredError') {
      err = handleTokenExpiredError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      err = handleJsonWebTokenError(error);
    }
    if (error.name === 'MulterError') {
      err = handleMulterError(error);
    }
    sendErrorProd(err ?? error, res);
  } else {
    sendErrorDev(error, res);
  }
};
