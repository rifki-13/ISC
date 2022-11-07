const axios = require("axios");
//TODO : use expo server sdk to send notification
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
      data: data,
    },
  });
};
