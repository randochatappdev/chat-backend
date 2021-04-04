const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    sender: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    content: {
        type: Object,
        required: true
    }

}, { timestamps: true });

const Message = mongoose.model('Message', userSchema);

module.exports = {
    Message: Message
}