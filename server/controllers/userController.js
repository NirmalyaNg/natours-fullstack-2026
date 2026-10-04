const path = require('node:path');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { getOne, getAll, createOne, updateOne, deleteOne } = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

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

const multerStorage = multer.memoryStorage();

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
  limits: { fileSize: 2 * 1024 * 1024 }, // 2Mb
});

exports.resizeProfilePhoto = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  const filePath = path.join(__dirname, `../public/images/users/${req.file.filename}`);

  await sharp(req.file.buffer)
    .resize({ width: 400, height: 400 })
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(filePath);
  next();
};

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
