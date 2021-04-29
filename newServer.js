const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })



const app = express();
app.use(cors());

const dbUri = process.env.DB_URI
console.log(dbUri);
app.use(express.json());

app.listen('4000', () => {
    console.log("Listening");
});

mongoose.set('useFindAndModify', false);
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true }).
    then(() => { console.log("Connected") })
    .catch(error => console.log(error))



//For testing only 
// let Message = require('./models/message.js').Message;
// Message.create({ sender: '60586431ebc27002f993b846', room: '6058797a3799dd0481ad8ff6', content: { type: 'text', body: "Don't worry much if the side effects are mild" } }, (err, small) => {
//     if (err) return console.log(err)
//     console.log("Saved");
// });



// Use authorization middleware with routes that need to be protected
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
let Room = require('./models/room.js').Room;
let Message = require('./models/message.js').Message;
const message = require('./models/message.js');

// API endpoint protection
app.use('/api', auth, (req, res, next) => {
    next();
})

// Test route for fetching all users
app.get('/api/users', (req, res) => {
    User.findOne({}, (err, docs) => {
        res.json(docs);
    })

})


// Route to retrieve topics from database
app.get('/topics', (req, res) => {
    Topic.find({}, (err, topics) => {
        res.send(topics);
    })
})

// Route for retrieving account information
app.get('/api/retrieveInfo', (req, res) => {
    res.json(req.user)
})


// Route for retrieving messages from a certain room
app.get('/api/retrieveMessage', (req, res) => {
    Message.find({ room: req.body.room }, (err, retrieveMessage) => {
        res.send(retrieveMessage);
    })

})


// Route for saving new messages to database
app.post('/api/message', (req, res) => {
    let newMessage = new Message({ sender: req.body.sender, room: req.body.room, content: { messageType: req.body.content.messageType, body: req.body.content.body } })
    newMessage.save((err, docs) => {
        if (!err)
            return res.json({ docs })
        res.json(err)
        console.log(err)
    });
})


// Routes for retrieving rooms
app.get('/retrieveRoom', (req, res) => {
    Room.find({}, (err, retrieveRoom) => {
        res.send(retrieveRoom);
    })
})

// Route for creating a new topic and saving the accompanying details to the database
app.post('/createTopics', (res, req) => {
    Topic.create({
        name: res.body.name,
        description: res.body.description
    }, (err, small) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Success");
        }
    });
})

// Route for creating new room and saving the accompanying details to the db
app.post('/api/room', (req, res) => {
    Room.create({
        name: req.body.name,
        topic: req.body.topic,
        participants: req.body.participants,
        description: req.body.description,
        administrator: req.user._id,
        groupDisplayPictureLink: req.body.groupDisplayPictureLink
    }, (err, small) => {
        if (err) {
            console.log(err);
        }
        else {
            res.json(small);
            console.log("Creating New Room Succesful!");
        }
    })
})


// Route for retrieving rooms linked to the logged in user
app.get('/api/rooms', (req, res) => {
    Room.find({ participants: req.user._id }, (err, docs) => {
        if (!err)
            return res.json(docs);
        return res.json(err);
    })
})

// Route for retrieving account information
app.get('/api/user', (req, res) => {
    User.find({ alias: req.user.alias }, (err, docs) => {
        res.json(docs);
    })
})

// Route for adding topic preferences for a user
app.patch('/api/user/topics', (req, res) => {
    User.find({ _id: req.user._id }, (err, docs) => {
        res.json(docs.preferredTopics);
    })
})

// Route for displaying rooms by topic preferences of the uesr
app.get('/api/user/room', (req, res) => {
    Room.find({ topic: req.body.topic }, (err, docs) => {
        res.json(docs);
    })
})

// Route for modifying account information
app.patch('/api/user/', (req, res) => {
    console.log(req.body)
    User.findOneAndUpdate({ _id: req.user._id }, { preferredTopics: req.body.preferredTopics }, (err, docs) => {
        if (!err) {
            return res.json(docs)

        }
        res.json(err)
    })
})

// Route for adding new users to a room
app.patch('/api/room', (req, res) => {
    Room.findOneAndUpdate({ _id: req.body._id }, { $push: { participants: req.user._id } }, (err, docs) => {
        if (!err) {
            return res.json(docs);
        }

        res.json(err);

    })
})

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
            User.findOne({ alias: req.body.alias }, (err, docs) => {

                if (docs) return res.json({ error: "AliasAlreadyExists" });
                // Create user if alias does not exist in the database yet
                User.create(accountDetails, (err, small) => {
                    if (err) return res.json({ message: "Your credentials have not been saved. Please try again.", status: err })
                    res.json({ message: "Your account has been successfully created. Please login." });
                })
            })



        })
    });




});


// Login route
app.post('/login', (req, res) => {

    // Authenticate user

    // USE REFRESH TOKENS
    //!!!!!!!!!!!!!!!!!!!!!
    let token = jwt.sign({ sub: req.body.username }, process.env.JWT_SECRET, { expiresIn: 3600 });

    authenticate(req.body, res, token);

})

// To logout - clear the tokens on the client side



function authenticate(requestBody, res, token) {
    User.findOne({ alias: requestBody.alias }, (err, user) => {
        console.log(requestBody.alias, requestBody.password)

        // Execute if user does not exist
        if (user === null) {
            console.log("sad")
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
    }
    )
}




// Backend logic for image uploads