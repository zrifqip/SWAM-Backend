// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');
// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();
// Api Feature
const apiFeature = require('../../../helpers/apiFeature');
// Model
const Transaction = require('../../../models/InterestTransaction');


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
        const { interest, balance } = req.query;

        await InterestTransaction.create({
            customerID,
            interest: interest,
            balance: balance,
        });
    }
    )
}