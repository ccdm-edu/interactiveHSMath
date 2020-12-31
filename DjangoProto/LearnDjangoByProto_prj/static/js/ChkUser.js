document.getElementById("test2").style.visibility = "hidden";
document.getElementById("test2Label").style.visibility = "hidden";


class RUaHuman {
	static mathQ_Pass = false;
	static button_Pass = true; // if user does nothing, they pass
	static numMoreTries = 3;
	
	static chkButtonClk()
	{
		this.button_Pass = false;  // on click, user fails and is not a human
		console.log("bot is detected");
	}
	static getCheckBoxRslt()
	{
		return this.button_Pass;
	}
	static chkMathQuest()
	{
		var user_answer = document.getElementById("test1").value;
		if ( (user_answer == "-2.3,3.4") || (user_answer == "3.4,-2.3") ) {
			this.mathQ_Pass = true;
		} else {
			this.mathQ_Pass = false;
		}
	}
	static getMathRslt()
	{
		return this.mathQ_Pass;
	}
}
grecaptcha.ready(function() {
	$('#chkUserRobot').submit(function(e) {
		var form = this;
		e.preventDefault();
		//This site key is for the dev 127.0.0.1 key
		grecaptcha.execute('6LcXoQ8aAAAAAFWEjH47SCbbrcT2ooody-kWuU_L', {action: 'chkUserRobot'}).then(function(token) {
			$('#check_box_tst').val(RUaHuman.getCheckBoxRslt());
			$('#challenge_tst').val(RUaHuman.getMathRslt());
			$('#recaptcha').val(token);
			form.submit();
		});

	 });
});

