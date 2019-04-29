/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * 
 * Request handlers
 * --------------------------------- */


const userRoutes = require('./routes/users');
const tokenRoutes = require('./routes/tokens');
const checksRoutes = require('./routes/checks');

const handlers = {}

// ---------------------------------------
// application routes
handlers.ping = (data, callback) => {
    callback(200)
}

// 404 handler
handlers.notFound = (data, callback) => {
    callback(404)
}

// ---------------------------------------
// user routes
handlers.users = userRoutes.routes;

// ---------------------------------------
// token routes
handlers.tokens = tokenRoutes.routes;

// ---------------------------------------
// checks routes
handlers.checks = checksRoutes.routes;

// ---------------------------------------
module.exports = handlers