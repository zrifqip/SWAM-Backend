const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Schema;

const detailTransactionNSchema = new Mongoose.Schema(
  {
    item_id: { type: ObjectId },
    item_name: String,
    weight: Number,
    price: Number,
    companyId: { type: ObjectId },
    date: {
      month: Number,
      year: Number,
      date: Number,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Mongoose.model(
  'detail_transaction_normalize',
  detailTransactionNSchema,
  'detail_transaction_normalize'
);
