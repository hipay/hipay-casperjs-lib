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
casper.test.begin('Functions', function (test) {

    casper.refillOneyGiftCard = function () {
        test.info('Prepaid card Number: ' + giftCardNumber);
        test.info('Prepaid card cvv: ' + giftCardCvv);
        this.thenOpen(urlGiftCardAction, {
            method: 'post',
            data: {
                'action': 'consult',
                'card-number': giftCardNumber,
                'cvv': giftCardCvv
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
            test.info('Prepaid card maximum amount: ' + maxAmount);
            test.info('Prepaid card current amount: ' + currentAmount);
            test.info('Prepaid card credit amount: ' + creditAmount);

            if (maxAmount > currentAmount) {
                // On crédite la carte pour qu'elle soit au maximum
                this.thenOpen(urlGiftCardAction, {
                    method: 'post',
                    data: {
                        'action': 'credit',
                        'card-number': giftCardNumber,
                        'cvv': giftCardCvv,
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
    };

    casper.echo('Functions HiPay library Utils loaded !', 'INFO');
    test.done();
});
