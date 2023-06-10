const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
// const Promise = require("bluebird");
const UpImage = require("../helpers/ImageUpload");
// global.Promise = Promise;

const multerStorage = multer.memoryStorage();

const today = new Date();
const year = today.getFullYear();
const month = `${today.getMonth() + 1}`.padStart(2, "0");

const uploadUser = multer({
  storage: multerStorage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("photo");

// Check file Type
function checkFileType(file, cb) {
  // Allowed ext
  const fileTypes = /jpeg|jpg|png/;
  // Check ext
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimeType = fileTypes.test(file.mimetype);
  
  if (mimeType && extName) {
    return cb(null, true);
  } else {
    cb("Error: Images Only !!!", false);
  }
}

module.exports = {
  uploadUser,
  resizeImages: async (req, res, next) => {
    if (!req.file) return next();

    const filename =
      req.biodata._id +
      Date.now() +
      path.extname(req.file.originalname).toLowerCase();

      
      const fileUrl = `images/user/${year}/${month}/${req.biodata._id}`;
      
      const uploadPath = `public/images/user/${year}/${month}/${req.biodata._id}`;
      
      const sizes = [
      {
        path: "original",
        width: null,
        height: null,
      },
      {
        path: "medium",
        width: 300,
        height: 450,
      },
      {
        path: "thumb",
        width: 100,
        height: 120,
      },
    ];

    // sharp options
    const sharpOptions = {
      fit: "fill",
      background: { r: 255, g: 255, b: 255 },
    };

    const resizeObj = new UpImage(
      req,
      filename,
      sizes,
      uploadPath,
      fileUrl,
      sharpOptions
    );
    
    
    await resizeObj.resize();
    const getDataUploaded = resizeObj.getData();
    
    // Get details of uploaded files: Used by multer fields
    req.images = getDataUploaded;

    next();
  },
};
