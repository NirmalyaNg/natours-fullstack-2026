const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const { getAll, createOne, updateOne, deleteOne, getOne } = require('./handlerFactory');

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
