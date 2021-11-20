'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready on the modal form

// DESIGN NOTES:  We use sessionID server side cookie 'notABot' and an indicator on the page
// as to whether the bot test on the server was successful or not.  The cookie is what is used 
// to make the decision as to whether to allow the client action or not.  The page element indicator
// is used whether to decide to put the modal window test up or not.  If client hacks past this, they
// will get caught by the cookie.  However, if it is a legit human, the cookie will remember for x days
// that they passed and will not bug them with the modal window.

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
		const BOGUS = 'bogus_site_key';
		var G_RECAP_SITE_KEY = BOGUS
		
		//***************
		// Hide inputs and disable submit on startup
		//***************
		// hide the inputs we don't want users trying to access, recaptcha v3
		$('#id_g_recaptcha_response').hide();
		
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
		// Get the recaptcha token ready and hidden honeypot ready, when all data considered valid
		// and user hits enter or submit button, the form will submit by jquery-bootstrap-modal-forms-min.js.
		// This takes awhile but should be done by time human answers math question
		//***************
		grecaptcha.ready(function() {
			if ($('#sendServerLoc').text().toLowerCase() == "true") {
				G_RECAP_SITE_KEY = '6LcXoQ8aAAAAAFWEjH47SCbbrcT2ooody-kWuU_L';
				console.log("user using local server")
			} else {
				G_RECAP_SITE_KEY = '6LcyrzAaAAAAALM8nrmbURsAU9-KpQkGvFmDFz13';
				console.log("user using remote server")
			}
			console.log('setup recaptcha');
			//This is where we send data to the django form and to the server.
			grecaptcha.execute(G_RECAP_SITE_KEY, {action: 'bot_check_form'}).then(function(token) {
    			console.log('inside the recaptcha execute on token' + ' math pass= ' + mathQ_Pass);
				console.log('recaptcha token is ' + token);
				$('#id_g_recaptcha_response').val(token);
			});
			console.log('recaptcha setup done');
		});
		
	};

});
