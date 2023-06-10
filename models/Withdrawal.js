const Mongoose = require('mongoose');

const { ObjectId } = Mongoose.Schema;

const withdrawalSchema = new Mongoose.Schema(
  {
    customerID: {
      type: ObjectId,
      ref: 'UserClient',
      required: true
    },
    companyID: {
      type: ObjectId,
      ref: 'UserCompany',
      required: true,
    },
    nominal: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ['cash', 'transfer']
    },
    status: {
      type: String,
      enum: ['pending', 'accept', 'reject'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = Mongoose.model('Withdrawal', withdrawalSchema);
