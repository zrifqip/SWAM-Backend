const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Schema;

const transactionSchema = new Mongoose.Schema(
  {
    customerID: {
      type: ObjectId,
      ref: 'UserClient',
      required: true,
    },
    deliveryType: {
      type: String,
      enum: ['self-delivery', 'pickup'],
      required: true,
    },
    scheduleID: {
      type: ObjectId,
      ref: 'companySchedule',
      required: true,
    },
    note: String,
    status: {
      type: String,
      enum: ['new', 'pending', 'pickup/delivery', 'cancel', 'success'], //new, pending, pickup/delivery, cancel, success
      required: true,
    },
    images: { type: Array },
  },
  {
    timestamps: true,
  }
);

transactionSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'customerID',
    select: '-__v -createdAt -updatedAt',
  })
    .populate({
      path: 'scheduleID',
      select: '-__v -createdAt -updatedAt',
    })
    .select('-__v -createdAt -updatedAt');
  next();
});

module.exports = Mongoose.model('Transaction', transactionSchema);
