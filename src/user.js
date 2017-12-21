export default class {
    constructor(name){
        this.username = name;
        this.timeCreated = Date.now();
        this.messages = [];
    }
    addMessage(message) {
        this.messages.push(message);
    }
}