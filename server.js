const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');


const app = express();
const dbUri = process.env.DB_URI
console.log(dbUri);

app.listen('3000', () => {
    console.log("Listening");
});

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true }).
    then(() => { console.log("Connected") })
    .catch(error => console.log(error))

/* For testing only */
let Message = require('./models/message.js').Message;
Message.create({ sender: '60586431ebc27002f993b846', room: '6058797a3799dd0481ad8ff6', content: { type: 'text', body: "Don't worry much if the side effects are mild" } }, (err, small) => {
    if (err) return console.log(err)
    console.log("Saved");
});



