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

var parameters = require('./0000-parameters');

/**
 * FILL ALL HIPAY PAYMENT PAGE
 *
 * @param payment_product
 * @param test
 */
function fillPaymentFormularByPaymentProduct(payment_product, test) {
    casper.echo("Filling payment formular [ " + payment_product + " ]...", "INFO");
    switch (payment_product) {
        case "dexia-directnet":
            fillFormDexiaDirectNet(test);
            break;
        case "3xcb":
        case "4xcb":
            fillFormOneyFacilyPay(test);
            break;
        case "ing-homepay":
            fillFormIngHomePay(test);
            break;
        case "ideal":
            fillFormIDeal(test);
            break;
        case "sofort-uberweisung":
            fillFormSofort(test);
            break;
        case "postfinance-card":
            fillFormPostFinance(test);
            break;
        case "sisal":
            fillFormSisal(test);
            break;
        case "sdd":
            fillFormSdd(test);
            break;
        case "carte-cadeau":
            fillFormCarteCadeauOney(test);
            break;
        case "mybank":
            fillFormMyBank(test);
            break;
        default:
            test.fail('Filling payment product is not implemented by HiPay SDK Casper JS')
    }
}


/**
 * Fill formular according to the template, with or without iframe
 *
 * @param test
 * @param iframe
 */
function fillCCFormular(test, iframe) {
    var month = "12",
        year = "2020",
        code = "500";

    casper.wait(5000, function () {
        if (iframe) {

            casper.echo("Filling iframe", "INFO");

            casper.withFrame(0, function () {
                casper.withFrame(2, function () {
                    casper.sendKeys('input[name="cardnumber"]', parameters.cardsNumber.visa);
                });
            });

            casper.withFrame(0, function () {
                casper.withFrame(3, function () {
                    casper.sendKeys('input[name="cc-exp"]', '06/21');
                });
            });

            casper.withFrame(0, function () {
                casper.withFrame(4, function () {
                    casper.sendKeys('input[name="cvc"]', code);
                });
            });
            casper.withFrame(0, function () {
                this.thenClick('#submit-button', function () {
                    test.info("Done");
                });
            });

        } else {
            casper.waitForUrl(/payment\/web\/pay/, function success() {
                casper.echo("Filling iframe", "INFO");

                casper.withFrame(2, function () {
                    casper.sendKeys('input[name="cardnumber"]', parameters.cardsNumber.visa);
                });
                casper.withFrame(3, function () {
                    casper.sendKeys('input[name="cc-exp"]', '06/21');
                });
                casper.withFrame(4, function () {
                    casper.sendKeys('input[name="cvc"]', code);
                });

                casper.thenClick('#submit-button', function () {
                    test.info("Done");
                });
            }, function fail() {
                test.assertUrlMatch(/payment\/web\/pay/, "Hosted payment page exists");
            }, 10000);
        }
    });
}

/**
 * Fill SDD form
 *
 * @param test
 */
function fillFormSdd(test) {
    casper.echo("Filling payment formular...", "INFO");
    casper.waitForUrl(/payment\/pay\/reference/, function success() {
        casper.fillSelectors('#registrationform', {
            'select[name="gender"]': "male",
            'input[name="firstname"]': "TEST",
            'input[name="lastname"]': "TEST",
            'input[name="street"]': "Rue de la paix",
            'input[name="zip"]': "75000",
            'input[name="city"]': "PARIS",
            'select[name="country"]': "GB",
            'input[name="email"]': "email@yopmail.com"
        }, false);
        casper.thenClick('input[name="bankaccountselection"]', function () {
            casper.fillSelectors('#registrationform', {
                'input[name="iban"]': parameters.ibanNumber.gb,
                'input[name="bic"]': parameters.bicNumber.gb
            }, false);
            casper.click('body');
            casper.waitUntilVisible('div.ajaxsuccess', function success() {
                test.assertNotVisible('div.ajaxerror', "Correct IBAN and BIC number");
                casper.click('input#nyrosubmitfix');
                casper.echo("Done", "COMMENT");
                casper.echo("Submitting formular...", "INFO");
            }, function fail() {
                test.assertAllVisible('div.ajaxsuccess', "Succesful div block exists");
            });
        });
    }, function fail() {
        test.assertUrlMatch(/payment\/pay\/reference/, "Payment page exists");
    }, 10000);
}

