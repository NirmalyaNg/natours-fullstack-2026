const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');

exports.getAllTours = async function (req, res, next) {
  const apiFeatures = new ApiFeatures(Tour.find(), req.query).filter().sort().paginate().selectFields();
  const tours = await apiFeatures.dbQuery;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
};
