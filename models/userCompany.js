const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Schema;

const userCompany = new Mongoose.Schema(
  {
    accountID: {
      type: ObjectId,
      ref: 'Account',
    },
    companyName: {
      type: String,
      required: true,
    },
    companyType: {
      type: String,
      enum: ['pt', 'maatschap', 'cv', 'firma', 'yayasan', 'koperasi', 'bumn'],
      required: true,
    },
    nameCEO: {
      type: String,
      required: true,
    },
    companyService: [{ 
      type: String,
      enum: ['self-delivery', 'pickup']
     }],
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
      loc: {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [{ type: Number, required: true }],
      },

    },
    minimumWithdrawal: {
      type: Number,
      default: 50000
    },
    image: { type: Array },
  },
  {
    timestamps: true,
  }
);

userCompany.index({ 'address.loc': '2dsphere' });

userCompany.pre(/^find/, function (next) {
  this.find()
    .select(
      '_id companyName companyType nameCEO phoneNumber companyService address image'
    )
    .populate({
      path: 'accountID',
      select: '-__v -createdAt -updatedAt -password',
    });
  next();
});
module.exports = Mongoose.model('UserCompany', userCompany);
