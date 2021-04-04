const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    alias: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        default: "Unstated"
    },
    displayPicture: {
        type: String,
        required: true
    },
    preferredTopics: [String],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = {
    User: User
}