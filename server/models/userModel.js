const crypto = require('node:crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { refreshTokenExpiryDays } = require('../config/auth');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'A user must have an email'],
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Email is invalid',
      },
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'guide', 'lead-guide', 'admin'],
        message: "A user can have the following roles: 'user', 'guide', 'lead-guide', 'admin'",
      },
      default: 'user',
    },
    password: {
      type: String,
      select: false,
      required: [true, 'A user must have a password'],
      minLength: [8, 'Password should have atleast 8 characters'],
    },
    passwordConfirm: {
      type: String,
      required: [
        function () {
          return this.isModified('password');
        },
        ,
        'A user must have a password confirm',
      ],
      validate: {
        validator: function (value) {
          return this.password === value;
        },
        message: 'Passwords do not match',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.password;
        delete ret.isActive;
        delete ret.__v;
        delete ret.passwordChangedAt;
        return ret;
      },
    },
  },
);

// Hash plain text password
userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordConfirm = undefined;
  }
});

// Update passwordChangedAt when password is changed except signup
userSchema.pre('save', function () {
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = Date.now() - 2000;
  }
});

// Generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES || '1h',
  });
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: `${refreshTokenExpiryDays}d`,
  });
};

// Compare plain password and hashed password
userSchema.methods.verifyPassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const passwordResetToken = crypto.randomBytes(30).toString('hex');
  const hashedPasswordResetToken = crypto.createHash('sha256').update(passwordResetToken).digest('hex');
  this.passwordResetToken = hashedPasswordResetToken;
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return passwordResetToken;
};

// Check if user has changed password after token was generated
userSchema.methods.passwordChangedAfter = function (tokenIssuedAtMs) {
  if (this.passwordChangedAt) {
    const passwordChangedAtMs = this.passwordChangedAt.getTime();
    return passwordChangedAtMs > tokenIssuedAtMs;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
