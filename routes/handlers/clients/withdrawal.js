
// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');

// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();

const mongoose = require('mongoose');
const UserClient = require('../../../models/UserClient');
const userCompany = require('../../../models/userCompany');
const Withdrawal = require('../../../models/Withdrawal');


module.exports = {
    request: catchAsync(async (req, res, next) => {
        const {
            nominal,
            method
        } = req.body;

        const schema = {
            nominal: 'number',
            method: { type: 'enum', values: ['cash', 'transfer'] },
        }

        const valid = v.validate(req.body, schema);
        if (valid.length) {
          return res.status(400).json({
            status: 'error',
            message: valid,
          });
        }

        //Check Balance
        const me = await UserClient.findById(req.biodata._id).select('balance companyID bankAccount')
        const company = await userCompany.findById(me.companyID).select('minimumWithdrawal')

        if (method === 'transfer') {
          if(!me.bankAccount.accountNumber || !me.bankAccount.name){
            return res.status(400).json({
              status: 'error',
              message: 'Bank account not found'
            })
          }
        }

        if (nominal > me.balance ) {
          return res.status(400).json({
            status: 'error',
            message: 'Your balance is not enough',
          });
        }

        if (nominal < company.minimumWithdrawal ) {
          return res.status(400).json({
            status: 'error',
            message: 'Your balance is not enough from minimum withdrawal',
          });
        }

        await Withdrawal.create({
          customerID: req.biodata._id,
          companyID: me.companyID,
          method,
          nominal
        })

        await UserClient.findByIdAndUpdate(req.biodata._id, {
          $inc: {
            balance: - nominal
          }
        })

        return res.status(201).json({
          status: 'success'
        });

    }),
    list: catchAsync(async (req, res, next) => {
      const withdraw = await Withdrawal.find({
        customerID: req.biodata._id
      }).populate('companyID').sort({ createdAt: 'desc'})

      return res.status(200).json({
        status: 'success',
        data: withdraw
      });
    })
}