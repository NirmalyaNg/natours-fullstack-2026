const path = require('node:path');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { getOne, getAll, createOne, updateOne, deleteOne } = require('./handlerFactory');
const multer = require('multer');

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

function filterUpdates(updates = {}, allowedUpdates = []) {
  const filteredUpdates = {};
  allowedUpdates.forEach((key) => {
    if (Object.hasOwn(updates, key)) {
      filteredUpdates[key] = updates[key];
    }
  });
  return filteredUpdates;
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../public/images/users');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const filename = `user-${req.user._id}-${Date.now()}.${ext}`;
    cb(null, filename);
  },
});

const multerFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new AppError('Selected file should be an image(jpg/png/jpeg/webp)', 400), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

exports.uploadProfilePhoto = upload.single('photo');

exports.updateMyProfile = async function (req, res, next) {
  if (req.body?.password || req.body?.passwordConfirm) {
    return next(new AppError('This route is not for updating passwords. Please use /updateMyPassword instead.', 400));
  }
  const allowedUpdates = ['name', 'email'];
  const filteredUpdates = filterUpdates(req.body || {}, allowedUpdates);

  if (req.file?.filename) {
    filteredUpdates['photo'] = req.file.filename;
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return next(new AppError('No valid fields to update. You can update: name, email, photo.', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredUpdates, {
    runValidators: true,
    returnDocument: 'after',
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
};

exports.deleteMe = async function (req, res, next) {
  const user = await User.findByIdAndUpdate(req.user.id, { isActive: false });
  if (!user) {
    return next(new AppError('User no longer exists.', 401));
  }
  res.clearCookie('refreshToken');
  res.status(204).send();
};

exports.getUser = getOne(User);
exports.getAllUsers = getAll(User);
exports.createUser = createOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
