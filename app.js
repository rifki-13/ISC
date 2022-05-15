//import package
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

//s3 account
const s3 = new aws.S3({
    accessKeyId: 'AKIAWDXZGMLGMFFP2SPU',
    secretAccessKey: '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',
})

//multer upload
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'ta-isc',
        acl: "public-read",
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
})

//import route
const userRoutes = require('./routes/user');
const channelRoutes = require('./routes/channel');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');

const app = express();

app.use(bodyParser.json()); // application/json

//use multer
app.use(upload.single('photo'));
// app.use(upload.array('', 4));

//CORS and header policy
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

//register route ke app
app.use('/users', userRoutes);
app.use('/channels', channelRoutes);
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);

//error middleware catch error dan mengirimkan respon message error
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({message: message});
})

//koneksi mongoose
// mongoose.connect('mongodb+srv://rifki1371:T5ARXNLZKB5REUNn@ta.3poqp.mongodb.net/TA?retryWrites=true&w=majority')
//     .then(result => {
//         app.listen(8080);
//     })
//     .catch(err => console.log(err));
mongoose.connect('mongodb://rifki1371:T5ARXNLZKB5REUNn@ta-shard-00-00.3poqp.mongodb.net:27017,ta-shard-00-01.3poqp.mongodb.net:27017,ta-shard-00-02.3poqp.mongodb.net:27017/TA?ssl=true&replicaSet=atlas-brymmm-shard-0&authSource=admin&retryWrites=true&w=majority')
    .then(result => {
        app.listen(8080);
    })
    .catch(err => console.log(err));

