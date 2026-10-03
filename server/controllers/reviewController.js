const Review = require('../models/reviewModel');

exports.createReview = async function (req, res, next) {
  const review = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
};

exports.getAllReviews = async function (req, res, next) {
  const reviews = await Review.find({});
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
};
