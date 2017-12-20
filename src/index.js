require('./polyfills.js');
import Vue from 'vue'
import User from './user.js';
const socket = io.connect();
const app = {};

app.init = function init() {

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

Vue.component('chat-session', {
    template: `
        <section class="chat__session">
            <output class="chat__session-messages">
            </output>
            <fieldset class="chat__session-messageField">
                <textarea class="chat__session-message" v-model="currentMessage">

                </textarea>
                <button class="chat__session-messageSend" v-on:click="sendMessage">Send</button>
            </fieldset>
        </section>
    `,
    data: function () {
        return {
            messages: app.state.messages,
            currentMessage: ''
        };
    },
    methods: {
        sendMessage: function () {
            const textMsg = this.currentMessage;
            const message = {user: app.state.currentUser, message: textMsg};

            socket.broadcast.emit('chatSessionMsgSend', message);
        }
    }
});


new Vue({
    el: '.chat'
});