const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: String,
    topic: [String],
    participants: [String],
    description: String,
    administrator: String,
    groupDisplayPictureLink: String

}, { timestamps: true });

const Room = mongoose.model('Room', userSchema);

module.exports = {
    Room: Room
}