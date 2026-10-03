const Review = require('../models/reviewModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');

exports.createReview = async function (req, res, next) {
  const reviewDetails = {
    review: req.body?.review,
    rating: req.body?.rating,
    tour: req.params?.id,
    user: req.user?._id,
  };
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    return next(new AppError('Tour not found', 404));
  }
  const review = await Review.create(reviewDetails);
  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
};

exports.getAllReviews = async function (req, res, next) {
  const filter = {};
  if (req.params.id) {
    filter.tour = req.params.id;
  }
  const reviews = await Review.find(filter);
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
};
