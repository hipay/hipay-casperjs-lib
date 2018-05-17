/* Return 1D array from multiple dimensional array */
function concatTable(arrToConvert) {
    var newArr = [];
    for(var i = 0; i < arrToConvert.length; i++)
    {
        newArr = newArr.concat(arrToConvert[i]);
    }
    return newArr;
};
/* return random number between 2 specific numbers */
function randNumbInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var output = "",
    notif117 = true,
    reload = false;


casper.test.begin('Functions', function(test) {

    /* Open and send notificatiosn to server */
    casper.openAndExecNotifications = function(code) {
        /* Open Notification tab and opening this notifications details */
        casper.then(function() {
            this.echo("Opening Notification details with status " + code + " .... ", "INFO");
            this.openingNotif(code);
        })
        /* Get data from Notification with code */
        .then(function() {
            this.gettingData(code);
        })
        /* Execute shell script */
        .then(function() {
            this.execCommand(hash,false,pathGenerator);
        })
        /* Check CURL status code */
        .then(function() {
	    this.wait(2000,function() {
		this.checkCurl("200");
	    });
        })
    }

    casper.processNotifications = function(authorize,request,capture,partial,account) {
        casper.thenOpen(urlBackend,function() {
            if (loginBackend == '' && passBackend == '') {
                loginBackend = casper.cli.get('login-backend');
                passBackend = casper.cli.get('pass-backend');
            }

            if (!casper.getCurrentUrl().match(/dashboard/)) {
                this.logToHipayBackend(loginBackend,passBackend);
            } else {
                test.info("Already logged to HiPay backend");
            }
        })
        /* Select sub-account use for test*/
        .then(function() {
            this.selectAccountBackend(account);
        })
        /* Open Transactions tab */
        .then(function() {
            this.goToTabTransactions();
        })
        /* Search last created order */
        .then(function() {
            this.searchAndSelectOrder(cartID, false);
        })
        .then(function() {
            if (authorize) {
                this.openAndExecNotifications("116");
            }
        })
        .then(function() {
            if (request) {
                this.openAndExecNotifications("117");
            }
        })
        .then(function() {
            if (capture) {
                this.openAndExecNotifications("118");
            }
        })
        /* Check returned CURL status code 403 from this shell command */
        .then(function() {
            // TODO Implement correct http response in module
        })
    }

	casper.echo('Functions for notification loaded !', 'INFO');
	test.info("Based URL: " + baseURL);
    test.done();
});
