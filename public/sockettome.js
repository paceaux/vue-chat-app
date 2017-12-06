
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.mediaDevices.getUserMedia;
const socket = io.connect();
const app = {};

app.init = function init() {
    this.bindUiEvents();
    this.bindSocketEvents();

    window.addEventListener('load', ()=> {
        if (app.helpers.recallUser()) {
            app.elements.chatUser.value = app.helpers.recallUser();
        } 
    });
};

app.data = {
    codec: 'video/webm; codecs="vp8"'
};

app.elements = {

    socketMsg : document.querySelector('.js-socketMessage'),
    socketCtrl : document.querySelector('.js-userCounter'),
    userList : document.querySelector('.js-userList'),
    chatUser : document.querySelector('.js-username'),
    chatText : document.querySelector('.js-send-text'),
    chatSend : document.querySelector('.js-transmit'),
    chatReceive : document.querySelector('.js-receive'),
    videoSendButton : document.querySelector('.js-sendVideo'),
    selfVideo : document.querySelector('.js-myVideo'),
    theirVideo : document.querySelector('.js-theirVideo'),
    theirImage : document.querySelector('.js-theirImage'),
    theirCanvas : document.querySelector('.js-theirCanvas'),
};

app.uiCallbacks = {
    userNameCb() {
        const username = app.helpers.getText(app.elements.chatUser);
        const currentUser = app.helpers.recallUser();
    
        if (username != app.helpers.recallUser()) {
            socket.emit('chatuserdelete', {username:currentUser});
        }
        app.helpers.saveUser(username);
        socket.emit('chatusersend', {username});
    },
    chatSendCB() {
        const content = app.helpers.getText(app.elements.chatText);
        const user = app.helpers.getText(app.elements.chatUser);
    
        app.helpers.clearText(app.elements.chatText);
        app.transmit.chatMessage({content,user});
    },
    startVideoStream() {
        navigator.getUserMedia({video:true}, app.gumCallbacks.videoSuccess ,(e)=> {
            console.warn('streaming error', e);
        });
    }
};


app.helpers = {
    getText (el) {
        return el.value;
    },
    
    clearText (el) {
        el.value = '';
    },

    saveUser(userName) {
        userName && localStorage.setItem('chat-user', userName);
    },
    
    recallUser() {
       return localStorage.getItem('chat-user');
    }
};

app.views = {
    getChatView(data) {
        return `
        <blockquote class="chat__message">
            <span class="chat__message-content"> ${data.content} </span>
            <cite class="chat__message-user">${data.user}</cite>
        </blockquote>
        
        `;
    },
    
    getUserView(data) {
        return `
            <li class="userList__user">${data.username}</li>
        `;
    },
    
    getUserMediaView(h, w, data) {
    
        return `
    
        `;
    },
    
    getUserStreamView(data) {
        const userMediaView = this.getUserMediaView(data.h, data.w, data.src);
        return `
            <figure class="stream">
                ${userMediaView}
                <figcaption class="stream__info">
                    <p class="stream__user-name">User: <span class="">${data.user}</span></p>
                </figcaption>
            </figure>
        `;
    }
};

app.bindUiEvents = function bindUiEvents() {
    app.elements.chatUser.addEventListener('blur', app.uiCallbacks.userNameCb);
    app.elements.chatSend.addEventListener('click', app.uiCallbacks.chatSendCB);
    app.elements.videoSendButton.addEventListener('click', app.uiCallbacks.startVideoStream);
};

app.socketCbs = {
    welcome(data) {
        app.elements.socketMsg.innerText = data.content;
    },
    counter(data) {
        console.info(data);
        app.elements.socketCtrl.innerText = data.content;
    },
    chatmsgsend(data) {
        console.info(data);
        app.elements.chatReceive.innerHTML+=app.views.getChatView(data);
    },
    chatusersend(data) {
        let listItems = '';
        data.forEach((user) => {
            listItems+=app.views.getUserView(user);
        });
    
        app.elements.userList.innerHTML = listItems;
    },
    canvasToImage(data) {
        app.elements.theirImage.src = data.src;
        app.elements.theirImage.style.height = data.height;
        app.elements.theirImage.style.width = data.width;
    },
    canvasToCanvas(data) {
        const img = app.gum.canvasImage;
        const cvs = app.elements.theirCanvas;
        const ctx = cvs.getContext('2d');

        cvs.width = data.width;
        cvs.height = data.height;

        img.onload = function() {
            ctx.drawImage(img, 0, 0);
        };



        img.src = data.src;
    },
    cancelVideo(data) {

    },
    test(data) {

    }
};

