const Messages = require('./messages.js');
const users = require('./users.js');
const https = require('https');
const path = require('path');
const fs = require('fs');
const options = {
    key: fs.readFileSync( './192.168.1.3.key' ),
    cert: fs.readFileSync( './192.168.1.3.cert' ),
    requestCert: false,
    rejectUnauthorized: false
};
const express = require('express');
const app = express();
const server = https.createServer(options,app);
const io = require('socket.io')(server);
const ss = require('socket.io-stream');


const public = '../public';
const publicPath = path.resolve(__dirname,public);
const port = process.env.PORT || 443;
const host = '127.0.0.1';

server.listen(port);

app.use(express.static(publicPath));
app.get('/', (req, res) => {
    res.sendFile('index.html', {root: publicPath});
});

io.on('connection', (socket) => {
   const socketEvents = {
        chatmsgsend(data) {
            socket.emit('chatmsgsend', data);
            socket.broadcast.emit('chatmsgsend', data);
        },
        canvasToImage(data) {
            socket.broadcast.emit('canvasToImage', data);        
        },
        canvasToCanvas(data){
            socket.broadcast.emit('canvasToCanvas', data);        
        },
        cancelVideo(data){
            socket.broadcast.emit('cancelVideo', data);        
        },
        videoToVideo(data){
            socket.broadcast.emit('videoToVideo', data);        
        },
        test(data){
            socket.broadcast.emit('test', data);        
        }
    };
    socket.emit('welcome', Messages.welcome);
    socket.emit('chatusersend', users.userList);


    for (let eventName in socketEvents) {
        socket.on(eventName, socketEvents[eventName]);
    }

    socket.on('disconnect', () => {
        Messages.counter.count--;

        socket.broadcast.emit('counter', Messages.counter);
    });

    socket.on('chatUserAdd', (data) => {
        if (data.username) users.addUser(data);
        console.log('chatUserAdd', data);
        socket.emit('chatUserAdd', data);
        socket.broadcast.emit('chatUserAdd', data);
        socket.broadcast.emit('chatUserListUpdate', users.userList);
    });

    socket.on('chatuserdelete', (data) => {
        users.delUser(data);
    });


});


 console.log(`Server running at http://${host}:${port}`);