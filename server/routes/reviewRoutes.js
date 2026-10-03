const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.protect, authController.authorize('user', 'admin'), reviewController.createReview);

module.exports = router;
