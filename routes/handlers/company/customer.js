// Error Handler
const catchAsync = require("../../../helpers/catchAsync");
const AppErr = require("../../../helpers/AppError");

const apiFeature = require("../../../helpers/apiFeature");

// Validation Handler
const Validator = require("fastest-validator");
const v = new Validator();

const mongoose = require("mongoose");
const UserClient = require("../../../models/UserClient");
const Account = require("../../../models/AccountM");
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
module.exports = {
  list: catchAsync(async (req, res, next) => {
    const features = new apiFeature(
      UserClient.aggregate([
        {
          $match: {
            companyID: mongoose.Types.ObjectId(req.organization._id),
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "accountID",
            foreignField: "_id",
            as: "Account",
          },
        },
        { $unwind: "$Account" },
        {
          $project: {
            _id: "$_id",
            fullName: "$fullName",
            sex: "$sex",
            address: "$address",
            balance: "$balance",
            photo: "$photo",
            phoneNumber: "$Account.phoneNumber",
          },
        },
      ]),
      req.query
    );

    const customerData = await features.query;

    if (customerData.length == 0) {
      new AppErr("No document found with that Customer ID", 404);
    }

    res.status(200).json({
      message: "success",
      length: customerData.length,
      data: customerData,
    });
  }),
  Update: catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(req.body, "balance", "fullName", "address");
    const account = await Account.findOne({ phoneNumber: req.query.id });
    if (!account) {
      return next(new AppErr("Akun Tidak Ditemukan", 404));
    }
    const user = await UserClient.findOne({ accountID: account._id });

    if (!user) {
      return next(new AppErr("Akun Tidak Ditemukan", 404));
    }

    if (user.companyID) {
      return res.status(404).json({
        status:"Error",
        message: "User sudah memiliki Bank Sampah Lain",
      });
    }
    user.companyID = mongoose.Types.ObjectId(req.organization._id);
    await user.save();

    res.status(200).json({
      status : "success",
      message: "Bank Sampah Berhasil Diperbaharui",
    });
  }),
  Edit: catchAsync(async (req, res, next) => {
    const filteredUserBody = filterObj(req.body, "fullName", "address");
    console.log(filteredUserBody)
    const updatedUser = await UserClient.findByIdAndUpdate(
      req.query.id,
      filteredUserBody,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return next(new AppErr("No user found with that ID", 404));
    }
    if (req.body.phoneNumber) {
      const updatedAccount = await Account.findByIdAndUpdate(
        updatedUser.accountID,
        { phoneNumber: req.body.phoneNumber },
        { new: true, runValidators: true }
      );

      if (!updatedAccount) {
        return next(
          new AppErr("Related account not found or update failed", 404)
        );
      }
    }
    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  }),
  getCustomer: catchAsync(async (req, res, next) => {
    let query = await UserClient.findById(req.params.slug).select(
      "-__v -createdAt -updatedAt"
    );
    const account = await Account.findOne({ _id: query.accountID }).select(
      "phoneNumber"
    );
    query = query.toJSON();
    query.phoneNumber = account.phoneNumber;
    console.log(query);
    if (!query) {
      return next(new AppErr("No Customer found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: query,
    });
  }),
};
