document.getElementById("test2").style.visibility = "hidden";
document.getElementById("test2Label").style.visibility = "hidden";


class RUaHuman {
	static mathQ_Pass = false;
	static button_Pass = true; // if user does nothing, they pass
	static numMoreTries = 3;
	static G_RECAP_SITE_KEY = 'bogus_site_key'
	
	static chkButtonClk()
	{
		this.button_Pass = false;  // on click, user fails and is not a human
		console.log("bot is detected");
	}
	static getCheckBoxRslt()
	{
		return this.button_Pass;
	}
	static chkMathQuest(serverLoc)
	{
		var user_answer = document.getElementById("test1").value;
		// pull out all spaces
		user_answer = user_answer.replace(/\s+/g,'');
		if (user_answer == "12") {
			this.mathQ_Pass = true;
			console.log("user did pass math test")
		} else {
			this.mathQ_Pass = false;
			console.log("user did NOT pass math test")
		}
		if (serverLoc.toLowerCase() == "local") {
			this.G_RECAP_SITE_KEY = '6LcXoQ8aAAAAAFWEjH47SCbbrcT2ooody-kWuU_L';
			console.log("user using local server")
		} else if (serverLoc.toLowerCase() == "remote") {
			this.G_RECAP_SITE_KEY = '6LcyrzAaAAAAALM8nrmbURsAU9-KpQkGvFmDFz13';
			console.log("user using remote server")
		}
	}
	static getMathRslt()
	{
		return this.mathQ_Pass;
	}
	static getRecapSiteKey()
	{
		return this.G_RECAP_SITE_KEY
	}

}
grecaptcha.ready(function() {
	$('#chkUserRobot').submit(function(e) {
		var form = this;
		e.preventDefault();
		//This site key is for the dev 127.0.0.1 key
		console.log('recaptcha site key is '.concat(RUaHuman.getRecapSiteKey()));
		grecaptcha.execute(RUaHuman.getRecapSiteKey(), {action: 'chkUserRobot'}).then(function(token) {
			$('#check_box_tst').val(RUaHuman.getCheckBoxRslt());
			$('#challenge_tst').val(RUaHuman.getMathRslt());
			$('#recaptcha').val(token);
			form.submit();
		});
		console.log('recaptcha has done initial execute');
	 });
});

