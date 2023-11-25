'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready on the modal form


$(function() {
	// hide the inputs we don't want users trying to access, recaptcha v3
	$('#id_g_recaptcha_response').css('display', 'none');  //.hide();
	$('#id_pooh_food_test').css('display', 'none');  //.hide();
	let doneRecaptcha = false;
	
	//user clicks on the box for accepting terms (or tabs to it) and we do the recaptcha behind the scenes
	$('#id_clickwrap_accept').on('click', function(){
		if (!doneRecaptcha) {
			const BOGUS = 'bogus_site_key';
			let G_RECAP_SITE_KEY = BOGUS
					
			// disable submit button until recaptcha token has come back and is ready to send to server
			$("#doContactUs").prop("disabled",true);
			
			// if either of the honeypots are filled in, notify user when we post that we have a bot 
			if ( ($('#id_g_recaptcha_response').val() != "") || ($('#id_pooh_food_test').prop('checked')) ) {
				//honeypot test failed, user is bot
				$('#id_pooh_food_test').attr('checked');
			}
			
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
				//This is where we send data to the django form and to the server.
				grecaptcha.execute(G_RECAP_SITE_KEY, {action: 'ContactUsForm'}).then(function(token) {
	    			console.log('inside the recaptcha execute on token');
					console.log('recaptcha token is ' + token);
					//django will create this ID from the form
					$('#id_g_recaptcha_response').val(token);
				});
				console.log('recaptcha setup done');
			});	
			doneRecaptcha = true;
		}; // if we havn't checked recaptcha, do it

	});
});
