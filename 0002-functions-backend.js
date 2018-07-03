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

var childProcess = require("child_process");

/**
 * Log to TPP BO
 *
 * @param test
 * @param loginBackend
 * @param passBackend
 */
function logToHipayBackend(test, loginBackend, passBackend) {
    casper.echo("Accessing and logging to TPP BackOffice...", "INFO");

    if (!loginBackend || !passBackend) {
        casper.echo("WARNING: No Backend credentials available !", "WARNING");
        test.done();
    }

    casper.waitForUrl(/login/, function success() {
        casper.fillSelectors('form', {
            'input[name="email"]': loginBackend,
            'input[name="password"]': passBackend
        }, true);

    }, function fail() {
        casper.waitForUrl(/dashboard/, function success() {
            casper.echo("Already logged to admin panel !", "COMMENT");
        }, function fail() {
            test.assertUrlMatch(/dashboard/, "Admin dashboard exists");
        });
        test.assertUrlMatch(/login/, "Login page exists");
    });
}

/**
 * Select account for test from TPP BO
 *
 * @param test
 * @param name
 */
function selectAccountBackend(test, name) {
    casper.waitForUrl(/dashboard/, function success() {
            if (casper.exists('div#s2id_dropdown-merchant-input>a')) {
                casper.echo("Selecting sub-account...", "INFO");
                casper.echo('URL match 1');
                casper.thenClick('div#s2id_dropdown-merchant-input>a', function () {
                    casper.sendKeys('input[placeholder="Account name or API credential"]', name);
                    casper.wait(1000, function () {
                        casper.click(x('//span[contains(., "HIPAY_RE7_' + name + ' -")]'));
                    });
                });
            } else {
                casper.echo("Selecting account " + name + " with old backend ", "INFO");
                if (casper.exists(x('//td[contains(., "HIPAY_RE7_' + name + '")]/preceding-sibling::td[@class="account-number"]/a'))) {
                    casper.thenClick('div#fs-account-navigation>div>a', function () {
                        casper.thenClick(x('//li/a[text()="Test"]'), function () {
                            casper.thenClick(x('//td[contains(., "HIPAY_RE7")]/i'), function () {
                                casper.click(x('//td[contains(., "HIPAY_RE7_' + name + '")]/preceding-sibling::td[@class="account-number"]/a'));
                            });
                        });
                    });
                } else {
                    casper.echo('Account is not listed "HIPAY_RE7_' + name + '"', "ERROR");
                }
            }
        }, function fail() {
            test.assertUrlMatch(/dashboard/, "dashboard page exists");
        },
        25000);
}

/**
 * Open notification details
 *
 * @param test
 * @param status
 */
function openingNotif(test, status, reloaded) {
    casper.click('a[href="#payment-notification"]');

    if (status !== "116") {
        casper.echo("Opening Notification details with status " + status + "...", "INFO");
    }

    casper.waitForSelector(x('//tr/td/span[text()="' + status + '"]/parent::td/following-sibling::td[@class="cell-right"]/a'), function success() {
        casper.click(x('//tr/td/span[text()="' + status + '"]/parent::td/following-sibling::td[@class="cell-right"]/a'));
        casper.echo("Done", "COMMENT");
    }, function fail() {
        if (status === "117") {
            casper.echo("Notification 117 not exists", "WARNING");
        } else {
            if (!reloaded) {
                casper.echo("Waiting for notifications...", "WARNING")
                casper.wait(5000, function () {
                    casper.reload();
                    casper.echo("Done", "COMMENT");
                    openingNotif(test, status, true);
                });
            } else {
                test.assertExists(x('//tr/td/span[text()="' + status + '"]/parent::td/following-sibling::td[@class="cell-right"]/a'), "Notification " + status + " exists");
            }
        }
    });
}

/**
 * Get data request and hash code from the details
 *
 * @param test
 * @param status
 */
function gettingData(test, status) {
    var data = '';
    var hash = '';

    casper.echo("Getting data request from details...", "INFO");
    casper.waitUntilVisible('div#fsmodal', function success() {
        hash = this.fetchText(x('//tr/td/pre[contains(., "Hash")]')).split('\n')[6].split(':')[1].trim();
        data = this.fetchText('textarea.copy-transaction-message-textarea');
        try {

            test.assert(hash.length > 1, "Hash Code captured :" + hash);
            test.assertNotEquals(data.indexOf("status=" + status), -1, "Data request captured !");

            return {data: data, hash: hash};
        } catch (e) {

            if (String(e).indexOf("Hash") !== -1) {
                test.fail("Failure: Hash Code not captured");
            } else {
                test.fail("Failure: data request not captured");
            }
        }

        casper.click("div.modal-backdrop");
    }, function fail() {
        test.assertVisible('div#fsmodal', "Modal window exists");
    });
}

