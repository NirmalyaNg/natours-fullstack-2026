const mongoose = require('mongoose');
const validator = require('validator');

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
      required: [true, 'A user must have a password confirm'],
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
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

module.exports = User;
