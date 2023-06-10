const Mongoose = require('mongoose');
const slugify = require('slugify');
const { ObjectId } = Mongoose.Schema;

const itemCompany = new Mongoose.Schema(
  {
    userID: {
      type: ObjectId,
      ref: 'UserCompany',
    },
    name: String,
    category : {
      _id: {
        type: ObjectId,
        ref: 'ItemCategories'
      },
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String
      },
      desc: String,
    },
    isSell: {
      type: Boolean,
      required: true,
      default: false
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      default: null,
    },
    note: String,
    imageCover: { type: Array },
    images: { type: Array },
  },
  {
    timestamps: true,
  }
);


itemCompany.pre(/^find/, function (next) {
  this.find().select('-createdAt -updatedAt -__v');
  next();
});

module.exports = Mongoose.model('Item', itemCompany);
