const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);
router.patch('/updateMyPassword', authController.protect, authController.updateMyPassword);
router.patch('/updateMe', authController.protect, userController.updateMyProfile);

module.exports = router;
