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
casper.test.begin('Functions', function(test) {

    /* Log to BO TPP */
    casper.logToBackend = function(loginBackend,passBackend) {
        this.echo("Accessing and logging to TPP BackOffice...", "INFO");
        this.waitForUrl(/login/, function success() {
            this.fillSelectors('form', {
                'input[name="email"]': loginBackend,
                'input[name="password"]': passBackend
            }, true);
            if(loginBackend != "" && passBackend != "") {
                test.info("Done");
            } else {
                this.echo("WARNING: No Backend credentials available !", "WARNING");
                test.done();
            }
        }, function fail() {
            test.assertUrlMatch(/login/, "Login page exists");
        });
    };
    /* Select account for test from BO TPP */
    casper.selectAccountBackend = function(name) {
        this.waitForUrl(/dashboard/, function success() {
                if(this.exists('div#s2id_dropdown-merchant-input>a')) {
                    this.echo("Selecting sub-account...", "INFO");
                    this.echo('URL match 1');
                    this.thenClick('div#s2id_dropdown-merchant-input>a', function() {
                        this.sendKeys('input[placeholder="Account name or API credential"]', name);
                        this.wait(1000, function() {
                            this.click(x('//span[contains(., "HIPAY_RE7_' + name + ' -")]'));
                        });
                    });
                }
                else {
                    this.echo("Selecting account "  + name + " with old backend ", "INFO");
                    if(this.exists(x('//td[contains(., "HIPAY_RE7_' + name + '")]/preceding-sibling::td[@class="account-number"]/a'))) {
                        this.thenClick('div#fs-account-navigation>div>a', function() {
                            this.thenClick(x('//li/a[text()="Test"]'), function() {
                                this.thenClick(x('//td[contains(., "HIPAY_RE7")]/i'), function() {
                                    this.click(x('//td[contains(., "HIPAY_RE7_' + name + '")]/preceding-sibling::td[@class="account-number"]/a'));
                                });
                            });
                        });
                    } else {
                        this.echo('Account is not listed "HIPAY_RE7_' + name + '"', "ERROR");
                    }
                }
            }, function fail() {
                test.assertUrlMatch(/dashboard/, "dashboard page exists");
            },
            25000);
    };

    /* Open notification details */
    casper.openingNotif = function(status) {
        this.click('a[href="#payment-notification"]');
        if(status != "116")
            this.echo("Opening Notification details with status " + status + "...", "INFO");
        this.waitForSelector(x('//tr/td/span[text()="' + status + '"]/parent::td/following-sibling::td[@class="cell-right"]/a'), function success() {
            this.click(x('//tr/td/span[text()="' + status + '"]/parent::td/following-sibling::td[@class="cell-right"]/a'));
            test.info("Done");
        }, function fail() {
            if(status == "117") {
                notif117 = false;
                this.echo("Notification 117 not exists", "WARNING");
            }
            else {
                if(!reload) {
                    this.echo("Waiting for notifications...", "WARNING")
                    this.wait(5000, function() {
                        reload = true;
                        this.reload();
                        test.info("Done");
                        this.openingNotif(status);
                    });
                }
                else
                    test.assertExists(x('//tr/td/span[text()="' + status + '"]/parent::td/following-sibling::td[@class="cell-right"]/a'), "Notification " + status + " exists");
            }
        });
    };

    /* Get data request and hash code from the details */
    casper.gettingData = function(status) {
        this.echo("Getting data request from details...", "INFO");
        this.waitUntilVisible('div#fsmodal', function success() {
            hash = this.fetchText(x('//tr/td/pre[contains(., "Hash")]')).split('\n')[7].split(':')[1].trim();
            data = this.fetchText('textarea.copy-transaction-message-textarea');
            try {
                test.assert(hash.length > 1, "Hash Code captured !");
                test.assertNotEquals(data.indexOf("status=" + status), -1, "Data request captured !");
            } catch(e) {
                if(String(e).indexOf("Hash") != -1)
                    test.fail("Failure: Hash Code not captured");
                else
                    test.fail("Failure: data request not captured");
            }
            this.click("div.modal-backdrop");
        }, function fail() {
            test.assertVisible('div#fsmodal', "Modal window exists");
        });
    };

    /* Execute shell command in order to simulate notification to server */
    casper.execCommand = function(code, retry, pathGenerator) {
        data = data.replace(/\n/g, '&');
        child = spawn('/bin/bash', [pathGenerator, data, code, baseURL + urlNotification]);
        try {
            child.stdout.on('data', function(out) {
                casper.wait(3000, function() {
                    if(out.indexOf("CURL") != -1)
                        this.echo(out.trim(), "INFO");
                    else if(out.indexOf("200") != -1 || out.indexOf("503") != -1)
                        test.info("Done");
                    output = out;
                });
            });
            child.stderr.on('data', function(err) {
                casper.wait(2000, function() {
                    this.echo(err, "WARNING");
                });
            });
        } catch(e) {
            if(!retry) {
                this.echo("Error during file execution! Retry command...", "WARNING");
                this.execCommand(code, true);
            }
            else
                test.fail("Failure on child processing command");
        }
    };

    /* Test CURL status code from shell command */
    casper.checkCurl = function(httpCode) {
        try {
            test.assertNotEquals(output.indexOf(httpCode), -1, "Correct CURL Status Code " + httpCode + " from CURL command !");
        } catch(e) {
            if(output.indexOf("503") != -1)
                test.fail("Failure on CURL Status Code from CURL command: 503");
            else if(output == "") {
                test.comment("Too early to check CURL status code");
                this.wait(15000, function() {
                    this.checkCurl(httpCode);
                });
            }
            else
                test.fail("Failure on CURL Status Code from CURL command: " + output.trim());
        }
    };

    /* Search an order in engine */
    casper.searchAndSelectOrder = function(orderID) {
        this.echo("Finding cart ID # " + cartID + " in order list...", "INFO");
        this.waitForUrl(/manage/, function success() {
            this.click('input#checkbox-orderid');
            this.fillSelectors('form#form-manage', {
                'input#searchfilters-orderid-start': orderID,
                'select#searchfilters-orderid-type': "startwith"
            }, false);
            this.click('input[name="submitbutton"]');

            this.waitForUrl(/list/, function success() {
                test.info("Done list");
                // Select the first order if several orders are present
                this.waitForSelector("table.datatable-transactions tbody tr:first-child", function success() {
                    this.click('table.datatable-transactions tbody tr:first-child a[data-original-title="View transaction details"]');
                }, function fail() {
                    test.assertExists('table.datatable-transactions tbody tr:first-child', "History block of this order exists");
                }, 25000);
            }, function fail() {
                test.assertUrlMatch(/list/, "Manage list exists");
            }, 25000);

        }, function fail() {
            test.assertUrlMatch(/manage/, "Manage page exists");
        });
    };

    /* Open transactions view */
    casper.goToTabTransactions = function() {
        this.waitForUrl(/maccount/, function success() {
            this.click('a.nav-transactions');
            test.info("Done");
        }, function fail() {
            test.assertUrlMatch(/maccount/, "Dashboard page with account ID exists");
        });
    };

	casper.echo('Functions backend HiPay library loaded !', 'INFO');
    test.done();
});