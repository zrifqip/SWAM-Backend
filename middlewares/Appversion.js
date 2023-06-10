

const catchAsync = require('../helpers/catchAsync');
const AppErr = require('../helpers/AppError');
 
module.exports = catchAsync(async (req, res, next) => {
  const version = req.headers['x-app-version'];
  const currentVersion = process.env.APP_VERSION;

  if (version ===  currentVersion) {
    next()
  }else{
    return next(
        new AppErr('Update app required', 403)
    );
  }
});
