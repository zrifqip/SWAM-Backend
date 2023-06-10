const axios = require("axios");
const qs = require("qs");
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

let config = {
  method: "POST",
  url: `${process.env.BLAST_WA_HOST}/api/send-message`,
  headers: {
    Authorization: process.env.BLAST_WA_KEY,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  httpsAgent: agent,
};

const sendMessage = async (phone, message) => {
  try {
    const data = qs.stringify({
      phone,
      message,
    });
    if (process.env.APP_ENV == "development") return null;

    await axios({ data, ...config });
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendMessage;
