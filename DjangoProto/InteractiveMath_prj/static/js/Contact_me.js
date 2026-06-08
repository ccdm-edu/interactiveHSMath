'use strict'

// Replacing $(function() { ... }) with native standard DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

	// No buttons needed here - hide navigation via native style parameters
	let $nextBtn = $("#GoToNextPage");
	let $prevBtn = $("#GoToPreviousPage");
	if ($nextBtn) $nextBtn.style.display = 'none';
	if ($prevBtn) $prevBtn.style.display = 'none';

	// Hide the inputs we don't want users trying to access (reCAPTCHA v3 and honeypots)
	let $recapResponse = $('#id_g_recaptcha_response');
	let $poohFoodTest = $('#id_pooh_food_test');
	if ($recapResponse) $recapResponse.style.display = 'none';
	if ($poohFoodTest) $poohFoodTest.style.display = 'none';

	let doneRecaptcha = false;

	// User clicks on the box for accepting terms (or tabs to it) and we do the recaptcha behind the scenes
	let $acceptCheckbox = $('#id_clickwrap_accept');
	if ($acceptCheckbox) {
		$acceptCheckbox.on('click', function() {
			if (!doneRecaptcha) {
				const BOGUS = 'bogus_site_key';
				let G_RECAP_SITE_KEY = BOGUS;

				// Disable submit button until recaptcha token has come back and is ready to send to server
				let $submitBtn = $("#doContactUs");
				if ($submitBtn) $submitBtn.disabled = true;

				// If either of the honeypots are filled in, notify user when we post that we have a bot
				let recapValue = $recapResponse ? $recapResponse.value : "";
				let isPoohChecked = $poohFoodTest ? $poohFoodTest.checked : false;

				if (recapValue !== "" || isPoohChecked) {
					// Honeypot test failed, user is bot - natively toggle check state attribute safely
					if ($poohFoodTest) $poohFoodTest.setAttribute('checked', 'checked');
				}

				//***************
				// Get the recaptcha token ready and hidden honeypot ready. Give returned recaptcha token
				// back to server via form.
				//***************
				if (typeof grecaptcha !== 'undefined') {
					grecaptcha.ready(function() {
						// Get public recaptcha key from html context via sugar element helper
						let $publicSrc = $('#sendGRPublic');
						if ($publicSrc) {
							G_RECAP_SITE_KEY = $publicSrc.textContent;
						}

						// This is where we send data to the django form and to the server.
						grecaptcha.execute(G_RECAP_SITE_KEY, { action: 'ContactUsForm' }).then(function(token) {
							// Django will create this ID from the form - update input element value natively
							if ($recapResponse) {
								$recapResponse.value = token;
							}
							// Re-enable the form submit button now that the secure handshake token is ready
							if ($submitBtn) {
								$submitBtn.disabled = false;
							}
						});
					});
				}

				doneRecaptcha = true;
			}
		});
	}
});
