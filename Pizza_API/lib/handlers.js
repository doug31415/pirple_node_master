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
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');

const handlers = {}

// ---------------------------------------
// application routes
handlers.ping = (data, callback) => {
    callback(200, {
        response: 'Ping'
    })
}

// 404 handler
handlers.notFound = (data, callback) => {
    callback(404)
}

// ---------------------------------------
//  routes
handlers.users = userRoutes.routes;
handlers.tokens = tokenRoutes.routes;
handlers.menu = menuRoutes.routes;
handlers.orders = ordersRoutes.routes;

// ---------------------------------------
module.exports = handlers