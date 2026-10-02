const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.authorize('admin', 'lead-guide'), tourController.createTour);
router.get('/top-5-cheap', tourController.top5Cheap, tourController.getAllTours);
router.get('/tour-stats', tourController.getTourStats);
router.get('/monthly-tour-plan/:year', tourController.getMonthlyTourPlan);
router.route('/:id').get(tourController.getTour).patch(tourController.updateTour).delete(tourController.deleteTour);

module.exports = router;
