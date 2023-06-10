
// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');

// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();

const mongoose = require('mongoose');
const UserClient = require('../../../models/UserClient');
const userCompany = require('../../../models/userCompany');
const Withdrawal = require('../../../models/Withdrawal');


module.exports = {
    list: catchAsync(async (req, res, next) => {
        const withdraw = await Withdrawal.aggregate([
          {
            $match: { companyID: mongoose.Types.ObjectId(req.organization._id) }
          },
          {
            $lookup: {
              from: 'userclients',
              localField: 'customerID',
              foreignField: '_id',
              pipeline: [
                {
                  $lookup: {
                    from: 'accounts',
                    localField: 'accountID',
                    foreignField: '_id',
                    as: 'account',
                    pipeline: [
                      {
                        $project: {
                          phoneNumber: '$phoneNumber'
                        }
                      }
                    ]
                  }
                },
                {
                  $unwind: '$account'
                }
              ],
              as: 'customer'
            }
          }, 
          {
            $unwind: {
              path: '$customer'
            }
          }, 
          {
            $sort: {
                updatedAt: -1
            }
          }
        ])

        return res.status(200).json({
          status: 'success',
          data: withdraw
        });
    }),
    update: catchAsync(async (req, res, next) => {
        const {
            status,
        } = req.body;

        const schema = {
            status: {
                type: 'string',
                enum: ['accept', 'reject'],
                empty: 'false'
            },
        }
        
        const valid = v.validate(req.body, schema);
        if (valid.length) {
          return res.status(400).json({
            status: 'error',
            message: valid,
          });
        }

        const checkId = await Withdrawal.findOneAndUpdate(
            { _id: req.query.id },
            {
              $set: {
                status,
              },
            }
          );
      
        if (!checkId) {
            return new AppErr('No document found with that Transaction ID', 404);
        }
        
        if(status == 'reject') {
            await UserClient.findByIdAndUpdate(checkId.customerID, {
                $inc: {
                    balance: checkId.nominal
                }
            })
        }

        return res.status(201).json({
          status: 'success'
        });
    })
}