'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready on the modal form
$(function() {
	// need to wait till modal window comes up, problem is that the elements are already 
	// there and "ready" but have zero length and there is no event that fires off when the length >0 so 
	// we have to poll
	var timer;
	if ($("#RobotCheckModal").length > 0) {
		console.log('length is not zero at startup')
		// this will never happen, it does not power up in this state
	} else {
	      timer = setInterval(function(){
            if ($("#RobotCheckModal").length > 0) {
                sendRecaptchaData();
                clearInterval(timer);  
            }
        },100); 
    } 
	
	function sendRecaptchaData() {
		var mathQ_Pass = 0;
		var honey_Pass = "true"; // if user does nothing, they pass
		const BOGUS = 'bogus_site_key';
		var G_RECAP_SITE_KEY = BOGUS
		
		//***************
		// Hide inputs and disable submit on startup
		//***************
		// hide the two inputs we don't want users trying to access, honeypot and recaptcha v3
		$('#id_js_honey').hide();
		$('#id_g_recaptcha_response').hide();
		
		// want to hide the labels as well as inputs to "trap" a robot that doesn't load js
		var $jsLabel = $("label[for='"+$('#id_js_honey').attr('id')+"']");
		if ($jsLabel.length == 0) {
			// try again to hit the label
			$jsLabel = $('#id_js_honey').closest('label')
		}
		//we did our best, now try to hide it, if we can't hide label, oh well...
		$jsLabel.hide();
		
		var $grLabel = $("label[for='"+$('#id_g_recaptcha_response').attr('id')+"']");
		if ($grLabel.length == 0) {
			// try again to hit the label
			$grLabel = $('#id_g_recaptcha_response').closest('label')
		}
		//we did our best, now try to hide it
		$grLabel.hide();
		
		// disable submit button until recaptcha token has come back and is ready to send to server
		//$(".modal-footer button").prop("disabled",true);
		
		//***************
		//***************
		grecaptcha.ready(function() {
			$('#bot_check_form').submit(function(e) {
				e.preventDefault();
				console.log('hit the form submit');
				var form = this;
				//This is where we send data to the django form and to the server.
				grecaptcha.execute(G_RECAP_SITE_KEY, {action: 'bot_check_form'}).then(function(token) {
					console.log('inside the recaptcha execute on token, button pass = ' + honey_Pass + ' math pass= ' + mathQ_Pass);
					$('#id_js_honey').val(honey_Pass);
					$('#id_math_test').val(mathQ_Pass);
					$('#id_g_recaptcha_response').val(token);
					form.submit();
				});
			 });
		});

		//***************
		//***************
		$('#id_math_test').change( function() {
			
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
				mathQ_Pass = 1;
				console.log("user did pass math test")
			} else {
				mathQ_Pass = 0;
				console.log("user did NOT pass math test, user answer=" + user_answer)
			}

			//all params setup, now user can submit once recaptcha is ready
			//$(".modal-footer button").prop("disabled",false);
		});	
		
		//***************
		//***************
		// idea here is that bots dont always pull in the js to know a field is hidden, if they click on it, they fail test														
		$('#id_js_honey').on('change', function(){
			honey_Pass = "false";  // on click, user fails and is not a human
			console.log("bot is detected");		

		});
	};

});
