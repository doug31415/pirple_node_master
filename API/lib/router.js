/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * --------------------------------- */

const handlers = require('./handlers');

// ---------------------------------------
// request router
const router = {
    'ping': handlers.ping,
    'checks': handlers.checks,
    'tokens': handlers.tokens,
    'users': handlers.users
}

// ---------------------------------------
module.exports = {
    ...router
}