app.gum = {
    get canvasImage() {
        let img;
        if (this._theirImage) {
            img = this._theirImage;
        } else {
            img = new Image();
        }
        
        return img;
    },

    get mediaSource() {
        let ms;
        if (this._ms) {
            ms = this._ms;
        } else {
            ms = new MediaSource();
        }
        
        return ms;
    },
    drawOnCanvas(video, canvas) {
        console.log('draw on BackCanvas');
        const backContext = canvas.getContext('2d');
        const cw = video.clientWidth;
        const ch = video.clientHeight;
        let toggle = false;
    
        canvas.width = cw;
        canvas.height = ch;
        
    
        (function loop() {
            toggle = !toggle;
    
            if (toggle) {
                backContext.drawImage(video, 0, 0, cw, ch);
                const stringData = canvas.toDataURL('image/webp')
    
                app.transmit.streamedVideo({width:cw, height: ch, src: stringData});
            }
    
            requestAnimationFrame(loop);
        })();
    
    },
    sendCanvasifiedInfo(video) {
        const canvas = document.createElement('canvas');
        app.gum.drawOnCanvas(video, canvas);
    }
};

app.gumCallbacks = {
    videoSuccess (stream) {   
        const streamURL = URL.createObjectURL(stream);
        const selfVideo = app.elements.selfVideo;
        const mediaSource = new MediaSource();
        let duration = 0;
        selfVideo.src = streamURL;
//      app.gum.sendCanvasifiedInfo(selfVideo)


        selfVideo.onloadedmetadata = function () {
            const recorder = new MediaRecorder(stream);
            let arrayBuffer;
    
            // start recording immediately
            recorder.start();
            recorder.requestData(); // request the data. this triggers the "dataavailable event"
        
    
            recorder.addEventListener('start', (evt) => {
                setInterval(()=> {
                    recorder.requestData();
                }, 2000);
            });
    
            recorder.addEventListener('dataavailable', (evt) => {
                const data = evt.data;
                socket.emit('videoToVideo', data);
            });
        }

    }
};

app.mediaSourceCbs = {
    sourceopen(evt) {
        console.log('sourceopen', evt);
    },
    sourceended(evt) {
        console.log('sourceended', evt);
    },
    sourceclose(evt) {
        console.log('sourceclose', evt);
    },
    error(evt) {
        console.error('error', evt);
    }
};

app.bufferCbs = {
    updatestart(evt) {
        // console.log('updatestart', evt);
    },
    update(evt) {
        // console.log('update', evt);
    },
    updateend(evt) {
        // console.log('updateend', evt);
    },
    error(evt) {
        // console.error('error', evt);
    },
    abort(evt) {
        // console.warn('abort', evt);
    },
};



app.bindSocketEvents = function bindSocketEvents() {
    for (let cbName in this.socketCbs) {
        socket.on(cbName, this.socketCbs[cbName]);
    }

    const theirVideo = app.elements.theirVideo;
    const supportsMediaSource = ('MediaSource' in window);
    const isCodecSupported = MediaSource.isTypeSupported(app.data.codec);
    const queue = [];

    

    if (supportsMediaSource && isCodecSupported) {
        const mediaSource = app.gum.mediaSource;

        socket.on('videoToVideo', ()=> {
            if (!theirVideo.src) theirVideo.src = URL.createObjectURL(mediaSource);
        });
        for (let cbName in app.mediaSourceCbs) {
            mediaSource.addEventListener(cbName, app.mediaSourceCbs[cbName]);
        }

        mediaSource.addEventListener('sourceopen', sourceOpen);

    } else {
        console.error('Codec not supported', app.data.codec);
    }

    function sourceOpen(evt) {
        const mediaSource = evt.target;
        const sourceBuffer = mediaSource.addSourceBuffer(app.data.codec);
        theirVideo.play();

        for (let cbName in app.bufferCbs) {
            sourceBuffer.addEventListener(cbName, app.bufferCbs[cbName]);
        }

        sourceBuffer.addEventListener('buffer', () => {
            if (queue.length > 0 && !sourceBuffer.updating) {
                sourceBuffer.appendBuffer(queue.shift());
            }
        });

        socket.on('videoToVideo', (data) => {
            
            if (sourceBuffer.updating || queue.length > 0) {
                queue.push(data);
            } else {
                sourceBuffer.appendBuffer(data);
            }
        });

    }



    

};

app.transmit = {
    chatMessage(data) {
        socket.emit('chatmsgsend',data);
    },
    streamedVideo(data) {
        socket.emit('videoToVideo', data);
    }
};

app.init();

