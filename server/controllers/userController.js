const User = require('../models/userModel');
const AppError = require('../utils/appError');

function filterUpdates(updates = {}, allowedUpdates = []) {
  const filteredUpdates = {};
  allowedUpdates.forEach((key) => {
    if (Object.hasOwn(updates, key)) {
      filteredUpdates[key] = updates[key];
    }
  });
  return filteredUpdates;
}

exports.updateMyProfile = async function (req, res, next) {
  if (req.body?.password || req.body?.passwordConfirm) {
    return next(new AppError('This route is not for updating passwords. Please use /updateMyPassword instead.', 400));
  }
  const allowedUpdates = ['name', 'email'];
  const filteredUpdates = filterUpdates(req.body || {}, allowedUpdates);
  if (Object.keys(filteredUpdates).length === 0) {
    return next(new AppError('No valid fields to update. You can update: name, email.', 400));
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
