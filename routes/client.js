const express = require("express");
const router = express.Router();

// Handler user
const userHandlerClient = require("./handlers/clients/users");
const collectorHandler = require("./handlers/clients/company");
const transactionHandler = require("./handlers/clients/transaction");
const withdrawHandler = require("./handlers/clients/withdrawal");
// Middleware
const Protected = require("../middlewares/verifyTokenClient");
const roleC = require("../middlewares/roleUser");
const UpImages = require("../middlewares/upUser");
const UpTransaction = require("../middlewares/UpTransaction");
// Token
const tokenAuth = require("./handlers/refreshToken");
const checkVersion = require("../middlewares/Appversion");

// Client
// Reset Password
/* POST users listing. */
// router.use(checkVersion);
router.post("/login", userHandlerClient.login);
router.post("/loginbypass", userHandlerClient.loginByPass);
router.post("/verify", userHandlerClient.verifyOTP);
router.post("/register", userHandlerClient.register);
router.post("/forgotpassword", userHandlerClient.forgotPasssword);
router.patch("/resetpassword/:token", userHandlerClient.resetPasssword);
router.use(Protected, roleC.restrictTo("user"));
router.patch("/updatepassword/", userHandlerClient.updatePassword);
router.patch("/firebasetoken", userHandlerClient.setFirebaseToken);
// Token
router.post("/refresh-token", tokenAuth);
/* GET users listing. */
router
  .route("/profile")
  .get(userHandlerClient.getMe)
  .patch(UpImages.uploadUser, UpImages.resizeImages, userHandlerClient.update);
/* DELETE users listing. */
router.patch("/delete", userHandlerClient.deleteMe);
router.delete("/logout", userHandlerClient.logout);
// Publik API
router.route("/company").get(collectorHandler.getMe);
router.get("/company/all", collectorHandler.getAll);
router.get("/company/schedule", collectorHandler.getSchedule);
router.get("/company/item", collectorHandler.getAllItemPublik);
router.get("/company/item/:slug", collectorHandler.getItemPublik);
// API Transaction
router.get("/transaction", transactionHandler.detailTrans);
router.get("/transaction/list", transactionHandler.listTrans);

router
  .route("/withdraw")
  .post(withdrawHandler.request)
  .get(withdrawHandler.list);

router.post("/sendnotif", userHandlerClient.sendNotification);

module.exports = router;
