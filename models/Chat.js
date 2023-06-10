const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Schema;

const chatSchema = new Mongoose.Schema(
  {
    from: {
        type: ObjectId,
        ref: 'Account',
        required: true,
    },
    to: {
        type: ObjectId,
        ref: 'Account',
        required: true,
    }, 
    chats: [
        {
            userID: {
                type: ObjectId,
                ref: 'Account'
            },
            msg: String,
            datetime: Date,
            read: {
                type: Boolean,
                default: false
            }
        }
    ]
   }, 
   {
    timestamps: true,
   }
);

module.exports = Mongoose.model('Chat', chatSchema);
