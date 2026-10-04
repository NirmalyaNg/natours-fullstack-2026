const path = require('node:path');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const { getAll, createOne, updateOne, deleteOne, getOne } = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new AppError('Selected file should be an image(png/jpeg/webp)', 400), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}); // 5 MB per files

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files?.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-cover-${Date.now()}.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(path.join(__dirname, `../public/images/tours/${req.body.imageCover}`));

  req.body.images = [];
  const promises = req.files.images.map((image, index) => {
    req.body.images.push(`tour-${req.params.id}-${index + 1}-${Date.now()}.jpeg`);
    return sharp(req.files.images[index].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(path.join(__dirname, `../public/images/tours/${req.body.images[index]}`));
  });
  await Promise.all(promises);
  next();
};

exports.top5Cheap = function (req, res, next) {
  req.queryDefaults = {
    sort: '-ratingsAverage,price',
    limit: '5',
    page: '1',
  };
  next();
};

exports.getTourStats = async function (req, res, next) {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5,
        },
      },
    },
    {
      $group: {
        _id: null,
        numTours: {
          $sum: 1,
        },
        avgPrice: {
          $avg: '$price',
        },
        minPrice: {
          $min: '$price',
        },
        maxPrice: {
          $max: '$price',
        },
        avgRating: {
          $avg: '$ratingsAverage',
        },
        totalRatings: {
          $sum: '$ratingsQuantity',
        },
      },
    },
    {
      $addFields: {
        avgPrice: { $round: ['$avgPrice', 2] },
        avgRating: { $round: ['$avgRating', 2] },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
};

exports.getMonthlyTourPlan = async function (req, res, next) {
  const year = Number(req.params.year);
  if (!Number.isInteger(year)) {
    return next(new AppError('Please provide a valid year', 400));
  }
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(Date.UTC(year, 0, 1)),
          $lt: new Date(Date.UTC(year + 1, 0, 1)),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: {
          $push: '$name',
        },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
        month: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
};

exports.getToursWithin = async function (req, res, next) {
  const { distance, latlong, unit } = req.params;

  if (!distance || !latlong) {
    return next(new AppError('Distance and latitude/longitude are required', 400));
  }

  const [latitude, longitude] = latlong.split(',');
  const radius = unit === 'mi' ? +distance / 3959 : +distance / 6379;
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[+longitude, +latitude], radius],
      },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.getTourDistances = async function (req, res, next) {
  const { latlong, unit } = req.params;
  if (!latlong) {
    return next(new AppError('Distance and latitude/longitude are required', 400));
  }

  const [latitude, longitude] = latlong.split(',');
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+longitude, +latitude],
        },
        distanceField: 'distance',
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
};

exports.getAllTours = getAll(Tour);
exports.createTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);
exports.getTour = getOne(Tour, [{ path: 'reviews' }]);
