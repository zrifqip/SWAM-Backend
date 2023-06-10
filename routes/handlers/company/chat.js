
// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');

const apiFeature = require('../../../helpers/apiFeature');

// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();

const mongoose = require('mongoose');
const Chat = require('../../../models/Chat');


module.exports = {
    start: catchAsync(async (req, res, next) => {
        let chat
        chat = await Chat.findOne({
            from: {
                $in: [ req.user[0].id, req.body.userID  ]
            },
            to : {
                $in: [req.user[0].id, req.body.userID ]
            }
        })

        if(!chat) {
            chat = await Chat.create({
                from: req.user[0].id, 
                to: req.body.userID
            })
        }

        res.status(200).json({
            message: 'success',
            data: {
                _id: chat.id
            }
        });
    }),
    list: catchAsync(async (req, res, next) => {
        
        let match
        if(req.query.id){
            match = { _id: mongoose.Types.ObjectId(req.query.id) }
        }else{
            match = { $or : [ {from: req.user[0].id}, {to: req.user[0].id }] }
        }

        let aggregate = [
            {
                $match: match
            },
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'from',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $lookup: {
                            from: 'usercompanies',
                            localField: '_id',
                            foreignField: 'accountID',
                            pipeline: [
                                {
                                $project: {
                                    _id: 0,
                                    name: '$companyName',
                                    image: '$image'
                                }
                                }
                            ],
                            as: 'users'
                            }
                        },
                        {
                            $unwind: '$users'
                        },
                        {
                            $project: {
                             _id: '$_id',
                            name: '$users.name',
                            image: '$users.image'
                            }
                        }
                    ],
                     as: 'from'
                }
            }, 
            {
                $unwind: {
                    path: "$from"
                }
            }, 
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'to',
                    foreignField: '_id',
                    pipeline: [
                    {
                        $lookup: {
                        from: 'usercompanies',
                        localField: '_id',
                        foreignField: 'accountID',
                        pipeline: [
                            {
                            $project: {
                                _id: 0,
                                name: '$companyName',
                                image: '$image'
                            }
                            }
                        ],
                        as: 'users'
                        }
                    },
                    {
                        $unwind: '$users'
                    },
                    {
                        $project: {
                        _id: '$_id',
                        name: '$users.name',
                        image: '$users.image'
                        }
                    }
                    ],
                    as: 'to'
                }
            }, 
            {
                $unwind: {
                    path: '$to'
                }
            }
        ];

        if(req.query.id){
            aggregate.push({
                $limit: 1
            })
        }else{
            aggregate.push({
                $project: {
                    _id: "$_id",
                    from: "$from",
                    to: "$to",
                    lastMsg: {
                        $last: '$chats'
                    }
                }
            })
        }

        const chat = await Chat.aggregate(aggregate)

        res.status(200).json({
            message: 'success',
            data: req.query.id ? chat[0]: chat
        });
    })
}