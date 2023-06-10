const AppErr = require('../helpers/AppError');

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user[0].role)) {
      return next(
        new AppErr('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
