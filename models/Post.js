const mongoose = require('mongoose')
const {Schema}  = mongoose

const PostSchema = new Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    schools: {
        type: [String],
        default: ["newman"]
    },
    accountTypes: {
        type: [String],
        default: ["student","parent","prospect","alum","prospectiveParent","other"]
    },
    date: {
        type: [Date]
    },
    time: {
        type: [Number]
    },
    title: {
        type: String,
        required: true
    },
    photos: [],
    photoPosition: {
        type: String,
        default: "above"
    },
    body: {
        type: String,
        required: true
    },
    keywords: [String],
    location: String,
    contactEmail: String
}, {timestamps: true})

const PostModel = mongoose.model('Post',PostSchema)

module.exports = PostModel