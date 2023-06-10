const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const itemCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userID: {
      type: ObjectId,
      ref: 'UserCompany',
      default: null
    },
    type: String,
    desc: String,
  }
);

module.exports = mongoose.model('ItemCategories', itemCategorySchema);
