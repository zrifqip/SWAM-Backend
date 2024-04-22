// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');
// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();
// Api Feature
const apiFeature = require('../../../helpers/apiFeature');
// Model
const InterestTransaction = require('../../../models/InterestTransaction');


const mongoose = require('mongoose');
const AccountM = require('../../../models/AccountM');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports = {
    createInterestTransaction: catchAsync(async (req, res, next) => {
        await InterestTransaction.create({
            customerID: req.body.customerID,
            interest: req.body.interestRate,
            balance: req.body.totalBalance,
        });

        res.status(201).json({
            status: 'success',
        });
    }
    )
}