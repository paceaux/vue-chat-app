
module.exports = {

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