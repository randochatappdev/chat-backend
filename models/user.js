const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    alias: String,
    name: String,
    password: String,
    firstName: String,
    lastName: String,
    gender: String,
    preferredTopics: [String],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = {
    User: User
}