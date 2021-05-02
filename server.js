const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const uniqid = require('uniqid');



const app = express();
app.use(cors());

// Socket.io initialization
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
    cors: {
        origin: "http://localhost:3000",
    }
});
httpServer.listen(4000, () => {
    console.log("Listening")
});

// Checks connection
io.use((socket, next) => {
    const sessionToken = socket.handshake.auth.session;
    const alias = socket.handshake.auth.alias;
    let sessionData = {};
    console.log("token", sessionToken)
    if (sessionToken) {
        jwt.verify(sessionToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next();



            User.findOne({ alias: decoded.sub }, (err, docs) => {
                if (err) return console.log("Error")
                console.log("docs", docs)

                if (docs) {
                    socket.sessionToken = sessionToken;
                    console.log("id", docs.socket_userID)

                    socket.userID = docs.socket_userID;

                    console.log("alias", docs.alias)
                    console.log()
                    socket.alias = docs.alias;
                    console.log("session", docs)
                    return next();
                }

            })
        });




    }


    next();
});

io.on("connection", (socket) => {
    // Send session details to client
    socket.emit("session", {
        sessionToken: socket.sessionToken,
        userID: socket.userID,
    })
    const users = [];
    for (let [userID, socket] of io.of("/").sockets) {
        console.log(socket.alias)
        users.push({
            userID: userID,
            alias: socket.alias,
        });
    }

    socket.emit("users", users);






    // notify existing users
    socket.broadcast.emit("user connected", {
        userID: socket.id,
        alias: socket.alias,
        messages: []
    });

    socket.on("private message", ({ content, to }) => {
        socket.to(to).emit("private message", {
            content,
            from: socket.id,


        });
    });

    socket.on("room message", ({ content, to }) => {
        socket.to(to).emit("room message", { content, from: socket.alias, room: to })
        console.log(content, socket.alias)

        let newMessage = new Message({ sender: socket.alias, room: to, content: { messageType: "text", body: content } })
        newMessage.save((err, docs) => {
            //if (!err)
            //return console.log(docs)

        });

        console.log('Great')
        console.log('---------------------------------------')




    });

    socket.on("join-rooms", (newRooms) => {
        newRooms.forEach((room) => {
            socket.join(room._id);
            console.log("Nice", room._id)
        })
    })


});









const AWS = require('aws-sdk');
const fs = require('fs');
const multer = require('multer');
const { uuid } = require('uuidv4');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})
const dbUri = process.env.DB_URI
console.log(dbUri);
app.use(express.json());

const storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, '')
    }
})

const upload = multer({ storage }).single('image')





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



        User.findOne({ alias: decoded.sub }, (err, docs) => {
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
app.get('/api/retrieveMessage/:id', (req, res) => {
    Message.find({ room: req.params.id }, (err, messages) => {
        if (!err) {
            return res.send(messages);

        }
        return console.log(err)

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
app.post('/api/topic', (req, res) => {
    Topic.create({
        name: req.body.name,
        description: req.body.description
    }, (err, small) => {
        if (err) {
            console.log(err);
            res.json({ error: err, status: "Error" })
        }
        else {
            res.json({ status: "Success" })
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
            res.json({ error: err, status: "Error" })
        }
        else {
            res.json({ docs: small, status: "Success" });
            console.log("Creating New Room Succesful!");
        }
    })
})


// Route for retrieving rooms linked to the logged in user
app.get('/api/rooms', (req, res) => {
    console.log(req.user)
    Room.find({ participants: req.user._id }, (err, docs) => {
        if (!err)
            return res.json(docs);
        return res.json(err);
    })
})

// Route for retrieving account information
app.get('/api/user', (req, res) => {
    User.find({ _id: req.user._id }, (err, docs) => {
        res.json(docs);

    })
})

// Route for retrieving topic information


// Route for adding topic preferences for a user
app.patch('/api/user/topics', (req, res) => {
    User.findOne({ _id: req.user._id }, (err, docs) => {
        docs.preferredTopics = req.body.preferredTopics;
        try {
            docs.save((err, docs) => {
                if (!err) return res.json({ status: "Success" })
                return res.json({ status: "Error" })
            })

        } catch (error) {
            res.json({ status: "Error" })
        }
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
            console.log(err)
            return res.json({ docs: docs, status: "Success" });
        }
        console.log(err)
        res.json({ err: err, status: "Failed" });

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
                socket_userID: uniqid(),
            }
            // Check if alias already exists 
            User.findOne({ alias: req.body.alias }, (err, docs) => {

                if (docs) return res.json({ error: "AliasAlreadyExists" });
                // Create user if alias does not exist in the database yet
                User.create(accountDetails, (err, small) => {
                    if (err) return res.json({ message: "Your credentials have not been saved. Please try again.", status: "Error" })
                    res.json({ message: "Your account has been successfully created. Please login.", status: "Success" });
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
    let token = jwt.sign({ sub: req.body.alias }, process.env.JWT_SECRET, { expiresIn: 3600 });

    authenticate(req.body, res, token);

})

// To logout - clear the tokens on the client side


// Authenticate function
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

                    return res.json({ jwt: "Bearer " + token, status: "Success", alias: requestBody.alias });
                }
                res.status(401).send("Incorrect credentials");

            });

        }
    }
    )
}




// Backend logic for image uploads
// Backend logic for image uploads

app.post('/upload', upload, (req, res) => {

    let myFile = req.file.originalname.split(".")
    const fileType = myFile[myFile.length - 1]

    // console.log(req.file)
    // res.send({
    //     message: 'Image upload is succesful!'
    // })

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuid()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, (err, data) => {
        if (err) {
            res.status(500).send(err)
        }

        res.status(200).send(data)
    })
})
