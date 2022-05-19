const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 *  title
 *  author : user object id
 *  datePosted
 *  channel : channel object id
 *  active
 *  kategori : 'Surat Edaran', 'Event', 'Notice', 'Lost and Found'
 *  content : {
 *      text
 *  }
 */
//skema content
const contentSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    attachment: [
        {
            type: String,
            required: false
        }
    ],
    image: [
        {
            type: String,
            required: false
        }
    ],
    video: [
        {
            type: String,
            required: false
        }
    ]
})

//skema reply
const replySchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        max: [50, 'Comment exceeded maximum length']
    }
}, {timestamps: true});

//skema comment
const commentSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        max: [50, 'Comment exceeded maximum length']
    },
    replies: [
        {
            type: replySchema,
            required: false
        }
    ]
}, {timestamps: true});

//skema post
const postSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    datePosted: {
        type: Date,
        required: true,
        default: new Date()
    },
    validityDate: {
        type: Date,
        required: false,
    },
    channel: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Channel',
            required: true,
        }
    ],
    urgent: {
        type: Boolean,
        required: false,
        default: false
    },
    readOnly: {
        type: Boolean,
        required: false,
        default: false
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    },
    kategori: {
        type: String,
        enum: {
            values: ['Surat Edaran', 'Event', 'Notice', 'Lost and Found'],
            message: '{VALUE} is not supported'
        },
        required: true,
    },
    content: {
        type: contentSchema,
        required: true
    },
    comments: [
        {
            type: commentSchema,
            required: false
        }
    ]
}, {timestamps: true});

module.exports = mongoose.model('Post', postSchema);
