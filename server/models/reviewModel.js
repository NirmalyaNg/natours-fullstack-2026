const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have some content'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating'],
      min: [1, 'Rating must be a minimum of 1'],
      max: [5, 'Rating can be a maximum of 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    toJSON: {
      transform: function (_, ret) {
        ret.id = ret._id;
        delete ret.__v;
        delete ret._id;
        return ret;
      },
    },
  },
);

// Allow one review per tour for one user
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

const tourAndUserPopulates = [
  // { path: 'tour', select: 'name price' },
  { path: 'user', select: 'name email' },
];

// Populate tour and user for reviews(fetch)
reviewSchema.pre(/^find/, function () {
  this.populate(tourAndUserPopulates);
});

// Populate tour and user for reviews (creation/updation)
reviewSchema.post('save', async function (doc) {
  await doc.populate(tourAndUserPopulates);
});

// Static method to calculate and save ratingsAverage and ratingsQuantity for a tour
reviewSchema.statics.calculateReviewStats = async function (tourId) {
  const reviewStats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: null,
        numRatings: {
          $sum: 1,
        },
        avgRating: {
          $avg: '$rating',
        },
      },
    },
  ]);
  if (reviewStats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: reviewStats[0].avgRating,
      ratingsQuantity: reviewStats[0].numRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

// Invoke static method to calculate and save ratingsAverage and ratingsQuantity for the associated tour when a review is deleted
reviewSchema.post(/^findOneAnd/, async function (doc) {
  const tourId = doc.tour._id ?? doc.tour;
  await this.model.calculateReviewStats(tourId);
});

// Invoke static method to calculate and save ratingsAverage and ratingsQuantity for the associated tour when a review is created/updated
reviewSchema.post('save', async function (doc) {
  const tourId = doc.tour._id ?? doc.tour;
  await doc.model().calculateReviewStats(tourId);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
