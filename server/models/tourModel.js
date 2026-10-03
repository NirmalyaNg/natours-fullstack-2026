const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minLength: [10, 'A tour name must have atleast 10 characters'],
      maxLength: [40, 'A tour can have a maximum of 40 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maximum group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: "Difficulty can be either 'easy', 'medium' or 'difficult'",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A tour can have an average rating of minimum 1'],
      max: [5, 'A tour can have an average rating of maximum 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: 'A tour cannot have a discount which is more than its price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    startDates: [Date],
    slug: String,
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: {
          values: ['Point'],
          message: "Type for start location can have the following values: 'Point'",
        },
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // GeoJSON
        type: {
          type: String,
          default: 'Point',
          enum: {
            values: ['Point'],
            message: "Type for location can only be 'Point'",
          },
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

const guidesPopulate = { path: 'guides', select: 'name email' };

// Confifure virtual property reviews on tour schema
tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});

// Populate tour guides for queries starting with find
tourSchema.pre(/^find/, function () {
  this.populate(guidesPopulate);
});

tourSchema.post('save', async function (doc) {
  await doc.populate(guidesPopulate);
});

// Populate tour guides for tour creation / update since both use .save/.create
tourSchema.pre(/^find/, function () {
  this.populate(this.model.guidesPopulate);
});

// Virtual property for duration in weeks
tourSchema.virtual('durationWeeks').get(function () {
  if (this.duration === undefined) return undefined; // Is duration is not queried for tours, we return undefined so that durationWeeks is not present in response
  return Math.round((this.duration / 7) * 10) / 10;
});

// Filter out secret tours for all queries starting with find
tourSchema.pre(/^find/, function () {
  this.find({
    isSecret: {
      $ne: true,
    },
  });
});

// Filter out secret tours for aggregations
tourSchema.pre('aggregate', function () {
  this.pipeline().unshift({
    $match: {
      isSecret: {
        $ne: true,
      },
    },
  });
});

// Create slug from tour name
tourSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true });
  }
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
