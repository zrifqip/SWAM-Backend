const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Schema;

const companySchedule = new Mongoose.Schema(
  {
    userID: {
      type: ObjectId,
      ref: 'UserCompany',
    },
    day: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

companySchedule.pre(/^find/, function (next) {
  this.populate({
    path: 'userID',
    select:
      '_id companyName companyType nameCEO phoneNumber companyService address',
  });
  next();
});

module.exports = Mongoose.model('companySchedule', companySchedule);
