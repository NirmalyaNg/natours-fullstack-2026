const mongoose = require('mongoose');

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

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
