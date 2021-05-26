'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	var mathQ_Pass = false;
	var button_Pass = true; // if user does nothing, they pass
	var G_RECAP_SITE_KEY = 'bogus_site_key'
	
	grecaptcha.ready(function() {
		$('#chkUserRobot').submit(function(e) {
			var form = this;
			e.preventDefault();
			//This is where we send data to the django form and to the server.
			grecaptcha.execute(G_RECAP_SITE_KEY, {action: 'chkUserRobot'}).then(function(token) {
				$('#check_box_tst').val(button_Pass);
				$('#challenge_tst').val(mathQ_Pass);
				$('#recaptcha').val(token);
				form.submit();
			});
			console.log('recaptcha has done initial execute');
		 });
	});
	
	// make the honeypot invisible if running JS, looking to distinguish bots and humans, dont want this in CSS
	$('#test2_HP').hide();
	$('#test2Label').hide();
	
	// set up observers who react to user change
	// We can't use submit button for updating variables for form because it is also used to turn in form and could
	// create race condition.
	// we want it to fire when user hits CR on entry, keypress is obsolete, change responds to entry of value
	
	$('#test1_math').on('change',function()
	{
		var user_answer = this.value;
		if ($('#sendServerLoc').text().toLowerCase() == "true") {
			G_RECAP_SITE_KEY = '6LcXoQ8aAAAAAFWEjH47SCbbrcT2ooody-kWuU_L';
			console.log("user using local server")
		} else {
			G_RECAP_SITE_KEY = '6LcyrzAaAAAAALM8nrmbURsAU9-KpQkGvFmDFz13';
			console.log("user using remote server")
		}
		// pull out all spaces
		user_answer = user_answer.replace(/\s+/g,'');
		if (user_answer == "12") {
			mathQ_Pass = true;
			console.log("user did pass math test")
		} else {
			mathQ_Pass = false;
			console.log("user did NOT pass math test, user answer=" + user_answer)
		}
		// NOW, unhide the submit function key...
		$('#turnIn3').css("display", "block");
	});
	
	// idea here is that bots dont always pull in the js to know a button is hidden, if they click on it, they fail test														
	$('#test2_HP').on('change', function(){
		button_Pass = false;  // on click, user fails and is not a human
		console.log("bot is detected");
	});

});
