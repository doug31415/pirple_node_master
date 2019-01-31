/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * 
 * Request handlers
 * --------------------------------- */

const _data = require('./data');
const helpers = require('./helpers');
const users = require('./routes/users');

const METHODS = {
    delete: 'DELETE',
    get: 'GET',
    post: 'POST',
    put: 'PUT',
}

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
handlers.users = users.userRoutes;

// ---------------------------------------
module.exports = handlers