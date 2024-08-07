const express = require("express");
const router = express.Router();

// Handler user
const userHandlerCompany = require("./handlers/company/users");
const userHandlerClient = require("./handlers/clients/users");
const companyHandlerClient = require("./handlers/clients/company");
// Middleware
const Protected = require("../middlewares/verifyCompany");
const UpImages = require("../middlewares/upCompany");
const UpItems = require("../middlewares/UpItem");
// Token
// const tokenAuth = require('./handlers/refreshToken');
// Handlere item
const itemHandler = require("./handlers/company/item");
const scheduleHandler = require("./handlers/company/schedule");
const transactionHandler = require("./handlers/company/transaction");
const withdrawHandler = require("./handlers/company/withdrawal");
const chatHandler = require("./handlers/company/chat");
const customerHandler = require("./handlers/company/customer");
const interestHandler = require("./handlers/company/interest");
const roleC = require("../middlewares/roleUser");
const checkVersion = require("../middlewares/Appversion");

// Collector
// Token
// router.post('/refresh-token', tokenAuth);
/* POST users listing. */
// router.use(checkVersion);
router.post("/login", userHandlerCompany.login);
router.post("/register", userHandlerCompany.register);
// Reset Password
router.post("/forgotpassword", userHandlerCompany.forgotPasssword);
router.patch("/resetpassword/:token", userHandlerCompany.resetPasssword);
router.use(Protected, roleC.restrictTo("pengepul", "bank-sampah"));
router.patch("/updatepassword/", userHandlerCompany.updatePassword);
router.patch("/firebasetoken", userHandlerClient.setFirebaseToken);
/* GET users listing. */
router
  .route("/profile")
  .get(userHandlerCompany.getMe)
  .patch(
    UpImages.uploadImage,
    UpImages.resizeImages,
    userHandlerCompany.update
  );
/* DELETE users listing. */
router.patch("/delete", userHandlerCompany.deleteMe);
router.delete("/logout", userHandlerCompany.logout);
// Endpoint Item
router
  .route("/itemcategory")
  .get(itemHandler.getItemCategory)
  .post(itemHandler.createCategory)
  .patch(itemHandler.updateCategory);

router
  .route("/item")
  .post(itemHandler.createItem)
  .patch(UpItems.uploadItem, UpItems.resizeImages, itemHandler.updateItem)
  .delete(itemHandler.deleteItem)
  .get(itemHandler.getAllItem);

router.get("/item/summary", itemHandler.summaryItem);
router.get("/item/:slug", itemHandler.getItem);
// Endpoint Schedule
router
  .route("/schedule")
  .post(scheduleHandler.createSchedule)
  .patch(scheduleHandler.updateSchedule)
  .delete(scheduleHandler.deleteSchedule)
  .get(scheduleHandler.getAllSchedule);
router.get("/schedule/:slug", scheduleHandler.getSchedule);
// Enpoint Transaction
router.get('/transaction/all', transactionHandler.listTrans);
router.get('/transaction/summary', transactionHandler.summaryTransaction);
router
  .route("/transaction")
  .get(transactionHandler.detailTrans)
  .post(transactionHandler.createTrans);

router
  .route("/withdraw")
  .get(withdrawHandler.list)
  .patch(withdrawHandler.update);

router
  .route("/customer")
  .get(customerHandler.list)
  .patch(customerHandler.Update);
router.get("/customer/detail/:slug", customerHandler.getCustomer);
router.patch("/customer/detail", customerHandler.Edit);

router
  .route("/interest")
  .post(interestHandler.createInterestTransaction)

router.post("/startchat", chatHandler.start);
router.get("/chat", chatHandler.list);

//untuk pengepul
router.get("/list", userHandlerCompany.allBankSampah);
router.get("/dashboard", userHandlerCompany.dashboardBankSampah);
router.get("/stock", userHandlerCompany.stockBankSampah);
router.get("/list/item", companyHandlerClient.getAllItemPublik);

router.post("/sendnotif", userHandlerClient.sendNotification);

module.exports = router;
