// Model
const Account = require('../../../models/AccountM');
const UserClient = require('../../../models/userCompany');
const userCompany = require('../../../models/userCompany');
const RefreshToken = require('../../../models/RefreshToken');

const apiFeature = require('../../../helpers/apiFeature');
// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();
// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');
// Handler JWT
const jwt = require('jsonwebtoken');
// Handler update image
const fs = require('fs');
const path = require('path');
// Forgot password
const sendMail = require('../../../helpers/email');
const crypto = require('crypto');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const {
  JWT_SECRET,
  JWT_ACCESS_EXPIRED,
  JWT_SECRET_REFRESH_TOKEN,
  JWT_REFRESH_EXPIRED,
  NODE_ENV,
} = process.env;

module.exports = {
  register: catchAsync(async (req, res, next) => {
    const {
      companyName,
      nameCEO,
      companyType,
      companyService,
      phoneNumber,
      address,
      role,
      coordinates
    } = req.body;

    const schema = {
      companyType: {
        type: 'string',
        enum: ['pt', 'maatschap', 'cv', 'firma', 'yayasan', 'koperasi', 'bumn'],
        empty: false,
      },
      companyService:  { type: 'array', items: "string", enum: ['pickup', 'self-delivery'], empty: false },
      companyName: 'string|empty:false',
      role: {
        type: 'string',
        enum: ['bank-sampah', 'pengepul'],
        empty: false,
      },
      nameCEO: 'string|empty:false',
      phoneNumber: {
        type: 'string',
        maxlength: 15,
        empty: false
      },
      address: {
        type: 'object',
        $$strict: true,
        country: 'string|optional:true',
        props: {
          region: {
            type: 'object',
            optional: true,
            province: { type: 'string', optional: true },
            city: { type: 'string', optional: true },
          },
          district: 'string|optional:true',
          street: 'string|optional:true',
          postalCode: 'number|optional:true',
        }
      },
    };

    const valid = v.validate(req.body, schema);
    if (valid.length) {
      return res.status(400).json({
        status: 'error',
        message: valid,
      });
    }
    // Check Duplicate
    const CheckDup = await Account.findOne({ phoneNumber });
    if (CheckDup) {
      return next(new AppErr('Phone number is already exist', 409));
    }

    // Create Account
    const data = await Account.create({
      phoneNumber,
      isVerified: true,
      role,
    });

    // Insert organization
    await UserClient.create({
      accountID: data._id,
      companyName,
      companyType,
      companyService,
      nameCEO,
      address,
      coordinates
    });

    res.status(200).json({
      status: 'success',
      message: `Success Register`,
      data: {
        id: data.id,
        role
      },
    });
  }),
  login: catchAsync(async (req, res, next) => {
    const { phoneNumber, password } = req.body;

    // Check If Email and Password Exist
    const valid = {
      phoneNumber: 'string|empty:false|min:10|max:13',
      password: 'string|empty:false|min:8',
    };

    const validate = v.validate(req.body, valid);

    if (validate.length) {
      return res.status(400).json({
        status: 'error',
        message: validate,
      });
    }

    // Check If User Exist && Password is Correct
    const user = await Account.findOne({ phoneNumber }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(
        new AppErr(
          'Incorrect phoneNumber or password || Please contact Administrator',
          401
        )
      );
    }

    if (user.role != 'pengepul' && user.role != 'bank-sampah') {
      return next(
        new AppErr('You do not have permission to perform this action', 401)
      );
    }

    // If Everything Ok, Send token To Client
    const token = await jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRED,
    });

    await RefreshToken.deleteMany({
      userID: user._id,
    });

    const refreshToken = await jwt.sign(
      { id: user._id },
      JWT_SECRET_REFRESH_TOKEN,
      {
        expiresIn: JWT_REFRESH_EXPIRED,
      }
    );

    const refresh_tokens = await RefreshToken.create({
      token: refreshToken,
      userID: user._id,
    });

    const cookieOptions = {
      expires: new Date(
        Date.now() + JWT_ACCESS_EXPIRED * 1 * 1 * 1 * 1 // Time Expired * Hours * Minute * Second * MilliSecond
      ),
      httpOnly: true,
    };

    if (NODE_ENV === 'production') cookieOptions.Secure = true;

    res.cookie('jwt', token, cookieOptions);

    res.status(200).json({
      status: 'success',
      message: `Success Login`,
      data: {
        token: token,
        refresh_token: refresh_tokens.token,
        role: user.role
      },
    });
  }),
  getMe: catchAsync(async (req, res, next) => {
    const query = await Account.aggregate([
      { $match: { _id: req.user[0].id } },
      {
        $lookup: {
          from: UserClient.collection.name,
          localField: '_id',
          foreignField: 'accountID',
          pipeline: [
            {
              $project: {
                _id: '$_id',
                companyName: '$companyName',
                companyType: '$companyType',
                nameCEO: '$nameCEO',
                service: '$companyService',
                address: '$address',
                image: '$image',
                minimumWithdrawal: '$minimumWithdrawal'
              },
            },
          ],
          as: 'Organization',
        },
      },
      {
        $unwind: {
            path: "$Organization",
            preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: '$_id',
          phoneNumber: '$phoneNumber',
          organization: '$Organization',
          role: '$role',
          isVerified: '$isVerified',
        },
      },
    ]);
    if (!query) {
      return next(new AppErr('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: query,
    });
  }),
  update: catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use menu forgot password.',
          400
        )
      );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(
      req.body,
      'companyName',
      'companyType',
      'nameCEO',
      'companyService',
      'address',
      'minimumWithdrawal'
    );

    // Check File
    const CheckFile = await UserClient.findOne({ id: req.organization._id });

    const usersPhoto = await UserClient.findById(req.organization._id)
      .select({
        _id: 0,
        oriUrl: { $arrayElemAt: ['$image.original.path', 0] },
        medUrl: { $arrayElemAt: ['$image.medium.path', 0] },
        thumUrl: { $arrayElemAt: ['$image.thumb.path', 0] },
      })
      .lean();

    if (req.file) {
      if (CheckFile.image.length == 1) {
        await fs.unlink(path.join(`public/${usersPhoto.oriUrl}`), (err) => {
          if (err) throw err;
        });
        await fs.unlink(path.join(`public/${usersPhoto.medUrl}`), (err) => {
          if (err) throw err;
        });
        await fs.unlink(path.join(`public/${usersPhoto.thumUrl}`), (err) => {
          if (err) throw err;
        });
      }
      filteredBody.image = req.images;
    }

    // // 3) Update user document
    const updatedUser = await UserClient.findByIdAndUpdate(
      req.organization._id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: { id: updatedUser._id },
    });
  }),
  deleteMe: catchAsync(async (req, res, next) => {
    await Account.findByIdAndUpdate(req.user[0].id, { isVerified: false });
    res.status(204).json({
      status: 'success',
    });
  }),
  forgotPasssword: catchAsync(async (req, res, next) => {
    const schema = {
      email: 'email|empty:false|min:5',
    };

    const validate = v.validate(req.body, schema);

    if (validate.length) {
      return res.status(400).json({
        status: 'error',
        message: validate,
      });
    }

    // 1) Get user based on POSTed email
    const user = await Account.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppErr('There is no user with email address.', 404));
    }
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    //  3) send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/users/collector/resetpassword/${resetToken}`;
    const message = `Forgot your password? Submit a Patch request with your new password and passwordCOnfirm to: ${resetURL}.\n if you didn't forgget your password, please ignore this email!`;

    try {
      await sendMail({
        email: user.email,
        subject: `Your password reset token invalid 10 min!`,
        message,
      });

      res.status(200).json({
        status: 'Success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppErr('There was an error sending the email. Try again later!'),
        500
      );
    }
  }),
  resetPasssword: catchAsync(async (req, res, next) => {
    //   // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await Account.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //   // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppErr('Token is invalid or has expired', 400));
    }

    const { password, passwordConfirm } = req.body;

    const schema = {
      password: 'string|empty:false|min:8',
      passwordConfirm: { type: 'equal', field: 'password' },
    };

    const validate = v.validate(req.body, schema);

    if (validate.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords are not the same',
      });
    }
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = await jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRED,
    });

    res.status(200).json({
      status: 'success',
      token,
    });
  }),
  updatePassword: catchAsync(async (req, res, next) => {
    const { password, passwordConfirm, passwordCurrent } = req.body;

    // 1) Get user from collection
    const user = await Account.findById(req.user[0].id).select('+password');
    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
      return next(new AppErr('Your current password is wrong.', 401));
    }

    const schema = {
      password: 'string|empty:false|min:8',
      passwordConfirm: { type: 'equal', field: 'password' },
    };

    const validate = v.validate(req.body, schema);

    if (validate.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords are not the same',
      });
    }
    // 3) If so, update password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    res.status(200).json({
      status: 'success',
      message: 'Success Update Password',
    });
  }),
  logout: catchAsync(async (req, res, next) => {
    const searchToken = await RefreshToken.deleteMany({
      userID: req.user[0].id,
    });

    if (!searchToken) {
      return next(new AppErr(`No user found with that ID ${userId}`, 404));
    }

    res.status(200).json({
      status: 'success',
      message: `Success Logout`,
    });
  }),
  allBankSampah: catchAsync( async (req, res, next) => {
    const features = new apiFeature(userCompany.aggregate([
      {
        $lookup: {
            from: Account.collection.name,
            localField: 'accountID',
            foreignField: '_id',
            pipeline: [
              {
                $match: {
                  role: 'bank-sampah'
                }
              }
          ],
          as: 'Account'
      }
    }, {
      $unwind: {
        path: '$Account'
      }
    }
    ]), req.query).paginate();

    const companyData = await features.query;

    if (companyData.length == 0) {
      return next(new AppErr('No Document in Collections', 404));
    }

    res.status(200).json({
      status: 'success',
      length: companyData.length,
      data: companyData,
    });
  })
};
