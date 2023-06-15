const mongoose = require("mongoose");
// Model Handler
const Transaction = require("../../../models/Transaction");
const accountCollector = require("../../../models/AccountM");
const userCompany = require("../../../models/userCompany");
const scheduleCollector = require("../../../models/Schedule");
const userClient = require("../../../models/UserClient");
const Item = require("../../../models/Item");
const DetailTransaction = require("../../../models/DetailTransaction");
const StatusTransaction = require("../../../models/statusTransaction");
// Api Feature
const apiFeature = require("../../../helpers/apiFeature");

// Validation Handler
const Validator = require("fastest-validator");
const v = new Validator();
// Error Handler
const catchAsync = require("../../../helpers/catchAsync");
const AppErr = require("../../../helpers/AppError");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports = {
  detailTrans: catchAsync(async (req, res, next) => {
    const checkTrans = await Transaction.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.query.id) } },
      {
        $lookup: {
          from: DetailTransaction.collection.name,
          localField: "_id",
          foreignField: "transactionID",
          pipeline: [
            {
              $lookup: {
                from: Item.collection.name,
                localField: "itemID",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 0,
                      id: "$_id",
                      name: "$name",
                      category: "$category",
                      price: "$purchasePrice",
                    },
                  },
                ],
                as: "Item",
              },
            },
            { $unwind: "$Item" },
            {
              $project: {
                _id: "$Item.id",
                name: "$Item.name",
                item: "$Item.category",
                weight: "$weight",
                price: "$Item.price",
                totalPrice: { $sum: { $multiply: ["$weight", "$Item.price"] } },
                status: "$status",
              },
            },
          ],
          as: "Details",
        },
      },
      {
        $lookup: {
          from: userClient.collection.name,
          localField: "customerID",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "usercompanies",
                localField: "companyID",
                foreignField: "_id",
                as: "Company",
              },
            },
            {
              $unwind: "$Company",
            },
            {
              $project: {
                _id: "$_id",
                name: "$Company.companyName",
                nameCEO: "$Company.nameCEO",
                photo: "$Company.image",
                address: "$Company.address",
              },
            },
          ],
          as: "Company",
        },
      },
      { $unwind: "$Company" },
      {
        $project: {
          _id: "$_id",
          deliveryType: "$deliveryType",
          destination: "$destination",
          detail: "$Details",
          company: "$Company",
          totalPrice: { $sum: "$Details.totalPrice" },
          note: "$note",
          status: "$status",
          images: "$images",
          date: "$createdAt",
        },
      },
    ]);

    if (!checkTrans[0]) {
      return next(
        new AppErr("No document found with that Transaction ID", 404)
      );
    }

    res.status(200).json({
      message: "success",
      data: checkTrans[0],
    });
  }),
  listTrans: catchAsync(async (req, res, next) => {
    const features = new apiFeature(
      Transaction.aggregate([
        {
          $match: {
            customerID: mongoose.Types.ObjectId(req.biodata._id),
          },
        },
        {
          $lookup: {
            from: "userclients",
            localField: "customerID",
            foreignField: "_id",
            pipeline: [
              {
                $lookup: {
                  from: "usercompanies",
                  localField: "companyID",
                  foreignField: "_id",
                  as: "Company",
                },
              },
              {
                $unwind: "$Company",
              },
              {
                $project: {
                  _id: "$_id",
                  name: "$Company.companyName",
                  nameCEO: "$Company.nameCEO",
                  photo: "$Company.image",
                },
              },
            ],
            as: "Company",
          },
        },
        {
          $unwind: "$Company",
        },
        {
          $lookup: {
            from: DetailTransaction.collection.name,
            localField: "_id",
            foreignField: "transactionID",
            pipeline: [
              {
                $lookup: {
                  from: Item.collection.name,
                  localField: "itemID",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        _id: 0,
                        id: "$_id",
                        name: "$name",
                        category: "$category",
                        price: "$purchasePrice",
                      },
                    },
                  ],
                  as: "Item",
                },
              },
              { $unwind: "$Item" },
              {
                $project: {
                  _id: "$Item.id",
                  weight: "$weight",
                  price: "$Item.price",
                  totalPrice: {
                    $sum: { $multiply: ["$weight", "$Item.price"] },
                  },
                },
              },
            ],
            as: "Details",
          },
        },
        {
          $project: {
            _id: "$_id",
            deliveryType: "$deliveryType",
            status: "$status",
            company: "$Company",
            totalPrice: { $sum: "$Details.totalPrice" },
            totalWeight: { $sum: "$Details.weight" },
            images: "$images",
            date: "$createdAt",
          },
        },
      ]),
      req.query
    )
      .sort()
      .paginate();

    const transactionData = await features.query;

    if (transactionData.length == 0) {
      new AppErr("No document found with that Transaction ID", 404);
    }

    res.status(200).json({
      message: "success",
      length: transactionData.length,
      data: transactionData,
    });
  }),
};
