const _appHelpers = require('./app.helpers')
const config = require('../config')
const stripe = require("stripe")('sk_test_PvTHoLJ4otz99aR4eJsFsyGq00HktfpQr4');

const helper = {}

helper.createCharge = (amount, currency = 'usd', description, token, callback) => {

    // validate fields
    amount = _appHelpers.validateNumber(amount);
    currency = _appHelpers.validateString(currency, 1)
    description = _appHelpers.validateString(description) || ''

    if (amount && currency && description) {
        // keep going
        stripe.charges.create({
            amount: 2000,
            currency: "usd",
            source: "tok_visa", // obtained with Stripe.js
            description: "Charge for jenny.rosen@example.com"
        }, function (err, charge) {
            console.log('...err', err)
            console.log('...charge', charge)
        });
    } else {
        callback(404, {
            error: `Invalid fields: ${err}`
        })
    }
}

module.exports = helper;