/**
 * Execute shell command in order to simulate notification to server
 *
 * @param test
 * @param code
 * @param retry
 * @param pathGenerator
 * @param request
 * @param baseURL
 * @param urlNotification
 */
function execCommand(test, code, retry, pathGenerator, request, baseURL, urlNotification) {
    casper.echo("Exec Command", "INFO");
    var data = request.data.replace(/\n/g, '&');

    casper.echo("data : " + data, "INFO");
    casper.echo("code : " + code, "INFO");

    var child = childProcess.spawnSync('/bin/bash', [pathGenerator, data, code, baseURL + urlNotification]);
    try {
        child.stdout.on('data', function (out) {
            if (out.indexOf("CURL") !== -1) {
                casper.echo(out.trim(), "INFO");
            } else {
                casper.echo("Done", "COMMENT");
                return out;
            }
        });
        child.stderr.on('data', function (err) {
            casper.wait(2000, function () {
                casper.echo(err, "WARNING");
            });
        });
    } catch (e) {
        if (!retry) {
            casper.echo("Error during file execution! Retry command...", "WARNING");
            execCommand(test, code, true, pathGenerator, request, baseURL, urlNotification);
        } else {
            test.fail("Failure on child processing command");
        }
    }
}

/**
 * Test CURL status code from shell command
 *
 * @param test
 * @param httpCode
 * @param output
 */
function checkCurl(test, httpCode, output) {
    try {
        test.assertNotEquals(output.indexOf(httpCode), -1, "Correct CURL Status Code " + httpCode + " from CURL command !");
    } catch (e) {
        if (output.indexOf("503") != -1) {
            test.fail("Failure on CURL Status Code from CURL command: 503");
        } else if (output == "") {
            test.comment("Empty response");
        } else {
            test.fail("Failure on CURL Status Code from CURL command: " + output.trim());
        }
    }
}

/**
 * Search an order in engine
 *
 * @param test
 * @param orderID
 * @param retried
 */
function searchAndSelectOrder(test, orderID, retried) {
    casper.echo("Finding cart ID # " + cartID + "and order ID# " + orderID + " in order list...", "INFO");
    casper.waitForUrl(/manage/, function success() {
        casper.click('input#checkbox-orderid');
        casper.fillSelectors('form#form-manage', {
            'input#searchfilters-orderid-start': orderID,
            'select#searchfilters-orderid-type': "startwith"
        }, false);
        casper.click('input[name="submitbutton"]');

        casper.waitForUrl(/list/, function success() {
            casper.echo("Done list", "COMMENT");
            // Select the first order if several orders are present
            casper.waitForSelector('table.datatable-transactions tbody tr:first-child a[data-original-title="View transaction details"]', function success() {
                casper.click('table.datatable-transactions tbody tr:first-child a[data-original-title="View transaction details"]');
            }, function fail() {
                if (retried) {
                    test.assertExists('table.datatable-transactions tbody tr:first-child a[data-original-title="View transaction details"]', "History block of this order exists");
                } else {
                    casper.echo("Order not found retry once", "COMMENT");
                    goToTabTransactions(test);
                    searchAndSelectOrder(test, orderID, true);
                }
            }, 25000);
        }, function fail() {
            test.assertUrlMatch(/list/, "Manage list exists");
        }, 25000);

    }, function fail() {
        test.assertUrlMatch(/manage/, "Manage page exists");
    });
}

/**
 * Open transactions view
 *
 * @param test
 */
function goToTabTransactions(test) {
    casper.waitForUrl(/maccount/, function success() {
        casper.click('a.nav-transactions');
        casper.echo("Done", "COMMENT");
    }, function fail() {
        test.assertUrlMatch(/maccount/, "Dashboard page with account ID exists");
    });
}

module.exports = {
    logToHipayBackend: logToHipayBackend,
    selectAccountBackend: selectAccountBackend,
    openingNotif: openingNotif,
    gettingData: gettingData,
    execCommand: execCommand,
    checkCurl: checkCurl,
    searchAndSelectOrder: searchAndSelectOrder,
    goToTabTransactions: goToTabTransactions
};
