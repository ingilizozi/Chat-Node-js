const mongoose = require("mongoose");
const { required } = require("nodemon/lib/config");
mongoose.set('strictQuery', false);
const connect = mongoose.connect("mongodb://" + process.env.DB_USER_NAME + ":" + process.env.DB_USER_PASSWORD + "@" + process.env.DB_URL + "/" + process.env.DB_NAME + "?retryWrites=true&w=majority");
//check database connected or not
connect.then(() => {
	console.log("Database connected Successfully");
})
.catch(() => {
	console.log("Database cannot be connected");
});
	console.log("readyState:", mongoose.connection.readyState);
const LoginSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	userlevel: {
		type: String,
		required: true
	},
	_2fa: {
		type: Boolean,
		required: true
	},
	secret: {
		type: String,
		required: false
	}
});
//Collection Part
const collection = new mongoose.model("users", LoginSchema);

module.exports = collection;