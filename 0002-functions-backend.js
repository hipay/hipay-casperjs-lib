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
 * Select hash Algorithm in account preferences
 *
 * @param test
 * @param hashing
 */
function selectHashingAlgorithm(test, hashing) {
    casper.then(function () {
        this.click('a.nav-integration');
        this.waitForSelector('div.box-content a:nth-child(3)', function success() {

            this.thenClick('div.box-content a:nth-child(3)', function () {

                this.waitForUrl(/security/, function success() {
                    this.echo("Selecting Hashing Algorithm", "INFO");
                    this.fillSelectors('form.form-vertical', {
                        'select[name="hash_algorithm"]': hashing
                    }, false);
                    this.click('div.form-actions button[type="submit"]');

                    this.waitForText('Settings have been successfully updated', function success() {
                        this.echo("Done", "COMMENT");

                    }, function fail() {
                        test.assertExists('div.box-content a:nth-child(3)', "Security tab exists");
                    });

                }, function fail() {
                    test.assertUrlMatch(/security/, "Security page exists");
                });

            });
        }, function fail() {
            test.assertExists('div.box-content a:nth-child(3)', "Security tab exists");
        });
    });
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
    var request = {'data': data, 'hash': hash};
    casper.echo("Getting data request from details...", "INFO");
    casper.waitUntilVisible('div#fsmodal', function success() {
        hash = this.fetchText(x('//tr/td/pre[contains(., "Hash")]')).split('\n')[3].split(':')[1].trim();
        data = this.fetchText('textarea.copy-transaction-message-textarea');
        request["data"] = data;
        request["hash"] = hash;

        casper.click("div.modal-backdrop");
    }, function fail() {
        test.assertVisible('div#fsmodal', "Modal window exists");
    });

    return request;
}

/**
 * Send notification
 *
 * @param test
 * @param request
 * @param baseURL
 * @param urlNotification
 * @param httpStatus
 */
function sendNotification(test, request, baseURL, urlNotification, httpStatus) {
    casper.echo("Sending notification", "INFO");
    var data = request.data.replace(/\n/g, '&');
    casper.echo("data : " + data, "INFO");
    casper.echo("hash : " + request.hash, "INFO");
    casper.thenOpen(baseURL + urlNotification, {
        method: "POST",
        data: data,
        headers: {'X-ALLOPASS-SIGNATURE': request.hash}
    }, function (response) {
        test.assertEquals(response.status, httpStatus, "Correct CURL Status Code " + response.status + " from CURL command !");
        casper.back();
    });
}

/**
 * Search an order in engine
 *
 * @param test
 * @param orderID
 * @param retried
 */
function searchAndSelectOrder(test, orderID, retried) {
    casper.echo("Finding order ID# " + orderID + " in order list...", "INFO");
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
    selectHashingAlgorithm: selectHashingAlgorithm,
    openingNotif: openingNotif,
    gettingData: gettingData,
    sendNotification: sendNotification,
    searchAndSelectOrder: searchAndSelectOrder,
    goToTabTransactions: goToTabTransactions
};
