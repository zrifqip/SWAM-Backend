const jwt = require('jsonwebtoken');
// Lib Error
const catchAsync = require('../../helpers/catchAsync');
const AppErr = require('../../helpers/AppError');
// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();
// Model
const RefreshToken = require('../../models/RefreshToken');
const Account = require('../../models/AccountM');

const { JWT_SECRET, JWT_SECRET_REFRESH_TOKEN, JWT_ACCESS_EXPIRED, NODE_ENV } =
  process.env;

module.exports = catchAsync(async (req, res, next) => {
  const refreshToken = req.body.refresh_token;
  const email = req.body.email;

  const validSchema = {
    email: 'email|empty:false',
    refresh_token: 'string|empty:false',
  };

  const valid = v.validate(req.body, validSchema);
  if (valid.length) {
    return res.status(400).json({
      status: 'error',
      message: valid,
    });
  }

  const token = await RefreshToken.findOne({ token: refreshToken });

  if (!token) {
    return next(new AppErr('Invalid Token', 400));
  }

  jwt.verify(refreshToken, JWT_SECRET_REFRESH_TOKEN, async (err, decoded) => {
    if (err) {
      return res.status(403).json({
        status: 'error',
        message: err.message,
      });
    }
    const CheckAccount = await Account.findById({ _id: decoded.id });
    if (email !== CheckAccount.email) {
      return next(new AppErr('email is not valid', 400));
    }
    const token = jwt.sign({ id: decoded.id }, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRED,
    });

    const cookieOptions = {
      expires: new Date(
        Date.now() + JWT_ACCESS_EXPIRED * 1 * 1 * 1 * 1 // Time Expired * Hours * Minute * Second * MilliSecond
      ),
      httpOnly: true,
    };

    if (NODE_ENV === 'production') cookieOptions.Secure = true;

    res.cookie('jwt', token, cookieOptions);

    return res.json({
      status: 'success',
      data: {
        token,
      },
    });
  });
});
