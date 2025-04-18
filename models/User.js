const mongoose = require('mongoose')
const {Schema}  = mongoose

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    secondEmail: {
        type: String,
        default: null
    },
    role: {
        type: String,
        default: null
    },
    phone: {
        type: Number,
        default: null
    },
    schools: {
        type: [String],
        default: ["newman"]
    },
    graduationYear: {
        type: Number,
        default: null
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    phoneConfirmed: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: false
    }

}, {timestamps: true})

const UserModel = mongoose.model('User',UserSchema)

module.exports = UserModel