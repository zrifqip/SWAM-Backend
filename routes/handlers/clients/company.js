// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');
// Modal Handler
const userCompany = require('../../../models/userCompany');
const Account = require('../../../models/AccountM');
const Item = require('../../../models/Item');
const scheduleCollector = require('../../../models/Schedule');

const apiFeature = require('../../../helpers/apiFeature');

const mongoose = require('mongoose');

module.exports = {
  getMe: catchAsync(async (req, res, next) => {
    const query = await userCompany.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.query.id) } },
      {
        $lookup: {
            from: 'accounts',
            localField: 'accountID',
            foreignField: '_id',
            as: 'Account',
            pipeline: [{
                $project: {
                    phoneNumber: '$phoneNumber'
                }
            }]
        }
      },
      {
        $unwind: {
            path: '$Account'
        }
      },
      {
        $lookup: {
          from: Item.collection.name,
          localField: '_id',
          foreignField: 'userID',
          pipeline: [
            {
              $project: {
                name: '$name',
                slug: '$slug',
                category: '$category',
                point: '$point',
                price: '$price',
                selling: '$sellingPrice',
                buying: '$purchasePrice',
                weight: '$weight',
                description: '$description',
                photo: '$photo',
              },
            },
          ],
          as: 'Item',
        },
      },
      {
        $lookup: {
          from: scheduleCollector.collection.name,
          localField: '_id',
          foreignField: 'userID',
          pipeline: [
            {
              $project: {
                _id: '$_id',
                day: '$day',
                startTime: '$startTime',
                endTime: '$endTime',
              },
            },
          ],
          as: 'Schedule',
        },
      },
      {
        $project: {
          _id: '$_id',
          companyName: '$companyName',
          companyType: '$companyType',
          nameCEO: '$nameCEO',
          phoneNumber: '$phoneNumber',
          companyService: '$companyService',
          address: '$address',
          image: '$image',
          phoneNumber: '$Account.phoneNumber',
          item: '$Item',
          schedule: '$Schedule',
        },
      },
    ]);

    if (!query) {
      return next(new AppErr('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: query,
    });
  }),
  getAll: catchAsync(async (req, res, next) => {
    const features = new apiFeature(userCompany.aggregate([
      {
        $lookup: {
            from: Account.collection.name,
            localField: 'accountID',
            foreignField: '_id',
            pipeline: [
              {
                $match: {
                  role: 'bank-sampah'
                }
              }
          ],
          as: 'Account'
      }
    }, {
      $unwind: {
        path: '$Account'
      }
    }
    ]), req.query).paginate();

    const companyData = await features.query;

    if (companyData.length == 0) {
      return next(new AppErr('No Document in Collections', 404));
    }

    res.status(200).json({
      status: 'success',
      length: companyData.length,
      data: companyData,
    });
  }),
  getAllItemPublik: catchAsync(async (req, res, next) => {
    // const dataItem = await Item.find();
    const features = new apiFeature(Item.find({ userID: req.query.id }), req.query).paginate();

    const itemData = await features.query;

    if (itemData.length == 0) {
      return next(new AppErr('No Document in Collections', 404));
    }

    res.status(200).json({
      status: 'success',
      data: itemData,
    });
  }),
  getItemPublik: catchAsync(async (req, res, next) => {
    let query = await Item.findById(req.params.slug);

    if (!query) {
      return next(new AppErr('No item found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: query,
    });
  }),
  getSchedule: catchAsync(async (req, res, next) => {
    const schedule = await scheduleCollector.find({ userID: req.biodata.companyID})

    if (!schedule) {
      return next(new AppErr('No item found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: schedule
    })
  }),
  getCompanyWithin: catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng.',
          400
        )
      );
    }

    const company = await userCompany.find({
      'address.loc': { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'success',
      result: tours.length,
      data: tours,
    });
  }),
};
