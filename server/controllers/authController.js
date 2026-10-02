const { refreshTokenExpiryDays } = require('../config/auth');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');

exports.protect = async function (req, res, next) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return next(new AppError('Token is not present. Please login.', 401));
  }
  const accessToken = req.headers.authorization.split('Bearer ')[1];
  const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);
  const existingUser = await User.findById(decoded.id).select('+password');
  if (!existingUser) {
    return next(new AppError('User no longer exists', 401));
  }
  // Check if user has changed password after token was generated
  req.user = existingUser;
  next();
};

exports.authorize = function (...roles) {
  return function (req, res, next) {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('You are not authorized to perform this action.', 403));
    }
    next();
  };
};

function generateAndSendTokens(user, res, statusCode = 200) {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + refreshTokenExpiryDays * 24 * 60 * 60 * 1000),
  });

  res.status(statusCode).json({
    status: 'success',
    data: {
      accessToken,
    },
  });
}

exports.signup = async function (req, res, next) {
  const userDetails = {
    name: req.body?.name,
    email: req.body?.email,
    password: req.body?.password,
    passwordConfirm: req.body?.passwordConfirm,
  };

  const newUser = await User.create(userDetails);
  generateAndSendTokens(newUser, res, 201);
};

exports.login = async function (req, res, next) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return next(new AppError('Both email and password are mandatory', 400));
  }

  const existingUser = await User.findOne({ email }).select('+password');
  if (!existingUser || !(await existingUser.verifyPassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }
  generateAndSendTokens(existingUser, res);
};

exports.refresh = async function (req, res, next) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return next(new AppError('Unauthenticated. Please login.', 401));
  }
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
  const existingUser = await User.findById(decoded.id);
  if (!existingUser) {
    return next(new AppError('User no longer exists.', 401));
  }

  generateAndSendTokens(existingUser, res);
};
