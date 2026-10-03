const express = require('express');
const reviewRouter = require('../routes/reviewRoutes');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use('/:id/reviews', reviewRouter);
router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.authorize('admin', 'lead-guide'), tourController.createTour);
router.get('/top-5-cheap', tourController.top5Cheap, tourController.getAllTours);
router.get('/tour-stats', tourController.getTourStats);
router.get('/monthly-tour-plan/:year', tourController.getMonthlyTourPlan);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.authorize('admin', 'lead-guide'), tourController.updateTour)
  .delete(authController.protect, authController.authorize('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;
