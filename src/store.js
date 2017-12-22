import User from './user.js';

export default {
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
}