const Channel = require("../models/channel");
const isJsonParsable = require("../helpers/is-json-parsable");

module.exports = async (req, res, next) => {
  let channelId = req.params.channelId;
  let query;
  if (isJsonParsable(req.params.channelId)) {
    channelId = JSON.parse(channelId);
    query = await Channel.find({ _id: channelId });
    for (const queryElement of query) {
      if (!queryElement.admin.includes(req.userId)) {
        const error = new Error("This admin doesnt belong in this channel");
        error.statusCode = 401;
        throw error;
      }
    }
  } else {
    query = await Channel.findById(channelId);
    if (!query.admin.includes(req.userId)) {
      const error = new Error("This admin doesnt belong in this channel");
      error.statusCode = 401;
      throw error;
    }
  }
  next();
};
