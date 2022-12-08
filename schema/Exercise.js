const mongoose = require("mongoose");

const Exercise = mongoose.model(
  "Exercise",
  new mongoose.Schema({
    userid: String,
    username: String,
    description: String,
    duration: Number,
    date: { type: Date, default: Date.now },
  })
);

module.exports = Exercise;
