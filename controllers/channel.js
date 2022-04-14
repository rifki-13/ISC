const {validationResult} = require('express-validator');

const Channel = require('../models/channel');

//return all list channel || GET /channel/
exports.getChannels = (req, res, next) => {
    Channel
        .find()
        .then(channels => {
            res.status(200).json({message: 'All Channel fetched', channels: channels})
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}

//create empty channel || POST /channel/
exports.addChannel = (req, res, next) => {
    //error handling
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    //model construct
    const name = req.body.name;
    const desc = req.body.desc;
    const entry_code = req.body.entry_code;
    const channel = new Channel({
        name: name,
        desc: desc,
        entry_code: entry_code
    });
    //save model ke database
    channel
        .save()
        .then(result => {
            res.status(201).json({
                message: 'Channel created',
                post: result
            })
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}

// get 1 channel based on id || Get /channel/:channelId
exports.getChannel = (req, res, next) => {
    const channelId = req.params.channelId;
    Channel.findById(channelId)
        .then(channel => {
            if(!channel){
                const error = new Error('Channel not found');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({message: 'Channel exist', channel: channel});
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
}

//edit channel based on Id || PUT /channel/:channelId
exports.updateChannel = (req, res, next) => {
    const channelId = req.params.channelId;
    //error validation handling
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation Failed');
        error.statusCode = 422;
        throw error;
    }
    const name = req.body.name;
    const desc = req.body.desc;
    // const entry_code = req.body.entry_code; //entry code is not changeable
    Channel.findById(channelId)
        .then(channel => {
            if(!channel){
                const error = new Error('Channel not found');
                error.statusCode = 404;
                throw error;
            }
            channel.name = name;
            channel.desc = desc;
            return channel.save();
        })
        .then(result => {
            res.status(200).json({message: "Channel updated", channel: result})
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteChannel = (req, res, next) => {
    const channelId = req.params.channelId;
    Channel.findById(channelId)
        .then(channel => {
            if(!channel){
                const error = new Error('Channel not found');
                error.statusCode = 404;
                throw error;
            }
            return Channel.findByIdAndRemove(channelId);
        })
        .then(result => {
            console.log(result);
            res.status(200).json({message: "Channel deleted"});
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        })

}