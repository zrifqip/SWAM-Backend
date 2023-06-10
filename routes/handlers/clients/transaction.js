const mongoose = require('mongoose');
// Model Handler
const Transaction = require('../../../models/Transaction');
const accountCollector = require('../../../models/AccountM');
const userCompany = require('../../../models/userCompany');
const scheduleCollector = require('../../../models/Schedule');
const userClient = require('../../../models/UserClient');
const Item = require('../../../models/Item');
const DetailTransaction = require('../../../models/DetailTransaction');
const StatusTransaction = require('../../../models/statusTransaction');
// Api Feature
const apiFeature = require('../../../helpers/apiFeature');

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
  createTrans: catchAsync(async (req, res, next) => {
    const {
      deliveryType,
      scheduleID,
      item,
      itemID,
      weight,
      status,
    } = req.body;

    const schema = {
      deliveryType: 'string|empty:false',
      scheduleID: 'string|empty:false',
      item: {
        type: 'array',
        itemID: 'string|empty:false',
        weight: 'string|empty:false'
      },
    };
    const valid = v.validate(req.body, schema);

    if (valid.length) {
      return res.status(400).json({
        status: 'error',
        message: valid,
      });
    }

    const checkSchedule = await scheduleCollector.findById(scheduleID);
    if (!checkSchedule) {
      return next(new AppErr('No document found with that schedule', 404));
    }

    const trans = await Transaction.create({
      customerID: req.biodata._id,
      deliveryType,
      scheduleID,
      status: 'new',
    });

    for (let i = 0; i < item.length; i++) {
      const checkItem = await Item.findById(item[i].itemID);
      if (!checkItem) {
        return next(new AppErr('No document found with that item', 404));
      }
      await DetailTransaction.create({
        transactionID: trans._id,
        itemID: item[i].itemID,
        weight: item[i].weight,
      });
    }

    await StatusTransaction.create({
      transactionID: trans._id,
      step: [
        {
          name: 'New',
          dateStep: new Date(),
        },
      ],
    });

    res.status(201).json({
      status: 'success',
      data: { id: trans._id },
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
                      _id: 0,
                      id: '$_id',
                      companyName: '$companyName',
                      companyType: '$companyType',
                      nameCEO: '$nameCEO',
                      companyService: '$companyService',
                      address: '$address'
                    }
                  }
                ],
                as: 'Company'
              },
            },
            { $unwind: '$Company' },
            {
              $project: {
                _id: '$_id',
                day: '$day',
                company: '$Company',
                startTime: '$startTime',
                endTime: '$endTime',
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
              $project: {
                _id: '$_id',
                fullName: '$fullName',
                sex: '$sex',
                phone: '$phoneNumber',
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
      },
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
  listTrans: catchAsync(async (req, res, next) => {
    const features = new apiFeature(
      Transaction.find({ customerID: req.biodata._id }).sort({ createdAt: 'desc'}),
      req.query
    )
      .paginate()
      .filter();

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
  uploadImage: catchAsync(async (req, res, next) => {
    if(req.images){
      await Transaction.updateOne(
        { _id: req.query.id },
        {
          $set: {
            images: req.images,
          },
        }
      );

      const transaction = await Transaction.findById(req.query.id)
      
      res.status(200).json({
        message: 'success',
        data: transaction
      })
    }else{
      return res.status(400).json({
        status: 'error',
        message: 'Image not found',
      }); 
    }
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
  confirmPayment: catchAsync(async (req, res, next) => {
    const id_trans = req.query.id;
    const confimPay = req.query.pay;

    const checkId = await Transaction.updateOne(
      { _id: id_trans },
      {
        $set: {
          stat_payment: confimPay,
          status: 'success',
        },
      }
    );

    if (checkId.matchedCount == 0) {
      return new AppErr('No document found with that Transaction ID', 404);
    }

    const findStatus = await StatusTransaction.findOne({
      transactionID: id_trans,
    });

    findStatus.step.push({ name: confimPay, dateStep: new Date() });
    await findStatus.save();

    res.status(200).json({
      message: 'success',
      message: 'Transaction status changed successfully',
    });
  }),
};
