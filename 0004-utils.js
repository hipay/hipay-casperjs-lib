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

var parameters = require('0000-parameters');

function refillOneyGiftCard(test) {
    casper.echo('Prepaid card Number: ' + parameters.giftCardNumber, "COMMENT");
    casper.echo('Prepaid card cvv: ' + parameters.giftCardCvv, "COMMENT");
    casper.thenOpen(parameters.urlGiftCardAction, {
        method: 'post',
        data: {
            'action': 'consult',
            'card-number': parameters.giftCardNumber,
            'cvv': parameters.giftCardCvv
        }
    }).waitForUrl(/gift-card\.php$/, function success() {
        var maxAmountHTML = this.evaluate(function () {
            return document.querySelector('p.data-print-row:nth-child(10)').innerHTML.replace(',', '.');
        });
        var currentAmountHTML = this.evaluate(function () {
            return document.querySelector('p.data-print-row:nth-child(12)').innerHTML.replace(',', '.');
        });

        var maxAmount = parseFloat(maxAmountHTML);
        var currentAmount = parseFloat(currentAmountHTML);

        var creditAmount = maxAmount - currentAmount;
        casper.echo('Prepaid card maximum amount: ' + maxAmount, "COMMENT");
        casper.echo('Prepaid card current amount: ' + currentAmount, "COMMENT");
        casper.echo('Prepaid card credit amount: ' + creditAmount, "COMMENT");

        if (maxAmount > currentAmount) {
            // On crédite la carte pour qu'elle soit au maximum
            casper.thenOpen(parameters.urlGiftCardAction, {
                method: 'post',
                data: {
                    'action': 'credit',
                    'card-number': parameters.giftCardNumber,
                    'cvv': parameters.giftCardCvv,
                    'amount': creditAmount
                }
            }).then(function () {
                var currentCreditedAmount = this.evaluate(function () {
                    return parseInt(document.querySelector('p.data-print-row:nth-child(12)').innerHTML);
                });
                test.assertEquals(maxAmount, currentCreditedAmount, 'Current prepaid card amount equals to' +
                    ' maximum amount');
            })
        } else {
            test.assertEquals(maxAmount, currentAmount, 'Current prepaid card amount equals to maximum amount');
        }

    }, function fail() {
        test.assertUrlMatch(/urlGiftCardAction/, "urlGiftCardAction page exists");
    }, 25000);
}

module.exports = {
    refillOneyGiftCard: refillOneyGiftCard
};

