const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');

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
    return res.status(404).json({
      status: 'fail',
      error: 'Tour not found!',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

exports.createTour = async function (req, res, next) {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error,
    });
  }
};

exports.updateTour = async function (req, res, next) {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      error: 'Tour not found!',
    });
  }

  try {
    tour.set(req.body);
    const updatedTour = await tour.save();
    res.status(200).json({
      status: 'success',
      data: {
        tour: updatedTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error,
    });
  }
};

exports.deleteTour = async function (req, res, next) {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      error: 'Tour not found!',
    });
  }
  res.status(204).send();
};

exports.getTourStats = async function (req, res, next) {
  try {
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
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error,
    });
  }
};
