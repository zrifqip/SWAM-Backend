var express = require('express');
const path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.status(200).send('SWAM Apps API');
});

router.get('/term', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/term.html'));
});

router.get('/privacy-policy', function (req, res, next) {
  res.sendFile(path.join(__dirname, '../public/privacy.html'));
});

module.exports = router;
