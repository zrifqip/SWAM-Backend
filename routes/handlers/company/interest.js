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
const UserClient = require('../../../models/UserClient');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports = {
    createInterestTransaction: catchAsync(async (req, res, next) => {
      customerID = req.body.customerID;       
      interest = parseFloat(req.body.interestRate);
      balance = parseInt(req.body.Balance);
      const schema = {
        customerID : "string|empty:false",
        interestRate: "string|empty:false'",
        Balance: "number|empty:false"
      }
      const valid = v.validate(req.body,schema);
      console.log(valid);
      if (valid.length) {
        return res.status(400).json({
          status: 'error',
          message: valid,
        });
      }
      console.log(balance)
      const interestBalance = Math.floor(balance * (interest/100));
      const totalBalance = balance + interestBalance;
      console.log(interestBalance);
      console.log(totalBalance);
      await InterestTransaction.create({
        customerID: customerID,
        interest: interest,
        balance: totalBalance,
      });
      await UserClient.findByIdAndUpdate(customerID, {
        $inc: {
          balance: interestBalance,
        },
      });
      res.status(200).json({
          status: 'success',
      });
    }
    )
}