export default class {
    constructor(content, user, isPrivate = false) {
        this.user = user;
        this.content = content;
        this.timeCreated = Date.now();
        this.isPrivate = isPrivate;
    }


}