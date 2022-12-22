var path = require('path');
var express = require('express');
var cors = require('cors');

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/scores");

var scoreSchema = new mongoose.Schema({
    name: String,
    score: Number,
});

var User = mongoose.model("User", scoreSchema);

var app = express();
var port = 3000;

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var dir = path.join(__dirname, '..', "Resources");
console.log("Static directory: " + dir);

app.options('*', cors());
app.use(cors());
app.use(express.static(dir));

app.post("/addscore", (req, res) => {
    console.log(req.body);
    var user = new User();
    user.name = req.body.name;
    user.score = req.body.score;
    user.save()
        .then(item => {
            console.log("item saved to database");
        })
        .catch(err => {
            res.status(400).send("unable to save to database");
        });
});

app.get('/getscores', (req, res) => {
    User.find({}, { _id: 0, __v: 0 })
        .sort({ score: -1 })
        .then(user => res.send({ users: user }))
        .catch(err => res.json(err));
});

app.use("/game", (req, res) => {
    res.sendFile(dir + "/HTML/game_page.html");
});

app.use("/", (req, res) => {
    res.sendFile(dir + "/HTML/homepage.html");
});

app.use("/home", (req, res) => {
    res.sendFile(dir + "/HTML/homepage.html");
});


app.listen(port, function () {
    console.log(`Listening on http://localhost:${port}/`);
});

