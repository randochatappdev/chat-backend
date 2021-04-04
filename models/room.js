const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    topic: {
        type: [String],
        required: true
    },
    participants: {
        type: [String],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    administrator: {
        type: String,
        required: true
    },
    groupDisplayPictureLink: {
        type: String,
        required: true
    }

}, { timestamps: true });

const Room = mongoose.model('Room', userSchema);

module.exports = {
    Room: Room
}