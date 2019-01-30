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
    'hello': handlers.hello
}

// ---------------------------------------
module.exports = {
    ...router
}