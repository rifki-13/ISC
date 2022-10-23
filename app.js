//import package
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require("config");

//import route
const userRoutes = require("./routes/user");
const channelRoutes = require("./routes/channel");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(bodyParser.json()); // application/json

//CORS and header policy
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

//register route ke app
app.use("/users", userRoutes);
app.use("/channels", channelRoutes);
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/admin", adminRoutes);
//TODO : consider adding reported routes

//error middleware catch error dan mengirimkan respon message error
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});

mongoose
  .connect(config.get("db.uri"))
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
