const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);

// protecte routes
router.use(authController.protect);
router.patch('/updateMyPassword', authController.updateMyPassword);
router.patch(
  '/updateMe',
  userController.uploadProfilePhoto,
  userController.resizeProfilePhoto,
  userController.updateMyProfile,
);
router.delete('/deleteMe', userController.deleteMe);

// protected routes + authorized for admins only
router.use(authController.authorize('admin'));
router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
