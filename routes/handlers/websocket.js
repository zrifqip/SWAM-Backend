 const Chat = require('../../models/Chat');
 const mongoose = require('mongoose');
 const moment = require('moment')

 const middleware = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token === process.env.SOCKET_IO_TOKEN) {
        next()
    }else{
        const err = new Error("not authorized");
        err.data = { content: "Please retry later" }; // additional details
        next(err);
    }
}

const wsHandler = (io) => {
    const chatIO = io.of('/chat');
    chatIO.use(middleware);
    chatIO.on('connection', (socket) => {
        socket.onAny(async (eventName, msg) => {
            let data = { ...msg, datetime: moment().format('YYYY-MM-DD hh:mm:ss')}
            chatIO.emit(eventName, data);

            await Chat.findByIdAndUpdate(eventName, {
                $push: {
                    chats: {
                        userID: mongoose.Types.ObjectId(data.userID),
                        msg: data.msg,
                        datetime: data.datetime
                    }
                }
            })
        })
    })

}

module.exports = wsHandler