const express = require('express');
const paths = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const collection = require("./config");
//const  Collection } = require('mongoose');
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
 secret: 'yassu',
 resave: true,
 saveUninitialized: true
}));
app.get("/", (req, res) => {
	res.render("login");
});
app.get("/signup", (req, res) => {
	res.render("signup");
});
app.post("/signup", async (req, res) => {
	const data = {
		email: req.body.email,
		password: req.body.password
	}
	//Ayni kullanıcı adı varmı bak.
	const exitinguser = await collection.findOne({email: req.body.email});
	if(exitinguser){
		res.send("Kullanıcı zaten var. Lütfen başka kullanıcıyı seçin!");
	}else{
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(data.password, saltRounds);
		data.password = hashedPassword;
		const userdata = await collection.insertMany(data);
		console.log(userdata);
	}
})
app.post("/login", async (req, res) => {
	try{
		const check = await collection.findOne({email: req.body.email});
		if(!check){
			res.send("User cannot find!");
		}
		const isPassMatch = await bcrypt.compare(req.body.password, check.password)
		if(isPassMatch){
			res.render("home");
		}else {
			req.send("Wrong Password!");
		}
	}catch{
		res.send("Wrong Details");
	}
})
const port = 3000; // Replace with your desired port number
// MongoDB connection string
app.listen(port, ()=>{
	console.log(`Server running on Port: ${port}`);
})
