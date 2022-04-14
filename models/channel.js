const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//skema channel
const channelSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    entry_code: {
        type: String,
        required: false
    },
    member: {
        type: Object,
        required: false
    }
}, {timestamps: true});

module.exports = mongoose.model('Channel', channelSchema);