module.exports = {
    userList : [],
    addUser(data) {
        this.userList.push(data);
    },
    delUser(data) {
        this.userList.splice(this.userList.indexOf(data), 1);
    },
    get userCount() {
        return this.userList.length;
    }
}