export default class {
    constructor(name){
        if (typeof name == 'object' ) {
            Object.assign(this, name);
        } else {
            this.username = name;
            this.timeCreated = Date.now();
            this.messages = [];
            this.photo = '';
        }
    }
    addName (name) {
        this.name = name;
    }
    addMessage(message) {
        this.messages.push(message);
    }
    addPhoto(photo) {
        this.photo = photo;
    }
}