const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'app.bundle.js',
        path: path.resolve(__dirname, 'public')
    },
    resolve: {
        alias: {
            'vue$' : 'vue/dist/vue.esm.js'
        }
    }
}