/**
 * Fill SISAL form
 *
 * @param test
 */
function fillFormSisal(test) {
    casper.waitForUrl(/provider\/sisal/, function success() {
        casper.click('a#submit-button');
        casper.echo("Done", "COMMENT");
    }, function fail() {
        test.assertUrlMatch(/provider\/sisal/, "Payment page exists");
    }, 10000);
}


/**
 * Fill POST FINANCE form
 *
 * @param test
 */
function fillFormPostFinance(test) {
    casper.waitForUrl(/secure\.ogone/, function success() {
        casper.click('input#btn_Accept');
        casper.echo("Done", "COMMENT");
    }, function fail() {
        test.assertUrlMatch(/secure\.ogone/, "Payment page exists");
    }, 10000);
}

/**
 * Fill SOFORT form
 *
 * @param test
 */
function fillFormSofort(test) {
    casper.waitForUrl(/go\/select_country/, function success() {
        casper.fillSelectors('form#WizardForm', {
            'input[name="data[BankCode][search]"]': "Demo Bank",
        }, false);

        casper.waitForSelector('div#BankSearcherResultsContent a', function success() {
            casper.click('div#BankSearcherResultsContent a');

            casper.wait(4000, function () {
                casper.waitForUrl(/go\/login/, function success() {
                        casper.fillSelectors('form#WizardForm', {
                            'input[name="data[BackendForm][LOGINNAME__USER_ID]"]': "00000",
                            'input[name="data[BackendForm][USER_PIN]"]': "123456789"
                        }, false);
                        casper.click("form#WizardForm button");
                        casper.echo("Credentials inserted", "COMMENT");
                        casper.waitForUrl(/go\/select_account/, function success() {
                            casper.click("input#account-1");
                            casper.click("form#WizardForm button");
                            casper.echo("Account selected", "COMMENT");
                            casper.waitForUrl(/go\/provide_tan/, function success() {
                                casper.fillSelectors('form#WizardForm', {
                                    'input#BackendFormTAN': "12345"
                                }, false);
                                casper.click("form#WizardForm button");
                                casper.echo("TAN code inserted", "COMMENT");
                            }, function fail() {
                                test.assertUrlMatch(/go\/provide_tan/, "Payment TAN page exists");
                            }, 20000);
                        }, function fail() {
                            test.assertUrlMatch(/go\/select_account/, "Payment account page exists");
                        });
                    }, function fail() {
                        test.assertUrlMatch(/go\/login/, "Payment login page exists");
                    },
                    5000);
            });
        }, function fail() {
            test.assertExists('div#BankSearcherResultsContent a', "Select field exists");
        });

    }, function fail() {
        test.assertUrlMatch(/go\/select_country/, "Payment country page exists");
    }, 20000);
}

/**
 * Fill IDEAL Form
 *
 * @param test
 */
function fillFormIDeal(test) {
    casper.waitForUrl(/payment\/web\/pay/, function success() {
        casper.fillSelectors("form#form-payment", {
            'select[name="issuer_bank_id"]': "INGBNL2A"
        }, true);

        payIDeal(test);
    }, function fail() {
        test.assertUrlMatch(/payment\/web\/pay/, "Payment page exists");
    }, 15000);
}

/**
 * submit IDEAL form
 *
 * @param test
 */
function payIDeal(test) {
    casper.waitForUrl(/paymentscreen\/testmode/, function success() {
        casper.click('input[name="final_state"][value="paid"]');
        casper.click('#footer button.button');
        casper.echo("Done", "COMMENT");

    }, function fail() {
        test.assertUrlMatch(/paymentscreen\/testmode/, "Payment IDeal page exists");
    }, 15000);
}

/**
 * Fill ING HOME PAY Form
 * @param test
 */
function fillFormIngHomePay(test) {
    casper.waitForUrl(/secure\.ogone/, function success() {
        casper.click('input#btn_Accept');
        casper.echo("Done", "COMMENT");
    }, function fail() {
        test.assertUrlMatch(/secure\.ogone/, "Payment Ogone page exists");
    }, 30000);
}

