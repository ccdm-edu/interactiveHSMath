var mathQ_Pass = false;
var button_Pass = true; // if user does nothing, they pass
var G_RECAP_SITE_KEY = 'bogus_site_key'

var mathChallengeAnswer = document.getElementById("turnIn3");
var mathChallengeLocal = document.getElementById("test1_math_local");
var mathChallengeRemote = document.getElementById("test1_math_remote");
var honPotChallenge = document.getElementById("test2_HP");

function chkButtonClk()
{
	button_Pass = false;  // on click, user fails and is not a human
	console.log("bot is detected");
}
function chkMathQuest(serverLoc)
{
	var user_answer;
	if (serverLoc.toLowerCase() == "local") {
		G_RECAP_SITE_KEY = '6LcXoQ8aAAAAAFWEjH47SCbbrcT2ooody-kWuU_L';
		user_answer = document.getElementById("test1_math_local").value;
		console.log("user using local server")
	} else if (serverLoc.toLowerCase() == "remote") {
		G_RECAP_SITE_KEY = '6LcyrzAaAAAAALM8nrmbURsAU9-KpQkGvFmDFz13';
		user_answer = document.getElementById("test1_math_remote").value;
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
	mathChallengeAnswer.style.display = "block";
}
grecaptcha.ready(function() {
	$('#chkUserRobot').submit(function(e) {
		var form = this;
		e.preventDefault();
		//This site key is for the dev 127.0.0.1 key
		console.log('recaptcha site key is '.concat(G_RECAP_SITE_KEY));
		grecaptcha.execute(G_RECAP_SITE_KEY, {action: 'chkUserRobot'}).then(function(token) {
			$('#check_box_tst').val(button_Pass);
			$('#challenge_tst').val(mathQ_Pass);
			$('#recaptcha').val(token);
			form.submit();
		});
		console.log('recaptcha has done initial execute');
	 });
});

// make the honeypot invisible if running JS, looking to distinguish bots and humans
document.getElementById("test2_HP").style.visibility = "hidden";
document.getElementById("test2Label").style.visibility = "hidden";

// set up observers who react to user change
// There has got to be a better way to distinguish local and remote server recaptcha.....  Need to read django debug 
// variable in javascript. Not sure how to do this yet...
// We can't use submit button for updating variables for form because it is also used to turn in form and could
// create race condition.
if (mathChallengeLocal != null)
{
	// we want it to fire when user hits CR on entry
	mathChallengeLocal.addEventListener('keypress', function(e) {if (e.key === 'Enter') {
																	chkMathQuest("local");
																	}
																}, false);
																	
}
if (mathChallengeRemote != null)
{
	// we want it to fire when submit is hit
	mathChallengeRemote.addEventListener('keypress', function(e) {if (e.key === 'Enter') {
																	chkMathQuest("local");
																	}
																}, false);
}
honPotChallenge.addEventListener('change', chkButtonClk, false);
