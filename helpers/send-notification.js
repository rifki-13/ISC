const axios = require("axios");
//TODO add data to axios
module.exports = async (expoPushTokens, title, body, data = null) => {
  return axios({
    url: "https://exp.host/--/api/v2/push/send",
    headers: {
      "Content-Type": "application/json",
    },
    method: "post",
    data: {
      to: expoPushTokens,
      title: title,
      body: body,
    },
  });
};
