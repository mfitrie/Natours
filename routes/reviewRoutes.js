const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// by default, each router only has access to the parameter of their specific routes
// 'mergeParams' will merge the parameter of url, which is come from the other router
const router = express.Router({ mergeParams: true});

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews
// POST /reviews


router.use(authController.protect);

router
.route('/')
.get(reviewController.getAllReviews)
.post(authController.restrictTo('user'), 
     reviewController.setTourUserIds,
     reviewController.createReview);


router
.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrictTo('user', 'admin'),
    reviewController.updateReview)
.delete(authController.restrictTo('user', 'admin'), 
    reviewController.deleteReview);

module.exports = router;