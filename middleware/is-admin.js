const Channel = require("../models/channel");

module.exports = (req, res, next) => {
  const channelId = req.params.channelId;
  Channel.findById(channelId).then((channel) => {
    if (!channel.admin.includes(req.userId)) {
      const error = new Error("This admin doesnt belong in this channel");
      error.statusCode = 401;
      throw error;
    }
    next();
  });
};
