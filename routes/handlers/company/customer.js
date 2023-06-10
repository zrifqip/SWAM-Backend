
// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');

const apiFeature = require('../../../helpers/apiFeature');

// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();

const mongoose = require('mongoose');
const UserClient = require('../../../models/UserClient');


module.exports = {
    list: catchAsync(async (req, res, next) => {
        const features = new apiFeature(
            UserClient.find({
                companyID: req.organization._id
            }),
            req.query
        ).paginate()
       
        const customerData = await features.query;

        if (customerData.length == 0) {
          new AppErr('No document found with that Customer ID', 404);
        }

        res.status(200).json({
            message: 'success',
            length: customerData.length,
            data: customerData,
          });
    })
}