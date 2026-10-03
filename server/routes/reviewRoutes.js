const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({
  mergeParams: true,
});

router
  .route('/')
  .get(reviewController.updateRequestFilter, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.authorize('user', 'admin'),
    reviewController.checkTourExists,
    reviewController.updateRequestBody,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.protect,
    authController.authorize('user', 'admin'),
    reviewController.checkOwnership,
    reviewController.filterUpdateBody,
    reviewController.updateReview,
  )
  .delete(
    authController.protect,
    authController.authorize('user', 'admin'),
    reviewController.checkOwnership,
    reviewController.deleteReview,
  );

module.exports = router;
