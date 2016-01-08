// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io');
var port = process.env.PORT || 2334;

io = io.listen(server);
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;
var msgs = [];
var rooms = {};
var users = {};
var users_n = 0;
var room_n = 1000;


//Object.prototype.length = function(){return Object.keys(this).length;};

io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('add user', function (nickname) {
        if (addedUser) return;

        // we store the username in the socket session for this client


        ++numUsers; addedUser = true;
        var id = users_n++;

        socket.nickname = nickname;
        socket.id = id;

        users[id] = {
            nickname: nickname
        }
        socket.emit('login', {
            numUsers: numUsers,
            msgs: msgs,
            id: id
        });
        socket.broadcast.emit('user joined', {
            username: nickname,
            numUsers: numUsers
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function (){
        if (addedUser) {
            --numUsers;
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.nickname,
                numUsers: numUsers
            });
        }
    });

    socket.on('change nickname', function(nickname){
        console.log(nickname);
        var id = socket.id;
        users[id] = {
            nickname: nickname
        }
        socket.nickname = nickname;
    });

    socket.on('new message', function (data) {

        msgs.push({
            nickname: socket.nickname,
            id: socket.id,
            message: data
        });
        /*if (msgs.length > 10){
        message
        }*/
        io.emit('new message', {
            nickname: socket.nickname,
            id: socket.id,
            message: data
        });
    });


    socket.on('create room', function(){
        var room_id = '' + room_n + '';

        rooms[room_id] = {
            room_owner: socket.id
        };
        io.emit('create room', {
            room_owner: socket.id,
            room_owner_nickname: socket.nickname,
            room_id: room_id
        });
        room_n++;
    });
    socket.on('join room', function(room_id){
        console.log(rooms);

        if (rooms[room_id] == null) {
            socket.emit('no room');
        }
        else{
            rooms[room_id].room_guest = socket.id;
            io.emit('find room', {
                room_owner: rooms[room_id].room_owner,
                room_guest: socket.id,
                room_guest_nickname: socket.nickname,
                room_id: room_id
            });
        }
    });
    socket.on('move', function(data){
        console.log(rooms[data.room_id]);
        if (data.user_id == rooms[data.room_id].room_owner) {
            data.user_id = rooms[data.room_id].room_guest;
        }
        else{
            data.user_id = rooms[data.room_id].room_owner;
        }
        io.emit('move', data);
   });

});
