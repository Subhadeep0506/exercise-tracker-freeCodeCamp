const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const User = require("./schema/User");
const Exercise = require("./schema/Exercise");

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dbConnection = mongoose.connection;

dbConnection.on("error", () => {
  console.error.bind(console, "MongoDB connection has an error!");
});

dbConnection.once("open", () => {
  console.log("MongoDB Connected Successfully!");
});

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Adding new User
app.post("/api/users", async (req, res) => {
  if (req.body.username === "")
    return res.json({ message: "username field cannot be empty." });

  const userExists = await User.findOne({ username: req.body.username });

  if (!userExists) {
    let newUser = new User({
      username: req.body.username,
    });
    await newUser.save();
    return res.json({
      username: newUser.username,
      _id: newUser._id,
    });
  } else {
    return res.json({
      username: userExists.username,
      _id: userExists._id,
    });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    let allUsers = await User.find({});
    return res.json(allUsers);
  } catch (err) {
    return res.json({
      error: err.message,
    });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const _id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date =
    req.body.date === undefined ? new Date() : new Date(req.body.date);

  if (!description || !duration) {
    return res.json({
      message: "description and duration are required.",
    });
  }
  if (isNaN(duration)) {
    return res.json({
      message: "Duration must be a number.",
    });
  }
  if (date.toString() === "Invalid Date") {
    return res.json({
      message: "Date is not valid.",
    });
  }
  const user = await User.findById(_id);
  if (!user) {
    return res.json({ error: "User don't exist." });
  }

  const newLog = new Exercise({
    userid: _id,
    description,
    duration,
    date,
  });

  await newLog.save();

  return res.json({
    username: user.username,
    description: newLog.description,
    duration: newLog.duration,
    date: newLog.date.toDateString(),
    _id: user._id,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const _id = req.params._id;
  let { from, to, limit } = req.query;

  const fetchUser = await User.findById(_id);
  if (!fetchUser) {
    return res.json({
      message: "User not found.",
    });
  }
  var filter = { userid: _id };

  if (from && to) {
    if (from.toString() === "Invalid Date" || to.toString() === "Invalid Date")
      return res.json({
        message: "Invalid date format.",
      });
    filter = {
      userid: _id,
      date: {
        $gte: from,
        $lte: to,
      },
    };
  } else if (from) {
    if (from.toString() === "Invalid Date")
      return res.json({
        message: "Invalid date format.",
      });
    filter = {
      userid: _id,
      date: {
        $gte: from,
      },
    };
  } else if (to) {
    if (to.toString() === "Invalid Date")
      return res.json({
        message: "Invalid date format.",
      });
    filter = {
      userid: _id,
      date: {
        $lte: to,
      },
    };
  }

  if (limit) {
    limit = parseInt(limit);
    if (isNaN(limit)) {
      return res.json({
        message: "Limit must be a number.",
      });
    }
  } else {
    limit = 0;
  }

  let filteredLogs = await Exercise.find(filter).limit(limit);

  filteredLogs = filteredLogs.map((log) => {
    return {
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString(),
    };
  });

  return res.json({
    username: fetchUser.username,
    count: filteredLogs.length,
    _id: fetchUser._id,
    log: filteredLogs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
