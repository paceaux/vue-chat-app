require('./polyfills.js');
import Vue from 'vue';
import User from './user.js';
import Message from './message.js';
const socket = io.connect();
const app = {};

app.init = function init() {
    socket.on('connect', ()=>{
        console.info('you connected');
    });
    app.bindSocketEvents();
};

app.data = {
    codec: 'video/webm; codecs="vp8"'
};

app.store = {
    debug: true,
    state: {
        messages: [],
        users:[],
        currentUser: localStorage.getItem('app-currentUser') && new User(JSON.parse(localStorage.getItem('app-currentUser'))) || new User()
    },
    addMessage(message) {
        if (this.debug) console.info('addmessage', message);
        this.state.messages.push(message);
    },
    addUsers(users) {
        if (this.debug) console.info('addUsers', users);
        this.state.users = users;
    },
    addUser(user){
        if (this.debug) console.info('addUser', user);
        this.state.users.push(user);
    },
    addCurrentUser(user) {
        if (this.debug) console.info('addCurrent', user);
        this.state.currentUser = user;
        localStorage.setItem('app-currentUser', JSON.stringify(user));
    },
    getCurrentUser() {
        const storedUser = JSON.parse(localStorage.getItem('app-currentUser'));
        const typedUser = storedUser && new User(storedUser) || new User();

        return typedUser;
    }
};

Vue.component('chat-user-item', {
    props: ['username'],
    template: `
        <li class="userList__item>{{username}}</li>
    `,
});

Vue.component('user-take-pic',  {
    template: `
        <fieldset class="chat__users-userPic userPic">
            
            <button class="userPic__start" v-on:click="startVideo">Add Your Photo</button>
            <div class="userPic__camera-container camera-container" v-if="isStreaming">
                <div class="userPic__camera camera" >
                    <video class="camera__video" v-on:play="videoPlay" autoplay>
                        <source v-if="isStreaming" :src="videoSrc" :type="type">
                    </video>
                    <canvas class="camera__canvas" :width="videoWidth" :height="videoHeight"></canvas>
                    <button class="camera__record" v-on:click="takePicture">Take Picture</button>
                    <a href="#" class="camera__close" v-on:click="closeCamera">x</a>
                </div>
            </div>
        </fieldset>
    `,
    data: function () {
        return {
            isStreaming: false,
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
                this.isStreaming = true;
                this.videoSrc = URL.createObjectURL(stream);
                this.stream = stream;
            });
        },
        videoPlay: function (evt) {
            this.videoWidth = evt.target.offsetWidth;
            this.videoHeight = evt.target.offsetHeight;
        },
        clearPicture: function () {
            const currentWidth = this.videoWidth;

            this.videoWidth = 0;
            this.videoWidth = currentWidth;
            
        },
        takePicture: function () {
            this.clearPicture();
            const canvas = this.$el.querySelector('canvas');
            const context = canvas.getContext('2d');
            const video = this.$el.querySelector('video');
            const user = app.store.state.currentUser;

            if (video.offsetHeight != this.videoHeight) {
                this.videoHeight = video.offsetHeight;
            }

            context.drawImage(video, 0, 0, this.videoWidth, this.videoHeight);

            user.addPhoto(canvas.toDataURL('image/png'));

            app.store.addCurrentUser(user);
        },
        closeCamera: function (evt) {
            evt.preventDefault();
            const tracks = this.stream.getTracks();

            this.isStreaming = false;
            this.stream = '';

            tracks.forEach(track => {
                track.stop();
            });

        }
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
                <li v-for="user in users">{{user.username}}</li>
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
        },
        readMessage: function (evt) {
            if (evt.which == 13) {
                this.sendMessage();
            }
        }
    },
    watch: {
        messages: function (newMessages) {
        }
    },
    beforeMount () {
        this.messages = app.store.state.messages;
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
            })
        }

        chatApp.$forceUpdate();
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