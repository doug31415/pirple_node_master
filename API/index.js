/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * 
 * Start app with NODE_DEBUG={filename} to debug a specific file
 * Start app with NODE_DEBUG={f1},{f2},{f3} to debug several  files
 * Start app with NODE_DEBUG=api_* to debug all the files in this app
 * --------------------------------- */

// node deps
const server = require('./lib/server');
const workers = require('./lib/workers');

// declare app
const app = {};

app.init = () => {
    server.init();
    workers.init();
}

// init the app
app.init();

module.exports = app;