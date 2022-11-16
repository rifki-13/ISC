const readXlsxFile = require("read-excel-file/node");
const axios = require("axios");

const SystemSetting = require("../models/system-setting");
const User = require("../models/user");
const Channel = require("../models/channel");
const Post = require("../models/post");
const ChannelRequest = require("../models/channel-request");
const bcrypt = require("bcrypt");
const s3Helpers = require("../helpers/s3");

exports.addJurusanProdi = async (req, res, next) => {
  const jurusan = req.body.jurusan;
  const prodi = req.body.prodi;
  if (prodi.length === 0) {
    const err = new Error("Prodi tidak boleh kosong");
    err.statusCode = 422;
    next(err);
  }
  try {
    const setting = (await SystemSetting.find())[0];
    let prodiArr = [];
    for (const prodiElement of prodi) {
      prodiArr.push({ name: prodiElement.name, kode: prodiElement.kode });
    }
    const jurusanData = {
      name: jurusan,
      prodi: prodiArr,
    };
    setting.jurusan.push(jurusanData);
    await setting.save();
    res.status(201).json({
      message: "jurusan dan prodi berhasil ditambahkan",
      setting: setting,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.editJurusanProdi = async (req, res, next) => {
  const jurusanId = req.params.jurusanId;
  const jurusanName = req.body.jurusan;
  const prodi = req.body.prodi;
  try {
    const setting = (await SystemSetting.find())[0];
    const jurusan = setting.jurusan.id(jurusanId);
    let prodiData = [];
    for (const prodiElement of prodi) {
      prodiData.push({ name: prodiElement.name, kode: prodiElement.kode });
    }
    jurusan.name = jurusanName;
    jurusan.prodi = prodiData;
    await setting.save();
    res.status(200).json({ message: "Data jurusan berhasil di update" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getSystemSetting = async (req, res, next) => {
  try {
    const setting = (await SystemSetting.find())[0];
    res.status(200).json({ message: "setting fetched", setting: setting });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.editSystemSetting = async (req, res, next) => {
  const { enableRegister, enableChannelCreation } = req.body;
  try {
    const setting = (await SystemSetting.find())[0];
    setting.enable_register = enableRegister;
    setting.enable_channel_creation = enableChannelCreation;
    await setting.save();
    res.status(200).json({ message: "Setting berhasil di update" });
    //  TODO: edit system setting
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.importMahasiswa = async (req, res, next) => {
  try {
    const file = await axios.get(req.file.location, {
      responseType: "arraybuffer",
    });
    const password = await bcrypt.hash("12345678", 10);
    const rows = await readXlsxFile(Buffer.from(file.data));
    const [index0, ...rest] = [...rows];
    let createdUser = [];
    for (const mhs of rest) {
      const user = await User.create({
        username: mhs[0],
        password: password,
        name: mhs[1],
        jurusan: mhs[2],
        prodi: mhs[3],
        role: req.body.role,
      });
      createdUser.push(user);
    }
    //delete stored file
    await s3Helpers.deleteObject(req.file.key);
    res.status(201).json({
      message: `Data ${createdUser.length} ${req.body.role} berhasil di import`,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUserProdi = async (req, res, next) => {
  let query;
  try {
    query = User.find(
      { prodi: req.params.prodi },
      "_id name photo jurusan prodi username"
    );
    if (req.query.role) {
      query = query.where("role").equals(req.query.role);
    }
    const users = await query;
    let data = users;
    if (req.query.search) {
      data = users.filter((el) =>
        el.name
          .toLowerCase()
          .includes(req.query.search.toString().toLowerCase())
      );
    }
    res.status(200).json({ message: "Data User fetched", users: data });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const channels = await Channel.find({ member: userId });
    for (const channel of channels) {
      channel.member.pull(userId);
      if (channel.admin.includes(userId)) {
        channel.admin.pull(userId);
      }
      await channel.save();
    }
    const channelPendingEntries = await Channel.find({ pending_entry: userId });
    for (const channelPendingEntry of channelPendingEntries) {
      channelPendingEntry.pull(userId);
      await channelPendingEntry.save();
    }
    const channelRequests = await ChannelRequest.find({ requester: userId });
    for (const channelRequest of channelRequests) {
      await channelRequest.remove();
    }
    const posts = await Post.find({ author: userId });
    for (const post of posts) {
      await post.remove();
    }
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User account deleted" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createChannel = async (req, res, next) => {
  const { channelName, channelDesc, entryCode, admin, parentChannel } =
    req.body;
  try {
    const user = await User.findById(admin);
    const channel = await Channel.create({
      name: channelName,
      desc: channelDesc,
      ...(entryCode && { entry_code: entryCode }),
    });
    if (parentChannel) {
      const parent = await Channel.findById(parentChannel);
      parent.child_channel.push(channel);
      await parent.save();
      channel.parent_channel = parent;
    }
    channel.member.push(user);
    channel.admin.push(user);
    user.assigned_channel.push(channel);
    user.managed_channel.push(channel);
    await channel.save();
    await user.save();
    res.status(201).json({ message: "Channel created", channel: channel });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getChannels = async (req, res, next) => {
  try {
    let query = Channel.find();
    if (req.query.search) {
      query = Channel.find({
        name: { $regex: req.query.search, $options: "i" },
      });
    }
    const channels = await query.populate("admin");
    res.status(200).json({ message: "Channel fetched", channels: channels });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    let query = User.find();
    if (req.query.search) {
      query = User.find({
        name: { $regex: req.query.search, $options: "i" },
      });
    }
    const users = await query;
    res.status(200).json({ message: "Users fetched", users: users });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
