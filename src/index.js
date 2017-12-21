require('./polyfills.js');
import Vue from 'vue'
import User from './user.js';
import Message from './message.js';
const socket = io.connect();
const app = {};

app.init = function init() {
    socket.on('connect', ()=>{
        console.log('you connected');
    });
    app.bindSocketEvents();
};

app.data = {
    codec: 'video/webm; codecs="vp8"'
};

app.state = {
    messages: [],
    users: [new User('taco'), new User('paco')],
    currentUser: JSON.parse(localStorage.getItem('app-currentUser')) || {username: ''}
};

Vue.component('chat-user-item', {
    props: ['username'],
    template: `
        <li class="userList__item>{{username}}</li>
    `,
});

Vue.component('chat-users', {
    template: `
        <section class="chat__users">
            <fieldset class="chat__users-current">
                <fieldset class="chat__users-userField">
                    <label for="currentUser" class="chat__users-userField-label"> Your Username
                    <input id="currentUser" type="text" v-model="currentUser.username" />
                    </label>
                    <button class="chat__users-userField-submit" v-on:click="addUser">Submit</button>
                </fieldset>
            </fieldset>
            <ul class="chat__users-list userList">
                <li v-for="user in users">{{user.username}}</li>
            </ul>
        </section>
    `,
    data: function () {
        return {
            users: app.state.users,
            currentUser: app.state.currentUser
        };
    },
    methods: {
        addUser: function () {
            const username = this.currentUser.username;
            const newUser = new User(username);
            
            app.state.users.push(newUser);
            app.state.currentUser = newUser;

            this.saveUser(newUser);

        },
        saveUser: function (user) {
            localStorage.setItem('app-currentUser', JSON.stringify(user));
        }
    }
});

Vue.component('chat-message', {
    template: `
    <blockquote class="chatMessage">
        <p>{{message.content}}</p>
    <cite class="chatMessage__user">{{message.user.username}}</cite>
    </blockquote>
    `,
    props: ['message']

});

Vue.component('chat-session', {
    template: `
        <section class="chat__session">
            <output class="chat__session-messages">
                <chat-message v-for="(message,index) in messages"
                v-bind:message="message"
                v-bind:index="index"
                v-bind:key="message.timeCreated"
                >
                </chat-message>
            </output>
            <div class="chat__session-messageField">
                <textarea class="chat__session-message" v-model="currentMessage" v-on:keyup="readMessage">

                </textarea>
                <button class="chat__session-messageSend" v-on:click="sendMessage">Send</button>
            </div>
        </section>
    `,
    data: function () {
        return {
            get messages() {
                return app.state.messages;
            },
            currentMessage: ''
        };
    },
    methods: {
        sendMessage: function () {
            const textMsg = this.currentMessage;
            const message = new Message(textMsg, app.state.currentUser);

            console.log('sending Message', message);
            socket.emit('chatSessionMsgSend', message);

            this.currentMessage = '';
        },
        readMessage: function (evt) {
            if (evt.which == 13) {
                this.sendMessage();
            }
        }
    },
    watch: {
        messages: function (newMessages) {
            console.log("there's new messages!");
        }
    },
    beforeMount () {
        this.messages = app.state.messages;
    }

});


new Vue({
    el: '.chat'
});

app.socketCallbacks = {
    chatSessionMsgSend(message) {
        app.state.messages.push(message);
    },
    chatSessionConnect(messages){
        console.log('got chatSessionConnect', messages);
        app.state.messages = messages;
    }
};

app.bindSocketEvents = function () {
    for (let eventName in app.socketCallbacks) {
        socket.on(eventName, app.socketCallbacks[eventName]);
    }
};

app.init();