const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.top5Cheap = function (req, res, next) {
  req.queryDefaults = {
    sort: '-ratingsAverage,price',
    limit: '5',
    page: '1',
  };
  next();
};

exports.getAllTours = async function (req, res, next) {
  const apiFeatures = new ApiFeatures(Tour.find(), { ...req.query, ...req.queryDefaults })
    .filter()
    .sort()
    .paginate()
    .selectFields();
  const tours = await apiFeatures.dbQuery;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.getTour = async function (req, res, next) {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    return next(new AppError(`Tour with id: ${req.params.id} not found!`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

exports.createTour = async function (req, res, next) {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
};

exports.updateTour = async function (req, res, next) {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    return next(new AppError(`Tour with id: ${req.params.id} not found!`, 404));
  }

  tour.set(req.body);
  const updatedTour = await tour.save();
  res.status(200).json({
    status: 'success',
    data: {
      tour: updatedTour,
    },
  });
};

exports.deleteTour = async function (req, res, next) {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError(`Tour with id: ${req.params.id} not found!`, 404));
  }
  res.status(204).send();
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
