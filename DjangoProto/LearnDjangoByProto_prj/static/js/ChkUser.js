var mathQ_Pass = false;
var button_Pass = true; // if user does nothing, they pass
var G_RECAP_SITE_KEY = 'bogus_site_key'

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
var mathChallengeAnswer = document.getElementById("turnIn3");
var mathChallengeLocal = document.getElementById("test1_math_local");
if (mathChallengeLocal != null)
{
	// we want it to fire when submit is hit
	mathChallengeAnswer.addEventListener('click', function(){chkMathQuest("local")}, false);
}
var mathChallengeRemote = document.getElementById("test1_math_remote");
if (mathChallengeRemote != null)
{
	// we want it to fire when submit is hit
	mathChallengeAnswer.addEventListener('click', function(){chkMathQuest("remote")}, false);
}
var honPotChallenge = document.getElementById("test2_HP");
honPotChallenge.addEventListener('change', chkButtonClk, false);
