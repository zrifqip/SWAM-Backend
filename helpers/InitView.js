const initView = async (db) => {
  try {
    await db.createCollection('detail_transaction_normalize', {
      viewOn: 'transactions',
      pipeline: [
        {
          $match: {
            status: 'success',
          },
        },
        {
          $lookup: {
            from: 'userclients',
            localField: 'customerID',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: {
            path: '$customer',
          },
        },
        {
          $lookup: {
            from: 'detailtransactions',
            localField: '_id',
            foreignField: 'transactionID',
            pipeline: [
              {
                $lookup: {
                  from: 'items',
                  localField: 'itemID',
                  foreignField: '_id',
                  as: 'items',
                },
              },
              {
                $unwind: '$items',
              },
              {
                $project: {
                  item_id: '$items._id',
                  item_name: '$items.name',
                  weight: '$weight',
                  price: '$items.purchasePrice',
                },
              },
            ],
            as: 'detail',
          },
        },
        {
          $unwind: {
            path: '$detail',
          },
        },
        {
          $project: {
            _id: 0,
            item_id: '$detail.item_id',
            item_name: '$detail.item_name',
            weight: '$detail.weight',
            price: '$detail.price',
            companyId: '$customer.companyID',
            date: {
              month: {
                $month: '$createdAt',
              },
              year: {
                $year: '$createdAt',
              },
              date: {
                $dayOfMonth: '$createdAt',
              },
            },
          },
        },
      ],
    });
  } catch (error) {
    if (error.codeName == 'NamespaceExists') {
      return;
    }
    console.log(error.message);
  }
};

module.exports = initView;
