// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');
// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();
// Api Feature
const apiFeature = require('../../../helpers/apiFeature');
// Model
const Transaction = require('../../../models/Transaction');
const DetailTransaction = require('../../../models/DetailTransaction');
const Item = require('../../../models/Item');
const userCompany = require('../../../models/userCompany');
const scheduleCollector = require('../../../models/Schedule');
const userClient = require('../../../models/UserClient');
const StatusTransaction = require('../../../models/statusTransaction');

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
  listTrans: catchAsync(async (req, res, next) => {
    const features = new apiFeature(
      Transaction.aggregate([
        {
          $lookup: {
            from: scheduleCollector.collection.name,
            localField: 'scheduleID',
            foreignField: '_id',
            pipeline: [
              {
                $match: {
                    "userID": req.organization._id
                }
              },
              {
                $project: {
                  _id: '$_id',
                  day: '$day',
                  startTime: '$startTime',
                  endTime: '$endTime'
                }
              }
            ],
            as: 'Schedule'
          }
        },
        { $unwind: '$Schedule'},
        {
          $lookup : {
            from: userClient.collection.name,
            localField: 'customerID',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  fullName: '$fullName',
                  sex: '$sex',
                  photo: '$photo',
                  balance: '$balance'
                }
              }
            ],
            as: 'Customer'
          }
        },
        { $unwind: '$Customer'},
        {
          $project: {
            _id: '$_id',
            deliveryType: '$deliveryType',
            status: '$status',
            customer: '$Customer',
            schedule: '$Schedule',
            images: '$images'
          }
        }
      ]),
      req.query
    ).sort().paginate()

    const transactionData = await features.query;

    if (transactionData.length == 0) {
      new AppErr('No document found with that Transaction ID', 404);
    }

    res.status(200).json({
      message: 'success',
      length: transactionData.length,
      data: transactionData,
    });
  }),
  detailTrans: catchAsync(async (req, res, next) => {
    const checkTrans = await Transaction.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.query.id) } },
      {
        $lookup: {
          from: DetailTransaction.collection.name,
          localField: '_id',
          foreignField: 'transactionID',
          pipeline: [
            {
              $lookup: {
                from: Item.collection.name,
                localField: 'itemID',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: 0,
                      id: '$_id',
                      name: '$name',
                      category: '$category',
                      price: '$purchasePrice',
                    },
                  },
                ],
                as: 'Item',
              },
            },
            { $unwind: '$Item' },
            {
              $project: {
                _id: '$Item.id',
                name: '$Item.name',
                item: '$Item.category',
                weight: '$weight',
                price: '$Item.price',
                totalPrice: { $sum: { $multiply: ['$weight', '$Item.price'] } },
                status: '$status',
              },
            },
          ],
          as: 'Details',
        },
      },
      {
        $lookup: {
          from: scheduleCollector.collection.name,
          localField: 'scheduleID',
          foreignField: '_id',
          pipeline: [
            {
              $lookup: {
                from: userCompany.collection.name,
                localField: 'userID',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: '$_id',
                      company: '$companyName',
                      address: '$address',
                    },
                  },
                ],
                as: 'Company',
              },
            },
            { $unwind: '$Company' },
            {
              $project: {
                _id: '$_id',
                day: '$day',
                startTime: '$startTime',
                endTime: '$endTime',
                company: '$Company'
              },
            },
          ],
          as: 'Schedule',
        },
      },
      { $unwind: '$Schedule' },
      {
        $lookup: {
          from: userClient.collection.name,
          localField: 'customerID',
          foreignField: '_id',
          pipeline: [
            {
              $lookup: {
                  from: AccountM.collection.name,
                  localField: 'accountID',
                  foreignField: '_id',
                  as: 'Account'
              }
            },
            {
                $unwind: '$Account'
            },
            {
              $project: {
                _id: '$_id',
                fullName: '$fullName',
                sex: '$sex',
                phoneNumber: '$Account.phoneNumber',
                address: '$address',
              },
            },
          ],
          as: 'Customer',
        },
      },
      { $unwind: '$Customer' },
      {
        $project: {
          _id: '$_id',
          deliveryType: '$deliveryType',
          destination: '$destination',
          detail: '$Details',
          company: '$Company',
          schedule: '$Schedule',
          customer: '$Customer',
          totalPrice: { $sum: '$Details.totalPrice' },
          note: '$note',
          status: '$status',
          images: '$images',
          date: '$createdAt',
        },
      }
    ]);

    if (!checkTrans[0]) {
      return next(
        new AppErr('No document found with that Transaction ID', 404)
      );
    }

    res.status(200).json({
      message: 'success',
      data: checkTrans[0],
    });
  }),
  updateTrans: catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(req.body, 'status');
    const updateTrans = await Transaction.findByIdAndUpdate(
      req.query.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    if (!updateTrans) {
      return next(new AppErr('No transaction found with that ID', 404));
    }

    const findStatus = await StatusTransaction.findOne({
      transactionID: updateTrans._id,
    });

    findStatus.step.push({ name: updateTrans.status, dateStep: new Date() });
    await findStatus.save();

    res.status(200).json({
      status: 'success',
      message: 'Transaction status changed successfully',
    });
  }),
  finishTrans: catchAsync(async (req, res, next) => {
    const {
      status,
      item
    } = req.body;

    const schema = {
      status: {
        type: 'string',
        enum: ['success'],
        empty: 'false'
      },
      item: {
        type: 'array',
        itemID: 'string|empty:false',
        weight: 'string|empty:false'
      }
    }

    const valid = v.validate(req.body, schema);

    if (valid.length) {
      return res.status(400).json({
        status: 'error',
        message: valid,
      });
    }

    const updateTrans = await Transaction.findByIdAndUpdate(
      req.query.id,
      { status }
    );


    if (!updateTrans) {
      return next(new AppErr('No transaction found with that ID', 404));
    }

    if (updateTrans.status !== 'pending'){
      return next(new AppErr('Transaction status must be pending', 400));
    }

    item.forEach(async (i) => {
      await DetailTransaction.updateOne({
        transactionID: req.query.id,
        itemID: i.itemID
      }, {
        weight: i.weight
      })
    })

    const findStatus = await StatusTransaction.findOne({
      transactionID: updateTrans._id,
    });

    findStatus.step.push({ name: updateTrans.status, dateStep: new Date() });
    await findStatus.save();

    const checkTrans = await Transaction.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.query.id) } },
      {
        $lookup: {
          from: DetailTransaction.collection.name,
          localField: '_id',
          foreignField: 'transactionID',
          pipeline: [
            {
              $lookup: {
                from: Item.collection.name,
                localField: 'itemID',
                foreignField: '_id',
                pipeline: [
                  {
                    $project: {
                      _id: 0,
                      id: '$_id',
                      name: '$name',
                      price: '$purchasePrice',
                    },
                  },
                ],
                as: 'Item',
              },
            },
            { $unwind: '$Item' },
            {
              $project: {
                totalPrice: { $sum: { $multiply: ['$weight', '$Item.price'] } },
              },
            },
          ],
          as: 'Details',
        },
      },
      {
        $project: {
          _id: '$_id',
          customerID: '$customerID',
          detail: '$Details'
        },
      },
    ]);

    //console.log(checkTrans)

    await userClient.findByIdAndUpdate(checkTrans[0].customerID, {
      $inc: {
        balance: checkTrans[0].detail.reduce(function(acc, obj){
          return acc + obj.totalPrice
        }, 0)
      }
    })

    res.status(200).json({
      status: 'success',
      message: 'Transaction status changed successfully',
    });
  }),
};
