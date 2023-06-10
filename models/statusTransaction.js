const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const statusTransactionSchema = new mongoose.Schema(
  {
    transactionID: {
      type: ObjectId,
      ref: 'Transaction',
      required: true,
    },
    step: [
      {
        name: String,
        dateStep: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StatusTransaction', statusTransactionSchema);
