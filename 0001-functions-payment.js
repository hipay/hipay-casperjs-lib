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

    /**********************************************************/
    /*******         FILL ALL HIPAY PAYMENT PAGE           ***/
    /**********************************************************/
    casper.fillPaymentFormularByPaymentProduct = function(payment_product) {
        this.echo("Filling payment formular [ " + payment_product +" ]...", "INFO");
        switch (payment_product) {
            case "dexia-directnet":
                this.fillFormDexiaDirectNet();
                break;
            case "3xcb":
            case "4xcb":
                this.fillFormOneyFacilyPay();
                break;
            case "ing-homepay":
                this.fillFormIngHomePay();
                break;
            case "ideal":
                this.fillFormIDeal();
                break;
            case "sofort-uberweisung":
                this.fillFormSofort();
                break;
            case "postfinance-card":
                this.fillFormPostFinance();
                break;
            case "sisal":
                this.fillFormSisal();
                break;
            case "sdd":
                this.fillFormSdd();
                break;
            case "visa":
            case "mastercard":
            case "maestro":
            case "cb":
            case "visa_3ds":
            case "amex":
                this.fillFormCC(payment_product);
                break;
            default:
                test.fail('Filling payment product is not implemented by HiPay SDK Casper JS')
        }
    },

    /**********************************************************/
    /*******                HOSTED                          ***/
    /**********************************************************/
    casper.fillFormCC = function(payment_product) {
        this.waitForUrl(/payment\/web/, function success() {
            this.echo("Filling hosted payment formular...", "INFO");
            this.waitForSelector('input#cardNumber', function success() {
                this.fillCCFormular(payment_product);
            }, function fail() {
                this.echo("VISA input doesn't exists. Checking for select field...", 'WARNING');
                this.waitForSelector('select#payment-product-switcher', function success() {
                    this.warn("OK. This payment template is deprecated");
                    this.fillSelectors('#form-payment', {
                        'select[name="paymentproductswitcher"]': payment_product
                    });
                    this.fillCCFormular(payment_product);
                }, function fail() {
                    test.assertExists('select#payment-product-switcher', "Select field exists");
                });
            });
        }, function fail () {
            test.assertUrlMatch(/payment\/web/, "Payment page exists");
        });
    },

    /* Fill formular according to the template, with or without iframe */
    casper.fillCCFormular = function (payment_product) {
        var holder = "MC",
            month = "12",
            year = "2020",
            code = "500";
        this.wait(5000, function() {
            if(this.exists('iframe#tokenizerFrame')) {
                this.withFrame(0, function() {
                    this.fillSelectors('form#tokenizerForm', {
                        'input[name="tokenizerForm:cardNumber"]': cardsNumber.visa,
                        'input[name="tokenizerForm:cardHolder"]': holder,
                        'select[name="tokenizerForm:cardExpiryMonth"]': month,
                        'select[name="tokenizerForm:cardExpiryYear"]': year,
                        'input[name="tokenizerForm:cardSecurityCode"]': code
                    }, false);
                });
            }
            else {
                this.fillSelectors('form#form-payment', {
                    'input[name="cardNumber"]': cardsNumber.visa,
                    'select[name="cardExpiryMonth"]': month,
                    'select[name="cardExpiryYear"]': year,
                    'input[name="cardSecurityCode"]': code
                }, false);
            }
            this.thenClick('#submit-button', function() {
                test.info("Done");
            });
        });
    };


    /**********************************************************/
    /*******                SDD                             ***/
    /**********************************************************/
    casper.fillFormSdd = function() {
        this.echo("Filling payment formular...", "INFO");
        this.waitForUrl(/payment\/pay\/reference/, function success() {
            this.fillSelectors('#registrationform', {
                'select[name="gender"]': "male",
                'input[name="firstname"]': "TEST",
                'input[name="lastname"]': "TEST",
                'input[name="street"]': "Rue de la paix",
                'input[name="zip"]': "75000",
                'input[name="city"]': "PARIS",
                'select[name="country"]': "GB",
                'input[name="email"]': "email@yopmail.com"
            }, false);
            this.thenClick('input[name="bankaccountselection"]', function() {
                this.fillSelectors('#registrationform', {
                    'input[name="iban"]': ibanNumber.gb,
                    'input[name="bic"]': bicNumber.gb
                }, false);
                this.click('body');
                this.waitUntilVisible('div.ajaxsuccess', function success() {
                    test.assertNotVisible('div.ajaxerror', "Correct IBAN and BIC number");
                    this.click('input#nyrosubmitfix');
                    test.info("Done");
                    this.echo("Submitting formular...", "INFO");
                }, function fail() {
                    test.assertAllVisible('div.ajaxsuccess', "Succesful div block exists");
                });
            });
        }, function fail() {
            test.assertUrlMatch(/payment\/pay\/reference/, "Payment page exists");
        }, 10000);
    },

    /**********************************************************/
    /*******                SISAL                          ***/
    /**********************************************************/
    casper.fillFormSisal = function() {
        this.waitForUrl(/provider\/sisal/, function success() {
            this.click('a#submit-button');
            test.info("Done");
        }, function fail() {
            test.assertUrlMatch(/provider\/sisal/, "Payment page exists");
        }, 10000);
    },

    /**********************************************************/
    /*******                POST FINANCE                   ***/
    /**********************************************************/
    casper.fillFormPostFinance = function() {
        this.waitForUrl(/secure\.ogone/, function success() {
            this.click('input#btn_Accept');
            test.info("Done");
        }, function fail() {
            test.assertUrlMatch(/secure\.ogone/, "Payment page exists");
        }, 10000);
    },

    /**********************************************************/
    /*******                SOFORT                          ***/
    /**********************************************************/
    casper.fillFormSofort = function() {
        this.waitForUrl(/go\/select_country/, function success() {
            this.click('form#WizardForm button');
            this.wait(2000, function() {
                this.waitForUrl(/go\/login/, function success() {
                    this.fillSelectors('form#WizardForm', {
                        'input[name="data[BackendForm][LOGINNAME__USER_ID]"]': "00000",
                        'input[name="data[BackendForm][USER_PIN]"]': "123456789"
                    }, false);
                    this.click("form#WizardForm button");
                    test.info("Credentials inserted");
                    this.waitForUrl(/go\/select_account/, function success() {
                        this.click("input#account-1");
                        this.click("form#WizardForm button");
                        test.info("Account selected");
                        this.waitForUrl(/go\/provide_tan/, function success() {
                            this.fillSelectors('form#WizardForm', {
                                'input[name="data[BackendForm][TAN]"]': "12345"
                            }, false);
                            this.click("form#WizardForm button");
                            test.info("TAN code inserted");
                        }, function fail() {
                            test.assertUrlMatch(/go\/provide_tan/, "Payment TAN page exists");
                        },20000);
                    }, function fail() {
                        test.assertUrlMatch(/go\/select_account/, "Payment account page exists");
                    });
                }, function fail() {
                    test.assertUrlMatch(/go\/login/, "Payment login page exists");
                });
            });
        }, function fail() {
            test.assertUrlMatch(/go\/select_country/, "Payment country page exists");
        }, 20000);
    },

    /**********************************************************/
    /*******                IDEAL                          ***/
    /**********************************************************/
    casper.fillFormIDeal = function() {
        this.waitForUrl(/payment\/web\/pay/, function success() {
            this.fillSelectors("form#form-payment", {
                'select[name="issuer_bank_id"]': "TESTNL99"
            }, true);

            this.waitForUrl(/paymentscreen\/testmode/, function success() {
                this.click('input[name="final_state"][value="paid"]');
                this.click('#footer button.button');
                test.info("Done");

            }, function fail() {
                test.assertUrlMatch(/paymentscreen\/ideal\/testmode/, "Payment IDeal page exists");
            }, 15000);
        }, function fail() {
            test.assertUrlMatch(/payment\/web\/pay/, "Payment page exists");
        }, 15000);
    },

    /**********************************************************/
    /*******                ING HOME PAY                    ***/
    /**********************************************************/
    casper.fillFormIngHomePay = function() {
        this.waitForUrl(/secure\.ogone/, function success() {
            this.click('input#btn_Accept');
            test.info("Done");
        }, function fail() {
            test.assertUrlMatch(/secure\.ogone/, "Payment Ogone page exists");
        }, 30000);
    },

    /**********************************************************/
    /*******                ONEY FACILY PAY                 ***/
    /**********************************************************/
    casper.fillFormOneyFacilyPay = function() {
        this.waitForUrl(/qefinancement/, function success() {
            this.fillSelectors('form#souscriptionPnf',{
                'select[name="civilite"]' : '1',
                'select[name="jourNaissance"]' : "01",
                'select[name="moisNaissance"]' : "01",
                'select[name="anneNaissance"]' : '1985',
                'select[name="departementNaissance"]' : '001',
                'input[name="lieuNaissance"]' : 'Nantes',
                'input[name="numCarte1"]' : '4974',
                'input[name="numCarte2"]' : '5202',
                'input[name="numCarte3"]' : '9047',
                'input[name="numCarte4"]' : '9170',
                'select[name="moiExpiration"]' : "12",
                'select[name="anneeExpiration"]' : '2020',
                'input[name="nomPorteurCarte"]' : 'TEST',
                'input[name="cryptogramme"]' : '123',
            } ,false)

            this.click('input#conditions-gen');
            this.click('a#bouton-validation-demande')
            test.info("Done");
        }, function fail() {
            test.assertUrlMatch(/qefinancement/, "Payment page exists");
        }, 10000);
    };

    /**********************************************************/
    /*******                ONEY BELFIUS                    ***/
    /**********************************************************/
    casper.fillFormDexiaDirectNet = function() {
        this.waitForUrl(/secure\.ogone/, function success() {
            this.click('input#submit1');
            this.waitForUrl(/netbanking_ACS/, function success() {
                this.click('input#btn_Accept');
                test.info("Done");
            }, function fail() {
                test.assertUrlMatch(/netbanking_ACS/, "Payment Ogone second page exists");
            });
        }, function fail() {
            test.assertUrlMatch(/orderstandard/, "Payment Ogone page exists");
        }, 15000);
    }

    /* Fill HiPayCC formular */
    casper.fillFormPaymentHipayCC = function(type, card) {
        this.fillSelectors('form#tokenizerForm', {
            'input[name="card-number"]': card,
            'input[name="card-holders-name"]': 'Mr Test',
            'input[name="expiry-month"]': '02',
            'input[name="expiry-year"]': '20',
            'input[class="expiry"]': '02 / 20',
            'input[name="cvc"]': '500'
        }, false);
    };

	casper.echo('Functions HiPay library loaded !', 'INFO');
    test.done();
});
