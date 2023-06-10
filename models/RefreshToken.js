const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Schema;

const refreshTokenSchema = new Mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    userID: {
      type: ObjectId,
      ref: 'Account',
    },
  },
  { timestamps: true }
);

module.exports = Mongoose.model('RefreshToken', refreshTokenSchema);