const crypto = require('crypto');
const { refreshTokenExpiryDays } = require('../config/auth');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');

exports.protect = async function (req, res, next) {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return next(new AppError('Token is not present. Please login.', 401));
  }
  const accessToken = req.headers.authorization.split('Bearer ')[1];
  const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);
  const existingUser = await User.findById(decoded.id);
  if (!existingUser) {
    return next(new AppError('User no longer exists', 401));
  }
  // Check if user has changed password after token was generated
  const hasPasswordChangedAfter = existingUser.passwordChangedAfter(decoded.iat * 1000);
  if (hasPasswordChangedAfter) {
    return next(new AppError('User has changed password recently. Please login again.', 401));
  }
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
  // Check if user changed password after refresh token was generated
  if (existingUser.passwordChangedAfter(decoded.iat * 1000)) {
    return next(new AppError('Password was changed. Please login again.', 401));
  }

  generateAndSendTokens(existingUser, res);
};

exports.forgotPassword = async function (req, res, next) {
  const email = req.body?.email;
  if (!email) {
    return next(new AppError('Email is required', 400));
  }
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res.status(200).json({
      status: 'success',
      data: { message: 'If an account exists for this email, a reset link has been sent.' },
    });
  }
  const passwordResetToken = existingUser.generatePasswordResetToken();
  await existingUser.save({ validateBeforeSave: false });

  const passwordResetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${passwordResetToken}`;
  try {
    await sendEmail({
      subject: 'Your password reset url(Valid for 10 minutes)',
      text: `Forgot your password? Please send a PATCH request to ${passwordResetUrl} with your new password and confirm password. If you did not request for a new password please ignore this email.`,
      email,
    });
    res.status(200).json({
      status: 'success',
      data: { message: 'If an account exists for this email, a reset link has been sent.' },
    });
  } catch (error) {
    existingUser.passwordResetToken = undefined;
    existingUser.passwordResetTokenExpires = undefined;
    await existingUser.save({ validateBeforeSave: false });
    next(new AppError('Failed to send email. Please try again after sometime', 500));
  }
};

exports.resetPassword = async function (req, res, next) {
  const resetToken = req.params.resetToken;
  const { newPassword, newPasswordConfirm } = req.body || {};

  if (!resetToken || !newPassword || !newPasswordConfirm) {
    return next(new AppError('Reset token, new password and confirm new password are required.', 400));
  }

  const hashedPasswordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const existingUser = await User.findOne({
    passwordResetToken: hashedPasswordResetToken,
    passwordResetTokenExpires: {
      $gt: Date.now(),
    },
  });
  if (!existingUser) {
    return next(new AppError('Invalid reset token or reset token has expired.', 400));
  }
  existingUser.password = newPassword;
  existingUser.passwordConfirm = newPasswordConfirm;
  existingUser.passwordResetToken = undefined;
  existingUser.passwordResetTokenExpires = undefined;

  await existingUser.save();
  generateAndSendTokens(existingUser, res);
};
