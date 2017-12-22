require('./polyfills.js');
import Vue from 'vue';
import User from './user.js';
import Message from './message.js';
import Store from './store.js';

const socket = io.connect();
const app = {};

app.store = Store;
app.init = function init() {
    app.bindSocketEvents();
};

app.data = {
    codec: 'video/webm; codecs="vp8"'
};

Vue.component('chat-user-item', {
    props: ['user'],
    template: `
        <li class="userList__item">{{user.username}}</li>
    `,
});

Vue.component('user-take-pic',  {
    template: `
        <fieldset class="chat__users-userPic userPic">
            <button class="userPic__start" v-on:click="startVideo">Add Your Photo</button>
            <div class="userPic__camera-container camera-container" v-if="isRecording">
                <section class="userPic__camera camera" >
                    <div class="camera__self">
                        <video class="camera__video" 
                        v-on:play="videoPlay" 
                        v-on:click="takePicture" 
                        autoplay>
                            <source v-if="isRecording" :src="videoSrc" :type="type">
                        </video>
                        <button class="camera__record" v-on:click="takePicture">Take Picture</button>
                    </div>
                    <canvas class="camera__canvas" v-bind:width="videoWidth" v-bind:height="videoHeight"></canvas>
                    <a href="#" class="camera__close" v-on:click="closeCamera">x</a>
                </section>
            </div>
        </fieldset>
    `,
    data: function () {
        return {
            isRecording: false,
            stream: '',
            videoSrc: '',
            type: 'video/mp4',
            videoWidth: 0,
            videoHeight: 0,
            userPicture: app.store.state.currentUser.photo
        };
    },
    methods: {
        startVideo: function () {
            navigator.mediaDevices.getUserMedia({video:true, audio:false})
            .then((stream) => {
                this.isRecording = true;
                this.videoSrc = URL.createObjectURL(stream);
                this.stream = stream;
            });
        },
        videoPlay: function (evt) {
            this.videoWidth = evt.target.clientWidth;
            this.videoHeight = evt.target.clientHeight;
        },
        takePicture: function () {
            const canvas = this.$el.querySelector('canvas');
            const context = canvas.getContext('2d');
            const video = this.$el.querySelector('video');
            const user = app.store.state.currentUser;

            context.drawImage(video, 0, 0, this.videoWidth, this.videoHeight);

            user.addPhoto(canvas.toDataURL('image/png'));

            app.store.addCurrentUser(user);
        },
        closeCamera: function (evt) {
            evt.preventDefault();
            const tracks = this.stream.getTracks();

            this.isRecording = false;
            this.stream = '';

            tracks.forEach(track => {
                track.stop();
            });

        }
    },
    updated: function () {
        if (this.isRecording) {
            const video = this.$el.querySelector('video');
            this.videoWidth = video.clientWidth;
            this.videoHeight = video.clientHeight;
        }
    },
    nextTick: function () {
        const video = this.$el.querySelector('video');
        this.videoWidth = video.clientWidth;
        this.videoHeight = video.clientHeight;
    }
});

Vue.component('chat-users', {
    template: `
        <section class="chat__users">
            <fieldset class="chat__users-current">
                <template v-if="currentUser.photo">
                    <img height="50" width="50" v-bind:src="currentUser.photo" />
                </template>
                <fieldset class="chat__users-userField">
                    <label for="currentUser" class="chat__users-userField-label"> Your Username
                    <input id="currentUser" type="text" v-model="currentUser.username" />
                    </label>
                    <button class="chat__users-userField-submit" v-on:click="addUser">Submit</button>
                </fieldset>
                <user-take-pic></user-take-pic>
            </fieldset>
            <ul class="chat__users-list userList">
                <chat-user-item v-for="(user,index) in users"
                v-bind:user="user"
                v-bind:index="index"
                v-bind:key="user.timeCreated">
                </chat-user-item>
            </ul>
        </section>
    `,
    data: function () {
        return {
            users: app.store.state.users,
            currentUser: app.store.state.currentUser

        };
    },
    methods: {
        addUser: function () {
            const username = this.currentUser.username;
            const newUser = new User(username);
            
            app.store.addUser(newUser);
            app.store.addCurrentUser(newUser);

            this.shareUser(newUser);

        },
        shareUser: function (user) {
            socket.emit('chatStateAddUser', user);
        }
    },
    watch: {
        users: function (newUsers) {
        }
    }
});

Vue.component('chat-message', {
    template: `
    <blockquote class="chatMessage">
        <div class="chatMessage__content">
            <p>{{message.content}}</p>
        </div>
        <div class="chatMessage__user chatUser">
            <img class="chatUser__img" v-if="message.user.photo" v-bind:src="message.user.photo" />
            <cite class="chatUser__name">{{message.user.username}}</cite>
        </div>
    </blockquote>
    `,
    props: ['message']

});

Vue.component('chat-session', {
    template: `
        <section class="chat__session">
            <output class="chat__session-messages" v-if="messages.length > 0">
                <chat-message v-for="(message,index) in messages"
                v-bind:message="message"
                v-bind:index="index"
                v-bind:key="message.timeCreated"
                >
                </chat-message>
            </output>
            <article class="chat__session-info" v-if="messages.length === 0">
                <p>No one has said anything</p>
            </article>
            <div class="chat__session-messageField">
                <textarea class="chat__session-message" v-model="currentMessage" v-on:keyup="readMessage">

                </textarea>
                <button class="chat__session-messageSend" v-on:click="sendMessage">Send</button>
            </div>
        </section>
    `,
    data: function () {
        return {
            messages :app.store.state.messages,
            currentMessage: ''
        };
    },
    methods: {
        sendMessage: function () {
            const textMsg = this.currentMessage;
            const message = new Message(textMsg, app.store.state.currentUser);

            socket.emit('chatSessionMsgSend', message);
            this.currentMessage = '';
            this.scrollToLastMessage();
        },
        readMessage: function (evt) {
            if (evt.which == 13) {
                this.sendMessage();
            }
        },
        scrollToLastMessage() {
            const sessionContainer = this.$el.querySelector('.chat__session-messages');
            sessionContainer.scrollTop = sessionContainer.scrollHeight;
        }
    },
    watch: {
        messages: function (newMessages) {
        }
    },
    beforeMount () {
        this.messages = app.store.state.messages;
    },
    updated() {
        this.scrollToLastMessage();
    }

});


const chatApp = new Vue({
    el: '.chat'
});

app.socketCallbacks = {
    chatSessionMsgSend(message) {
        app.store.addMessage(message);
    },
    chatStateUserAdded(user) {
        console.log('told to add user');
        app.store.addUser(user);
    },
    serverChatState(serverState) {
        if (serverState.users.length != app.store.state.users) {
            serverState.users.forEach(element => {
                app.store.addUser(element);
            });
        }

        if (serverState.messages.length != app.store.state.messages) {
            serverState.messages.forEach(element => {
                app.store.addMessage(element);
            });
        }

        chatApp.$forceUpdate();
    },
    connect(data){
        console.info('you connected?');
        console.log(socket.id);
    }
    // chatSessionConnect(messages){
    //     console.log('got chatSessionConnect', messages);
    //     app.state.messages = messages;
    // }
};

app.bindSocketEvents = function () {
    for (let eventName in app.socketCallbacks) {
        socket.on(eventName, app.socketCallbacks[eventName]);
    }
};

app.init();