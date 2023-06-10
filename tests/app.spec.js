const axios = require("axios");
require("dotenv").config();

describe("check api is running", () => {
  it("GET / should can return success", async () => {
    const port = process.env.PORT || 3000;
    const res = await axios({
      url: `http://localhost:${port}`,
    });
    expect(res.status).toBe(200);
  });
});
