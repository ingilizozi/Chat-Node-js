//process.env.TZ = 'Europe/Nicosia';
//console.log('Current Time Zone:', process.env.TZ);
/*const { NtpTimeSync } = require('ntp-time-sync');

// Artık NtpTimeSync bir constructor'dır:
const ntp = new NtpTimeSync(); 

async function zamanıAl() {
    const zaman = await ntp.getTime();
    console.log('NTP Zamanı:', zaman);
}
zamanıAl();
*/
const mongoose = require("mongoose");
const router = require('express').Router();
const express = require('express');
const fs = require('fs');
const app = express();
app.set("view engine", "ejs");
const http = require('https');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const server = http.createServer({
     key: fs.readFileSync('cert/privkey.pem'),
     cert: fs.readFileSync('cert/fullchain.pem')
},app);
const { Server } = require("socket.io");
const io = new Server(server);
require('dotenv').config()
const collection = require("./src/config");
const TableMessage = require("./models/Message");
//2F Kimlik doğrulama
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const Tfa = false;
// gzip/deflate outgoing responses
const compression = require('compression');
app.use(compression());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(multer().array());
app.use(express.static('public'));
app.use(session({
 secret: process.env.SECRET_ID,
 resave: false,
 saveUninitialized: false,
 cookie: { httpOnly:true, secure: true, maxAge: 2 * 60 * 60 * 1000 } // 2 hours
}));
app.get('/', (req, res) => {
res.redirect('/login')
});
app.get("/login", (req, res) => {
  if (!req.session.user) {
    return res.render("login");
  }
  if(req.session.userlevel === "Admin"){
    res.redirect("/admin");
  }else if(req.session.userlevel === "User"){
    res.redirect("/user");
  }
})
app.post("/login", async (req, res) => {
		const checkUser = await collection.findOne({email: req.body.email});
		if(!checkUser){
			res.status(409).send("<p>Böyle bir kullanıcı yok!</p></br><a href='/login'>Başka Kullanıcı dene</a>");
		}
	try{
		const isPassMatch = await bcrypt.compare(req.body.password, checkUser.password)
		if(isPassMatch){
      req.session.user = {
        id: checkUser.id,
        username: checkUser.email,
        userlevel: checkUser.userlevel
      };
    if(checkUser._2fa){
      res.redirect("/login2fa")
    }
    } else {
			  res.status(409).send("<p>Yanlış Şifre!</p></br><a href='/login'>Başka şifre dene.</a>");
    }
      if(checkUser.userlevel === "Admin"){
        res.redirect("/admin");
      }else if(checkUser.userlevel === "User"){
			  res.redirect("/user");
      }else if(checkUser.userlevel === "Editor"){
        res.redirect("/editor");
      }
	}catch{
	}
})
app.get("/login2fa", (req, res) => {
  if (!req.session.user) {
    return res.status(409).redirect("/login");
  }
  res.render("login_2fa");
})
app.post("/login2fa", async (req, res) => {
		const checkToken = await collection.findOne({email: req.session.user.username});
    const verified = speakeasy.totp.verify({
        secret: await checkToken.secret,
        encoding: 'base32',
        token: await req.body.token
    });
    if (verified) {
      if(checkToken.userlevel === "Admin"){
        res.redirect("/admin");
      }else if(checkToken.userlevel === "User"){
			  res.redirect("/user");
      }else if(checkToken.userlevel === "Editor"){
        res.redirect("/editor");
      }
		}else {
			  res.send("<p>Yanlış Kod!</p></br><a href='/login2fa'>Başka kod girin.</a>");
		}
})
app.get("/admin", (req, res) => {
  if (!req.session.user) {
    return res.status(409).redirect("/login");
  }
  res.render("admin");
})
app.get("/signup", (req, res) => {
  if (!req.session.user) {
    return res.status(409).redirect("/login");
  }
	res.render("signup");
});
app.post("/signup", async (req, res) => {
  if (!req.session.user) {
    return res.status(409).redirect("/login");
  }
  var _2fa = 'false';
  var secret = '';
	//Ayni kullanıcı adı varmı bak.
	const exitinguser = await collection.findOne({email: req.body.email});
	if(exitinguser){
		res.send("<p>Kullanıcı zaten var. Lütfen başka kullanıcıyı seçin! <a href='/signup'>Geri Dön</a></p>");
	}
        if(req.body._2fa != undefined || req.body._2fa != null){
          _2fa = req.body._2fa;
        }
        if(_2fa === 'true'){
        // 1. Kullanıcı için gizli anahtar (secret) üret
         secret = speakeasy.generateSecret({ name: "OzoxChat" });
         // 2. otpauth URL'ini oluştur (authenticator uygulamalarının okuyacağı format)
          // secret.otpauth_url kullanılarak QR kodu üretilir
          try {
              const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
              // 3. QR kodu ve gizli anahtarı kullanıcıya döndür
              // NOT: secret.base32'yi veritabanına kaydetmelisiniz!
                res.send(`
                    <h1>2FA Kurulumu</h1>
                    <img src="${qrCodeUrl}" />
                    <!--p>Secret: ${secret.base32}</p-->`);
	            const data = {
	            	          email: req.body.email,
	            	          password: req.body.password,
                          userlevel:req.body.userLevel,
                          _2fa: _2fa,
                          secret: secret.base32
              	    }
	            const saltRounds = 10;
	            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
	            data.password = hashedPassword;
	            const userdata = await collection.insertMany(data);
	            console.log(userdata);
          } catch (err) {
              res.status(500).send("<p>QR kod üretilemedi! <a href='/signup'>Geri Dön</a></p>");
          }
        }else {
	            const data = {
	            	email: req.body.email,
	            	password: req.body.password,
                userlevel:req.body.userLevel,
                _2fa: _2fa,
                secret: secret
              	}
	            	const saltRounds = 10;
	            	const hashedPassword = await bcrypt.hash(data.password, saltRounds);
	            	data.password = hashedPassword;
	            	const userdata = await collection.insertMany(data);
	            	console.log(userdata);
        }
  })
