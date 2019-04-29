const server = require('./lib/server')

// declare app
const app = {};

app.init = () => {
    server.init();
}

// init the app
app.init();

module.exports = app;