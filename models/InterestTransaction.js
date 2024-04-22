const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Schema;

const interestTransactionSchema = new Mongoose.Schema(
  {
    customerID: {
      type: ObjectId,
      ref: "UserClient",
      required: true,
    },
    interest: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Mongoose.model('InterestTrasaction', interestTransactionSchema);
