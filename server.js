const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const app = express();
const dbUri = process.env.DB_URI
console.log(dbUri);
app.use(express.json());

app.listen('4000', () => {
    console.log("Listening");
});

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true }).
    then(() => { console.log("Connected") })
    .catch(error => console.log(error))

/* For testing only 
let Message = require('./models/message.js').Message;
Message.create({ sender: '60586431ebc27002f993b846', room: '6058797a3799dd0481ad8ff6', content: { type: 'text', body: "Don't worry much if the side effects are mild" } }, (err, small) => {
    if (err) return console.log(err)
    console.log("Saved");
});*/



// Middleware
const auth = function (req, res, next) {

    try {
        if (req.headers.authorization.slice(0, 6) !== "Bearer") {
            console.log("Error")
            req.user = null;
            return res.status(401).send("Unauthorized");

        }
    } catch (err) {
        console.log("Noeee")
        req.user = null;
        return res.status(401).send("Unauthorized");


    }


    let jwtoken = req.headers.authorization.slice(7);

    jwt.verify(jwtoken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send("Incorrect credentials");



        User.findOne({ username: decoded.sub }, (err, docs) => {
            if (err) return res.status(401).send("Incorrect credentials");
            req.user = docs;
            next();


        })
    });



}

let User = require('./models/user.js').User;
let Topic = require('./models/topic.js').Topic;

app.get('/users', (req, res) => {
    User.find({}, (err, users) => {
        res.send(users);
    })

});

app.get('/topics', (req, res) => {
    Topic.find({}, (err, topics) => {
        res.send(topics);
    })
});

app.post('/topic', (res, req) => {
    let err;
    Topic.create({ name: res.body.name, description: res.body.description }, (err, small) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Success");
        }
    });

}
)








// Auth tests

// Sign-up route
app.post('/register', (req, res) => {


    // Enter form details
    let password = req.body.password;
    let hashedPassword;
    // Hash

    let saltRounds = 10;

    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(password, salt, function (err, hash) {
            if (err) res.json({ message: "Error processing your credentials. Please try again." })
            // Enter details into DB
            let accountDetails = {
                alias: req.body.alias,
                password: hash,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                gender: req.body.gender,
                displayPicture: req.body.displayPicture,
                preferredTopics: req.body.preferredTopics
            }
            // Check if alias already exists 
            User.findOne({ alias: req.body.alias }, (err, small) => {
                if (!err) return res.json({ error: "AliasAlreadyExists" });
                // Create user if alias does not exist in the database yet
                User.create(accountDetails, (err, small) => {
                    if (err) return res.json({ message: "Your credentials have not been saved. Please try again.", status: err })
                    res.json({ message: "Your account has been successfully created." });
                })
            })



        })
    });




});



// Login route
app.post('/login', (req, res) => {

    // Authenticate user

    let token = jwt.sign({ sub: req.body.username }, process.env.JWT_SECRET, { expiresIn: 30 });

    // Use bcrypt to encrypt passwords
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    authenticate(req.body, res, token);

})


function authenticate(requestBody, res, token) {
    User.findOne({ alias: requestBody.alias }, (err, user) => {


        // Execute if user does not exist
        if (user === null) {
            res.status(401).send("Incorrect credentials");


            // Execute if the credentials match an existing user
        } else {

            // Execute if the password is incorrect
            bcrypt.compare(requestBody.password, user.password, function (err, result) {
                if (result) {
                    return res.json({ jwt: "Bearer " + token, status: "Success" });
                }
                res.status(401).send("Incorrect credentials");

            });

        }
        // EXPIRE TOKEN
        // !!!!!!!!!!!!!!

    }






    )
}



// Authorization test
app.use('/api/', auth, (req, res) => {
    User.findOne({}, (err, docs) => {
        res.json(docs);
    })

})






