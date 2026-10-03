const Review = require('../models/reviewModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const { createOne, getAll, getOne, deleteOne, updateOne } = require('./handlerFactory');

exports.filterUpdateBody = (req, res, next) => {
  const allowedFields = ['review', 'rating'];
  const filtered = {};

  allowedFields.forEach((field) => {
    if (Object.hasOwn(req.body || {}, field)) {
      filtered[field] = req.body[field];
    }
  });

  if (Object.keys(filtered).length === 0) {
    return next(new AppError('No valid fields to update. You can update: review, rating.', 400));
  }

  req.body = filtered;
  next();
};

exports.updateRequestBody = (req, res, next) => {
  req.body = {
    review: req.body?.review,
    rating: req.body?.rating,
    tour: req.params.tourId,
    user: req.user._id,
  };
  next();
};

exports.checkOwnership = async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) {
    return next(new AppError('Review does not exist', 404));
  }
  next();
};

exports.checkTourExists = async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new AppError('Tour not found', 404));
  }
  next();
};

exports.updateRequestFilter = (req, res, next) => {
  req.filterObj = {};
  if (req.params.tourId) {
    req.filterObj.tour = req.params.tourId;
  }
  next();
};

exports.createReview = createOne(Review);
exports.getAllReviews = getAll(Review);
exports.getReview = getOne(Review);
exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
