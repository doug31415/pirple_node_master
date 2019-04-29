/* ---------------------------------
 *
 * Copyright © 2019
 * All rights reserved.
 * 
 * Created by DGoodman on Tue Jan 29 2019
 * 
 * Create and export a config 
 * --------------------------------- */

// stripe config
const stripe = {
    key: 'pk_test_DScA23zDlN3LaI8BIYVICMtO00x4FXeOOU',
    secret: 'sk_test_PvTHoLJ4otz99aR4eJsFsyGq00HktfpQr4'
}

// staging (default)
const staging = {
    httpPort: 8080,
    httpsPort: 8181,
    hashSecret: 'theSecretForHashing',
    name: 'staging',
    stripe
}

// production (default)
const production = {
    httpPort: 8282,
    httpsPort: 8383,
    hashSecret: 'theSecretForHashing2',
    name: 'production',
    stripe
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