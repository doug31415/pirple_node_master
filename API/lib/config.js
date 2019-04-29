/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * 
 * Create and export a config 
 * --------------------------------- */

// twilio
const twilio = {
    accountSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
}

// staging (default)
const staging = {
    httpPort: 3000,
    httpsPort: 3001,
    hashSecret: 'theSecretForHashing',
    maxChecks: 5,
    name: 'staging',
    twilio
}

// production (default)
const production = {
    httpPort: 5000,
    httpsPort: 5001,
    hashSecret: 'theSecretForHashing2',
    maxChecks: 5,
    name: 'production',
    twilio
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