const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");

const User = require("../models/user");
const Channel = require("../models/channel");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  //validation error handling
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  //extracting request
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  //hashing password
  bcrypt
    .hash(password, 10)
    .then((hashedPw) => {
      const user = new User({
        username: username,
        password: hashedPw,
        name: name,
      });
      return user.save();
    })
    .then((user) => {
      //assign user ke channel prodi dan jurusan
      if (user.username.length === 10) {
        //extract kode prodi
        let kodeProdi = user.username.slice(2, 6);
        Channel.find({ kodeProdi: kodeProdi })
          .then((channels) => {
            //auto assign user to channel based on kode prodi
            channels.forEach((channel) => {
              user.assignedChannel.push(channel._id);
              channel.member.push(user._id);
              channel.save();
            });
            return user.save();
          })
          .then((result) => {
            res.status(201).json({
              message: "User created",
              userId: result._id,
              user: result,
            });
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
      } else {
        res
          .status(201)
          .json({ message: "User created", userId: user._id, user: user });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ username: username })
    .then((user) => {
      //account not found error
      if (!user) {
        const error = new Error("This username is not registered");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong Password");
        error.statusCode = 401;
        throw error;
      }
      //creating jwt token
      const token = jwt.sign(
        {
          username: loadedUser.username,
          userId: loadedUser._id.toString(),
        },
        config.get("jwt.secretKey"),
        { expiresIn: config.get("jwt.expired") }
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.admin_signup = (req, res, next) => {};
