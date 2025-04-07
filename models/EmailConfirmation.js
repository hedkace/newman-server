const mongoose = require('mongoose')
const {Schema}  = mongoose

const EmailConfirmationSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    email: {
        type: String,
        require: true,
    },
    code: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now()+10*60000
    }

}, {timestamps: true})

const EmailConfirmationModel = mongoose.model('EmailConfirmation',EmailConfirmationSchema)

module.exports = EmailConfirmationModel