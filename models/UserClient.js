const Mongoose = require('mongoose');

const { ObjectId } = Mongoose.Schema;

const userSchema = new Mongoose.Schema(
  {
    accountID: {
      type: ObjectId,
      ref: 'Account',
    },
    fullName: {
      type: String,
      required: true,
    },
    sex: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    address: {
      country: String,
      region: {
        type: Object,
        province: String,
        city: String,
      },
      district: String,
      street: String,
      postalCode: Number,
    },
    companyID: {
      type: ObjectId,
      ref: 'UserCompany'
    },
    balance: {
      type: Number,
      default: 0
    },
    bankAccount: {
       name: String,
       accountNumber: Number,
       accountName: String
    },
    photo: { type: Array },
  },
  { timestamps: true }
);

module.exports = Mongoose.model('UserClient', userSchema);
