const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Schema;

const detailTransactionSchema = new Mongoose.Schema(
  {
    transactionID: {
      type: ObjectId,
      ref: 'Transaction',
      required: true,
    },
    itemID: { type: ObjectId, required: true, ref: 'Item' },
    weight: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Mongoose.model('DetailTransaction', detailTransactionSchema);
