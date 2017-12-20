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

const state = {
    users: [],
    messages: []
};

server.listen(port);

app.use(express.static(publicPath));
app.get('/', (req, res) => {
    res.sendFile('index.html', {root: publicPath});
});



io.on('connection', (socket) => {
   const socketEvents = {
        chatSessionMsgSend(data) {
            socket.emit('chatSessionMsgSend', data);
            console.log('got message', data);
            state.messages.push(data);
            socket.broadcast.emit('chatSessionMsgSend', data);
        },

    };
    socket.emit('welcome', Messages.welcome);
    socket.emit('chatusersend', users.userList);


    for (let eventName in socketEvents) {
        socket.on(eventName, socketEvents[eventName]);
    }




});


 console.log(`Server running at http://${host}:${port}`);