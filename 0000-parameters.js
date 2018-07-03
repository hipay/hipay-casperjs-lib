module.exports = {
    cardsNumber: {
        visa: "4111111111111111",
        cb: "5234131094136942",
        visa_3ds: "4000000000000002",
        amex: "374111111111111",
        maestro: "6766000000000"
    },
    ibanNumber: {
        gb: "GB29NWBK60161331926819",
        fr: "FR1420041010050500013M02606"
    },
    bicNumber: {
        gb: "PSSTFRPPXXX",
        fr: "PSSTFRPPXXX"
    },
    urlGiftCardAction: casper.cli.get('gift-card-url'),
    giftCardNumber: casper.cli.raw.get('gift-card-number'),
    giftCardCvv: casper.cli.get('gift-card-cvv')
};
