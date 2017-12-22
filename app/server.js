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
    messages: [],
    connections: 0
};

server.listen(port);

app.use(express.static(publicPath));
app.get('/', (req, res) => {
    res.sendFile('index.html', {root: publicPath});
});



io.on('connect', (socket)=> {

});



io.on('connection', (socket) => {
    const socketEvents = {
        chatSessionMsgSend(data) {
            socket.emit('chatSessionMsgSend', data);
            state.messages.push(data);
            socket.broadcast.emit('chatSessionMsgSend', data);
        },
        chatStateAddUser(user) {
            const existingUsers = state.users.filter(userEl =>  userEl.timeCreated == user.timeCreated);

            user.socketId = socket.id;
            state.users.push(user);
            socket.broadcast.emit('chatStateUserAdded', user);
            socket.emit('chatStateUserAdded', user);
            

        },
        chatStateUpdateUser(user) {
            const userIdx = state.users.findIndex(el => {
                return el.timeCreated == user.timeCreated;
            });

            if (userIdx != -1) {
                state.users[userIdx] = user;
                socket.broadcast.emit('chatStateUserUpdated', user);
                socket.emit('chatStateUserUpdated', user);
            }

        },
        chatStateDelUser(user) {
            if (state.users.indexOf(user) != -1) {
                state.users.splice(state.users.indexOf(user), 1);
                socket.broadcast.emit('chatStateUserAdded', user);
            }
        },
        disconnect(evt) {
            state.connections--;
            console.group();
            console.log('disconnect');
            console.log("connections:", state.connections);
            console.groupEnd();
            let i = state.users.length;


        }
    };
    state.connections++;
    for (let eventName in socketEvents) {
        socket.on(eventName, socketEvents[eventName]);
    }

    socket.emit('serverChatState', state);
});




 console.log(`Server running at http://${host}:${port}`);