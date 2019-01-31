/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * 
 * Create and export a config 
 * --------------------------------- */


// staging (default)
const staging = {
    httpPort: 3000,
    httpsPort: 3001,
    hashSecret: 'theSecretForHashing',
    name: 'staging'
}

// production (default)
const production = {
    httpPort: 5000,
    httpsPort: 5001,
    hashSecret: 'theSecretForHashing2',
    name: 'production'
}

// all environments
const environments = {
    staging,
    production
}

// export the selected one
const selected = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : '';

// does it exist? default to staging if not
let exportedEnv = (typeof environments[selected] === 'object') ? environments[selected] : environments.staging;

module.exports = exportedEnv;