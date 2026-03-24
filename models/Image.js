var mongoose = require("mongoose");

var Schema1 = mongoose.Schema;

var messageSchema1 = new Schema1({
    image: String,
    roomId: String,
    username: String,
    createdDate:  {type: Date, default: Date.now},
});

module.exports = mongoose.model("message", messageSchema1);