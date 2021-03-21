const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const dbUri = process.env.DB_URI
console.log(dbUri);


mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true }).
    catch(error => console.log(error))

app.listen('3000', () => {
    console.log("Listening");
});

