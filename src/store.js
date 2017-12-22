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
    addMessages(newMessages) {
        if (this.debug) console.info('addMessages', newMessages);

        const currentMessages = this.state.messages;

        newMessages.forEach(newMsg=> {
            const existingMsg = currentMessages.find((currentEl) => {
                return currentEl.timeCreated == newMsg.timeCreated;
            });
            if (!existingMsg) {
                this.addMessage(newMsg);
            }
        });
    },
    addUsers(newUsers) {
        if (this.debug) console.info('addUsers', newUsers);

        const currentUsers = this.state.users;

        newUsers.forEach(newUser=> {
            const existingUser = currentUsers.find((currentEl) => {
                return currentEl.timeCreated == newUser.timeCreated;
            });
            if (!existingUser) {
                this.addUser(newUser);
            }
        });
    },
    addUser(user){
        if (this.debug) console.info('addUser', user);
        this.state.users.push(user);
    },
    removeUser(user) {
        if (this.debug) console.info('removeUser', user);

        const userIdx = this.state.users.findIndex(el=>{
            return el.timeCreated === user.timeCreated;
        });

        if (userIdx != -1) {
            this.state.users.splice(userIdx,1);
        }
    },
    updateUser(user) {
        if (this.debug) console.info('updateUser', user);

        this.removeUser(user);
        this.addUser(user);
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