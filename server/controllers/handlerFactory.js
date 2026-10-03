const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.getAll = (Model) => {
  return async function (req, res) {
    const apiFeatures = new ApiFeatures(Model.find(req.filterObj ? req.filterObj : {}), {
      ...req.query,
      ...req.queryDefaults,
    })
      .filter()
      .sort()
      .paginate()
      .selectFields();
    const docs = await apiFeatures.dbQuery;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  };
};

exports.getOne = (Model, populateOptions = null) => {
  return async function (req, res, next) {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError(`Doc with id: ${req.params.id} not found!`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  };
};

exports.createOne = (Model) => {
  return async function (req, res) {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  };
};

exports.updateOne = (Model) => {
  return async function (req, res, next) {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return next(new AppError(`Doc with id: ${req.params.id} not found!`, 404));
    }

    doc.set(req.body || {});
    const updatedDoc = await doc.save();
    res.status(200).json({
      status: 'success',
      data: {
        data: updatedDoc,
      },
    });
  };
};

exports.deleteOne = (Model) => {
  return async function (req, res, next) {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError(`Doc with id: ${req.params.id} not found!`, 404));
    }
    res.status(204).send();
  };
};
