// Import Models
const User = require('../models/AccountM');
const userCompany = require('../models/userCompany');
// Lib Util
const { promisify } = require('util');
// Lib Token
const jwt = require('jsonwebtoken');
// Lib Error
const catchAsync = require('../helpers/catchAsync');
const AppErr = require('../helpers/AppError');
const mongoose = require('mongoose');
 
module.exports = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Gosnix')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppErr('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(decoded.id) } },
    {
      $lookup: {
        from: userCompany.collection.name,
        localField: '_id',
        foreignField: 'accountID',
        pipeline: [
          {
            $project: {
              companyName: '$companyName',
              companyType: '$companyType',
              nameCEO: '$nameCEO',
              phoneNumber: '$phoneNumber',
              address: '$address',
              logo: '$logo',
              photo: '$photo',
            },
          },
        ],
        as: 'Organization',
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        email: '$email',
        organization: '$Organization',
        role: '$role',
        isVerified: '$isVerified',
      },
    },
  ]);
  const currentUsers = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppErr('The user belonging to this token does no longer exist.', 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUsers.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppErr('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  req.organization = req.user[0].organization[0];
  next();
});
