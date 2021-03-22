const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    sender: String,
    room: String,
    content: {},

}, { timestamps: true });

const Message = mongoose.model('Message', userSchema);

module.exports = {
    Message: Message
}