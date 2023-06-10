// Model Import
const Schedule = require('../../../models/Schedule');
// const Factory = require('./handlerFactory');
// Lib Import
// const apiFitur = require('../utils/apiFeature');
// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();
// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports = {
  createSchedule: catchAsync(async (req, res, next) => {
    const { day, startTime, endTime } = req.body;
    const schema = {
      day: 'string|empty:false',
      startTime: 'string|empty:false',
      endTime: 'string|empty:false',
    };
    const valid = v.validate(req.body, schema);

    if (valid.length) {
      return res.status(400).json({
        status: 'error',
        message: valid,
      });
    }

    const checkData = await Schedule.find({
      userID: req.user[0].organization[0],
    });

    if (checkData.length >= 7) {
      return res.status(401).json({
        status: 'Error',
        message: 'Schedule is more than 7 days',
      });
    }

    const checkName = await Schedule.find({
      $and: [{ userID: req.user[0].organization[0] }, { day: day }],
    });

    if (checkName.length > 0) {
      return res.status(403).json({
        status: 'Error',
        message: 'Name Schedule is already exist',
      });
    }

    const newSchedule = await Schedule.create({
      userID: req.user[0].organization[0],
      day,
      startTime,
      endTime,
    });

    res.status(201).json({
      status: 'success',
      data: {
        day,
        startTime,
        endTime,
      },
    });
  }),
  updateSchedule: catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(req.body, 'day', 'startTime', 'endTime');
    const updateSchedule = await Schedule.findByIdAndUpdate(
      req.query.id,
      filteredBody,
      { new: true, runValidators: true }
    );
    if (!updateSchedule) {
      return next(new AppErr('No Schedule found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { updateSchedule },
    });
  }),
  deleteSchedule: catchAsync(async (req, res, next) => {
    const doc = await Schedule.findByIdAndDelete(req.query.id);
    if (!doc) {
      return next(new AppErr('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'document has been deleted',
    });
  }),
  getSchedule: catchAsync(async (req, res, next) => {
    let query = await Schedule.findById(req.params.slug).select(
      '-userID -__v -_id -createdAt -updatedAt'
    );

    if (!query) {
      return next(new AppErr('No Schedule found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: query,
    });
  }),
  getAllSchedule: catchAsync(async (req, res, next) => {
    const query = await Schedule.find({
      userID: req.user[0].organization[0],
    }).select('-__v -createdAt -updatedAt');

    if (!query || query == null) {
      return next(new AppErr('No Schedule found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: query,
    });
  }),
};