app.get("/edit", async (req, res) => {
  if (!req.session.user) {
    return res.status(409).redirect("/login");
  }
  if (req.session.user.userlevel == "Admin"){
    try {
        const users = await collection.find({}); // Tüm kullanıcıları getir
        res.render("edit", {userList:users});
    } catch (err) {
        res.status(500).send(err);
    }
  }else {
    const lowString = req.session.user.userlevel;
    res.redirect(lowString.toLowerCase());
  }
})
app.post("/edit", async (req, res) => {
  if (!req.session.user) {
    return res.status(409).redirect("/login");
  }
  var _2fa = 'false';
  var filter = {email: req.body.email};
  var secret = '';
   if(req.body._2fa != undefined || req.body._2fa != null){
      _2fa = req.body._2fa;
    }else console.log("_2fa is NULL!");
  if(_2fa === 'true'){
    // 1. Kullanıcı için gizli anahtar (secret) üret
    secret = speakeasy.generateSecret({ name: "OzoxChat" });
     // 2. otpauth URL'ini oluştur (authenticator uygulamalarının okuyacağı format)
    // secret.otpauth_url kullanılarak QR kodu üretilir
    try {
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        // 3. QR kodu ve gizli anahtarı kullanıcıya döndür
        // NOT: secret.base32'yi veritabanına kaydetmelisiniz!
          res.send(`
              <h1>2FA Kurulumu</h1>
              <img src="${qrCodeUrl}" />
              <!--p>Secret: ${secret.base32}</p-->`);
        const updateData = {
          $set: {
	      	email: req.body.email,
	      	password: req.body.password,
          userlevel:req.body.userLevel,
          _2fa: _2fa,
          secret: secret.base32
          }
        }
  	    const saltRounds = 10;
		    const hashedPassword = await bcrypt.hash(updateData.$set.password, saltRounds);
		    updateData.$set.password = hashedPassword;
        const result = await collection.updateMany(filter, updateData);
        console.log(`${result.matchedCount} belge eşleşti, ${result.modifiedCount} belge güncellendi.`);
    } catch (err) {
        res.status(500).send("<p>QR kod üretilemedi! Hata: " + err + "<a href='/edit'> Yenile</a></p>");
    }
  }else {
    const updateData = {
      $set: {
	  	    email: req.body.email,
	  	    password: req.body.password,
          userlevel:req.body.userLevel,
          _2fa: _2fa,
          secret: secret
      }
    }
  	const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(updateData.$set.password, saltRounds);
		updateData.$set.password = hashedPassword;
    try {
        const result = await collection.updateMany(filter, updateData);
        console.log(`${result.matchedCount} belge eşleşti, ${result.modifiedCount} belge güncellendi.`);
    }catch (err) {
      res.status(500).send("<p>Kullanıcı düzenlemede bir sorun oluştu! Hata: " + err + " <a href='/edit'> Yenile</a></p>");
    }
  }
  setTimeout(() => {
    res.redirect('/admin');
  }, 3000);
})
app.get("/user", (req, res) => {
  if (!req.session.user) {
    return res.status(409).redirect("/login");
  //res.status(401).json({ message: 'Unauthorized' });
  }
  res.render("user");
});
app.get("/logout", async(req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.redirect("/login");
    //res.json({ message: 'Logout successful' });
  });
})
app.post("/logout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    //res.json({ message: 'Logout successful' });
  });
});
let allUsers = [];
io.on('connection', (socket) => {
    allUsers.push({
        id: socket.id,
        username: 'default',
        room_id: "0"
    });
    io.emit('total_user_count', allUsers.length);
    socket.on('join_room', (msg) => {
      let findIndex = allUsers.findIndex( item => item.id === socket.id );
      allUsers[findIndex] = {
        id: socket.id,
        username: msg.username,
        room_id: msg.room_id
      } 
      socket.join(msg.room_id);
      io.in(msg.room_id).emit('room_users', allUsers.filter(x => x.room_id == msg.room_id));
      TableMessage.find({
        roomId: msg.room_id
      }).then((messages) => {
        io.to(socket.id).emit('old_messages', messages);
      }).catch((err) => {
        console.log(err);
      });
    });
    socket.on("send_message", (msg) => {
      io.in(msg.room_id).emit('send_message', msg);
      new TableMessage({
        content: msg.message,
        image: "",
        roomId: msg.room_id,
        username: msg.username,
      }).save();
    });
    socket.on("send_image", (msg) => {
      io.emit("send_image", msg);
      new TableMessage({
        content: "",
        image: msg.image,
        roomId: msg.room_id,
        username: msg.username
      }).save();
    });
    socket.on('disconnect', () => {
        let removeIndex = allUsers.findIndex( item => item.id === socket.id );
        let findRoomId = allUsers[removeIndex].room_id;
        allUsers.splice(removeIndex, 1);

        io.emit('total_user_count', allUsers.length);
        io.in(findRoomId).emit('room_users', allUsers.filter(x => x.room_id == findRoomId));
    });
});
server.listen(3000, () => {
  console.log('Server listening on *:3000');
});