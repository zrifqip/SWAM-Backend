// Model Import
const Item = require('../../../models/Item');
const ItemCategory = require('../../../models/ItemCategory');
const User = require('../../../models/userCompany');
// const Factory = require('./handlerFactory');
// Lib Import
const apiFeature = require('../../../helpers/apiFeature');
// Validation Handler
const Validator = require('fastest-validator');
const v = new Validator();
// Error Handler
const catchAsync = require('../../../helpers/catchAsync');
const AppErr = require('../../../helpers/AppError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports = {
  getItemCategory: catchAsync(async (req, res, next) => {
    const itemCategory = await ItemCategory.find({
      userID: {
        $in: [req.organization._id, null]
      }
    });
    return res.status(200).json({
      status: 'success',
      data: itemCategory
    });
  }),
  createCategory: catchAsync(async (req, res, next) => {
    let { name, type, desc } = req.body;
    const schema = {
      name: 'string|empty:false'
    }
    const valid = v.validate(req.body, schema);

    if (valid.length) {
      return res.status(400).json({
        status: 'error',
        message: valid,
      });
    }

    const category = await ItemCategory.create({
      name,
      userID: req.organization._id,
      type,
      desc
    })

    return res.status(200).json({
      status: 'success',
      data: category
    });
  }),
  updateCategory: catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(
      req.body,
      'name',
      'desc',
      'type'
    );

    const updateItem = await ItemCategory.findByIdAndUpdate(
      req.query.id,
      filteredBody,
      { new: true, runValidators: true }
    );
    if (!updateItem) {
      return next(new AppErr('No item found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { updateItem },
    });
  }),
  createItem: catchAsync(async (req, res, next) => {
    let { name, category, note, sellingPrice, purchasePrice, isSell, imageCover, images } = req.body;
    weight = parseInt(req.body.weight),
      sell = parseInt(req.body.sell),
      buying = parseInt(req.body.buying)
    const schema = {
      weight: 'number|optional|empty:true',
      purchasePrice: 'number|integer|positive',
      isSell: 'boolean',
      category: {
        type: 'object',
        $$strict: true,
        props: {
          _id: 'string|empty:false',
          name: 'string|empty:false',
          desc: 'string',
        }
      }
    };
    const valid = v.validate(req.body, schema);

    if (valid.length) {
      return res.status(400).json({
        status: 'error',
        message: valid,
      });
    }

    const dataItem = await Item.create({
      userID: req.organization._id,
      name,
      category,
      sellingPrice,
      purchasePrice,
      weight,
      isSell,
      note,
      // imageCover: req.imageCover,
      // images: req.images,
    });

    res.status(201).json({
      status: 'success',
      data: dataItem
    });
  }),
  updateItem: catchAsync(async (req, res, next) => {
    const filteredBody = filterObj(
      req.body,
      'name',
      'weight',
      'sellingPrice',
      'purchasePrice',
      'category',
      'isSell',
      'note'
    );

    if (req.images) {
      filteredBody.images = req.images;
    }

    const updateItem = await Item.findByIdAndUpdate(
      req.query.id,
      filteredBody,
      { new: true, runValidators: true }
    );
    if (!updateItem) {
      return next(new AppErr('No item found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { updateItem },
    });
  }),
  deleteItem: catchAsync(async (req, res, next) => {
    const doc = await Item.findByIdAndDelete(req.query.id);
    if (!doc) {
      return next(new AppErr('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'document has been deleted',
    });
  }),
  getItem: catchAsync(async (req, res, next) => {
    let query = await Item.findById(req.params.slug).select(
      '-__v -createdAt -updatedAt'
    );

    if (!query) {
      return next(new AppErr('No item found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: query,
    });
  }),
  getAllItem: catchAsync(async (req, res, next) => {
    const features = new apiFeature(
      Item.find({
        userID: req.organization._id,
      }).select('-__v -createdAt -updatedAt'),
      req.query
    ).paginate();

    const itemData = await features.query;

    if (!itemData || itemData == null) {
      return next(new AppErr('No item found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: itemData,
    });
  }),
};