/**
 * Fill ONEY FACILY PAY form
 *
 * @param test
 */
function fillFormOneyFacilyPay(test) {
    casper.waitForUrl(/qefinancement/, function success() {
        casper.fillSelectors('form#souscriptionPnf', {
            'select[name="civilite"]': '1',
            'select[name="jourNaissance"]': "01",
            'select[name="moisNaissance"]': "01",
            'select[name="anneNaissance"]': '1985',
            'select[name="departementNaissance"]': '001',
            'input[name="lieuNaissance"]': 'Nantes',
            'input[name="numCarte1"]': '4974',
            'input[name="numCarte2"]': '5202',
            'input[name="numCarte3"]': '9047',
            'input[name="numCarte4"]': '9170',
            'select[name="moiExpiration"]': "12",
            'select[name="anneeExpiration"]': '2020',
            'input[name="nomPorteurCarte"]': 'TEST',
            'input[name="cryptogramme"]': '123'
        }, false);

        casper.click('input#conditions-gen');
        casper.click('a#bouton-validation-demande');
        casper.echo("Done", "COMMENT");
    }, function fail() {
        test.assertUrlMatch(/qefinancement/, "Payment page exists");
    }, 10000);
}

/**
 * Fill BELFIUS Form
 *
 * @param test
 */
function fillFormDexiaDirectNet(test) {
    casper.waitForUrl(/secure\.ogone/, function success() {
        casper.click('input#submit1');
        casper.waitForUrl(/netbanking_ACS/, function success() {
            casper.click('input#btn_Accept');
            casper.echo("Done", "COMMENT");
        }, function fail() {
            test.assertUrlMatch(/netbanking_ACS/, "Payment Ogone second page exists");
        });
    }, function fail() {
        test.assertUrlMatch(/orderstandard/, "Payment Ogone page exists");
    }, 15000);
}

/**
 * Fill MyBank Form
 *
 * @param test
 */
function fillFormMyBank(test) {
    casper.waitForUrl(/ti\/simunionpay/, function success() {
        casper.fillSelectors("div#wrapper", {
            'input[name="cardNumber"]': parameters.cardsNumber.visa,
            'input[name="cvvCode"]': "123",
            'input[name="cardHolderName"]': "Test name"
        }, true);

        casper.waitForSelector(x('//button[text()="Make Payment"]'), function success() {
            casper.click(x('//button[text()="Make Payment"]'));

            casper.waitForSelector(x('//button[text()="Back to where you came from"]'), function success() {
                casper.click(x('//button[text()="Back to where you came from"]'));
            }, function fail() {
                test.fail('Error on MyBank Payment page');
            }, 20000);

        }, function fail() {
            test.fail('Error on MyBank Payment page');
        }, 20000);

    }, function fail() {
        test.assertUrlMatch(/simunionpay/, "Payment Ogone page exists");
    }, 15000);
}

/**
 * Fill CARTE CADEAU ONEY Form
 *
 * @param test
 */
function fillFormCarteCadeauOney(test) {
    casper.waitForUrl(/payment\/web\/pay/, function success() {
        casper.fillSelectors("form#form-payment", {
            'input[name="prepaid_card_number"]': parameters.giftCardNumber,
            'input[name="prepaid_card_security_code"]': parameters.giftCardCvv
        }, true);

    }, function fail() {
        test.assertUrlMatch(/payment\/web\/pay/, "Payment page exists");
    }, 15000);
}

/**
 * Fill HiPayCC formular
 *
 * @param type
 * @param card
 */
function fillFormPaymentHipayCC(type, card) {
    casper.fillSelectors('form#tokenizerForm', {
        'input[name="card-number"]': card,
        'input[name="card-holders-name"]': 'Mr Test',
        'input[name="expiry-month"]': '02',
        'input[name="expiry-year"]': '20',
        'input[class="expiry"]': '02 / 20',
        'input[name="cvc"]': '500'
    }, false);
}

module.exports = {
    fillPaymentFormularByPaymentProduct: fillPaymentFormularByPaymentProduct,
    payIDeal: payIDeal,
    fillCCFormular: fillCCFormular
};
