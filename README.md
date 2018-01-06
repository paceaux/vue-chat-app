# vue-chat-app
Small Chat app built in Vue.js with socket.io


This started from a chapter in "Node.js in 24 hours" on web sockets. It turned into "hey, I wonder if I could send video over websockets" (answer: kinda). Then I decided to clean things up like an adult. 


## The Vue stuff
So now this uses Vue for the templating (because I wanted to get to know Vue better). 
It doesn't use a state library (yet). I'm holding off on a state library until I feel like I need one. 

The Vue components need to be broken into their own file. 

## Websocket stuff
Using Socket.io
Web sockets do all the chat things. I'm not doing chat rooms. I am working on private chats, though.  

## Server stuff
Using express.js. Barely.

Express serves a single page. There's no routes. 
This probably counts as "serverless" since the server just serves a single page. 
The usernames and chat messages are just in memory; that's it. If the server shuts off, the usernames and messages go away. 

Start the server with `npm start` (Using an npm script for starting the server)

## Building
Build the latest with `npm build`. 

Using Webpack. No watchers or anything. You'll need to build every time you update a JavaScript file

## CSS / Styles
No CSS preprocessor. Didn't need it; presentation wasn't really my concern. 
Layout is written in CSS grid (because I wanted to get more familiar with that).
I'm using CSS variables for managing look and feel. It's actually kinda neat. 




