var socket = io();

let AREA_CHANGE_USERNAME = document.getElementById("areaJoinRoom");
let AREA_ROOM_SCREEN = document.getElementById("areaRoomScreen");

let TXT_USERNAME = document.getElementById("txtUsername");
let TXT_ROOM_ID = document.getElementById("txtRoomId");

let TXT_ROOM_USERS = document.getElementById("txtRoomUsers");
let TXT_WELCOME_ROOM = document.getElementById("txtWelcomeRoom");
let TXT_MESSAGE = document.getElementById("txtMessage");
let MESSAGE_LIST = document.getElementById("messageList");
let IMG_MESSAGE = $("#imageFile");

socket.on('total_user_count', (msg) => {
    document.getElementById("txtTotalUserCount").innerHTML = msg;
});
socket.on('room_users', (msg) => {
    document.getElementById("txtRoomUserCount").innerHTML = msg.length;
    TXT_ROOM_USERS.innerHTML = ""
    msg.forEach(element => {
        var item = document.createElement('li');
        item.textContent = element.username;
        item.className = "list-group-item";
        if(element.id == socket.id){
            item.textContent += " (Sen)";
        }
        TXT_ROOM_USERS.appendChild(item);
    });
});
socket.on('send_message', (msg) => {
    let messageContent = " <p class='card'><b>" + msg.username + ": </b>" + msg.message + "</p>";
    MESSAGE_LIST.innerHTML = messageContent + MESSAGE_LIST.innerHTML;
});

socket.on('old_messages', (msg) => {
    msg.forEach(element => {
        let messageContent = " <p class='card'><b>" + element.username + ": </b>" + ((element.content == undefined) ? "" : element.content) + "</b>" + ((element.image == undefined) ? "" : "<img src='" + element.image + "' style='width:300px'>" + "</p>");
        MESSAGE_LIST.innerHTML = messageContent + MESSAGE_LIST.innerHTML;
    });
});
/* CHANGE USERNAME */
function joinGame() {
    if(TXT_ROOM_ID.value.length > 1){
        socket.emit('join_room', {
            username: TXT_USERNAME.value,
            room_id: TXT_ROOM_ID.value
        });
        AREA_CHANGE_USERNAME.style.display = "none";
        AREA_ROOM_SCREEN.style.display = "block";
        TXT_WELCOME_ROOM.innerHTML = TXT_ROOM_ID.value + " Odasina Hosgeldiniz.";
    }
}
function sendMessage(){
    if(TXT_MESSAGE.value.length > 1) {
        socket.emit('send_message', {
            username: TXT_USERNAME.value,
            room_id: TXT_ROOM_ID.value,
            message: TXT_MESSAGE.value
        });
        TXT_MESSAGE.value = "";
    }
}
function sendImage() {
    // Sunucuya gönder
    socket.emit('send_image', { 
        username: TXT_USERNAME.value, 
        room_id: TXT_ROOM_ID.value,
        image: 'SELAM'
    });
};
$(IMG_MESSAGE).change( function () {
  //const file = this.files[0];
    var file = $('input[type=file]')[0].files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file); // Görseli Base64 stringine çevirir
    reader.onload = function (event) {
      const imageData = event.target.result;
      // Sunucuya gönder
      socket.emit('send_image', {
          username: TXT_USERNAME.value,
          room_id: TXT_ROOM_ID.value,
          image: imageData 
      });
    }
    reader.onerror = function (event) {
        console.log('Error reading file: ', event);
    }
});
/* SEND IMAGE */
socket.on('send_image', (data) => {
  // Görseli herkese yayınla
  let messageContent = " <p class='card'><b>" + data.username + ": </b>" + "<img src='"+data.image + "' style='width:350px'></img>" + "</p>";
  MESSAGE_LIST.innerHTML = messageContent + MESSAGE_LIST.innerHTML;
});
function exitChat(){
    $.post("/logout", {});
    document.location = "/";
}
Array.from(document.getElementsByClassName("badge")).forEach(element => {
    element.addEventListener("click", function(){
        TXT_ROOM_ID.value = element.innerHTML;
    });
});