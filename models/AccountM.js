const Mongoose = require('mongoose');
const enCode = require('bcrypt');

const saltRounds = 13;
const salt = enCode.genSaltSync(saltRounds);
const cryptoJs = require('crypto-js');
const crypto = require('crypto');

const accountSchema = new Mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      index: true,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'industri', 'pengepul', 'bank-sampah'],
      default: 'user',
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: Number,
      validAt: Date,
    },
    firebaseToken: String,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

accountSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  const hash2 = cryptoJs.AES.decrypt(
    userPassword,
    process.env.PASS_SEC
  ).toString(cryptoJs.enc.Utf8);
  return await enCode.compare(candidatePassword, hash2);
};

accountSchema.pre(/^find/, function (next) {
  this.find({ isVerified: { $ne: false } });
  next();
});

accountSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //Second
  next();
});

accountSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

accountSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  // False means Not Changed
  return false;
};

module.exports = Mongoose.model('Account', accountSchema);
