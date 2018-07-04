/**
 * HiPay Enterprise SDK Casper JS
 *
 * 2017 HiPay
 *
 * NOTICE OF LICENSE
 *
 * @author    HiPay <support.tpp@hipay.com>
 * @copyright 2017 HiPay
 *
 */

/**
 * Open and send notifications to server
 *
 * @param test
 * @param code
 * @param backendHiPay
 * @param baseURL
 * @param urlNotification
 */
function openAndExecNotifications(test, code, backendHiPay, baseURL, urlNotification) {
    var request = {};
    var output = '';
    /* Open Notification tab and opening this notifications details */
    casper.then(function () {
        this.echo("Opening Notification details with status " + code + " .... ", "INFO");
        backendHiPay.openingNotif(test, code, false);
    })
    /* Get data from Notification with code */
        .then(function () {
            request = backendHiPay.gettingData(test, code);
        })
        /* Execute shell script */
        .then(function () {
            output = backendHiPay.execCommand(hash, false, pathGenerator, request, baseURL, urlNotification);
        })
        /* Check CURL status code */
        .then(function () {
            backendHiPay.checkCurl(test, "200", output);
        })
}

/**
 *
 * @param authorize
 * @param request
 * @param capture
 * @param partial
 * @param account
 * @param backendHiPay
 * @param loginBackend
 * @param passBackend
 * @param baseURL
 * @param urlNotification
 */
function processNotifications(test, authorize, request, capture, partial, account, backendHiPay, loginBackend, passBackend, baseURL, urlNotification) {
    casper.thenOpen(urlBackend, function () {
        if (loginBackend === '' && passBackend === '') {
            loginBackend = casper.cli.get('login-backend');
            passBackend = casper.cli.get('pass-backend');
        }

        if (!casper.getCurrentUrl().match(/dashboard/)) {
            backendHiPay.logToHipayBackend(test, loginBackend, passBackend);
        } else {
            this.echo("Already logged to HiPay backend", "COMMENT");
        }
    })
    /* Select sub-account use for test*/
        .then(function () {
            backendHiPay.selectAccountBackend(test, account);
        })
        /* Open Transactions tab */
        .then(function () {
            backendHiPay.goToTabTransactions(test);
        })
        /* Search last created order */
        .then(function () {
            backendHiPay.searchAndSelectOrder(test, cartID, false);
        })
        .then(function () {
            if (authorize) {
                openAndExecNotifications(test, "116", backendHiPay, baseURL, urlNotification);
            }
        })
        .then(function () {
            if (request) {
                openAndExecNotifications(test, "117", backendHiPay, baseURL, urlNotification);
            }
        })
        .then(function () {
            if (capture) {
                openAndExecNotifications(test, "118", backendHiPay, baseURL, urlNotification);
            }
        })
        /* Check returned CURL status code 403 from this shell command */
        .then(function () {
            // TODO Implement correct http response in module
        })
}


module.exports = {
    openAndExecNotifications: openAndExecNotifications,
    processNotifications: processNotifications
};
