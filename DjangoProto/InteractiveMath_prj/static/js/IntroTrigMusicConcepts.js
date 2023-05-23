'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	//since this is on template and dont need it here...
	$('a[href="#AdvancedTopics"]').css('display', 'none');
	
	// only execute if all is loaded
	//if Next  button hit (in base template), set it up to go to intro page
	//Changing this button will also trigger in the IntMath.js which will change which page on index to left is active
	$("#GoToNextPage").wrap('<a href="../MusicSineIntro"></a>');

	// on power up, hide all the review topics, they will assume proper location when the Triggy intro stuff goes away
	$("#IntroToConceptList").css('display', 'none');
	$("#IntroConceptVideo").css('display', 'none');
	$("#IntroMusicInteractive").css('display', 'none');
	const VIDEO_EXPLN_FILENAMES = ["../../static/VideoExpln/IntroToFrequencyEtc_MedQualityHD720p.mp4", "../../static/VideoExpln/IntroSineCosine_MedQualHD720p.mp4", "IntroToAudioTones.mp4"]
	const BAD_FREQ_STABILITY = "Frequency isn't stable"
	const REPORT_FREQ_ACCURACY = ""
	const ACTIVE_TOPIC = "     <-- Current Topic";
	const VIDEO_LIST = ["FreqPeriod.mp4", "SinCos.mp4", "SoundPitch.mp4"];
	function makeVideoActive(currVideoIndex){
		activeVideoIndex = currVideoIndex;
		// let user know which video is active
		$('#IntroToConceptList > li').each(function(index) {
  			if ($(this).hasClass('active')) {
				$(this).removeClass('active');  
				// go back to default color (css does that) and remove extra text
				let currText = $(this).text();
				currText = currText.replace(ACTIVE_TOPIC, '');
				$(this).text(currText);
			};
			if (index == activeVideoIndex) {
				$(this).addClass('active');
				//change text of new active topic
				let currText =$(this).text();
				$(this).text(currText + ACTIVE_TOPIC);
				// swap out the video with new one
				let tutorialVideo = $('#IntroConceptVideo')[0];
				tutorialVideo.src = VIDEO_EXPLN_FILENAMES[index];
				tutorialVideo.load();				
			}
		});
	}
	
	
	let activeVideoIndex = 0;  //automatically make first video active
	// this is called when either Triggy stops the intro or user instigates it
	function cleanOffPageAndReview() {
		// Hide all current elements from the Triggy intro		
		$("#Initial_MCexplaining").css('display', 'none');
		 $("#trigIntro-controls").css('display', 'none');
		$("#TriggyIntroText").css('display', 'none');
		$("#ReviewConcepts").css('display', 'none');
		// bring up all the new elements for review
		$("#IntroToConceptList").css('display', 'block');
		$("#IntroConceptVideo").css('display', 'block');
		$("#IntroMusicInteractive").css('display', 'flex');
		makeVideoActive(0);	
	}
	// user doesn't want to wait till end of Triggy's intro, clean off this page and go to review topics
	$("#ReviewConcepts").on('click', function() {
		cleanOffPageAndReview();
    });
    
    // if audio is complete, do same as if user had hit the Review Concepts button
    
    // user is in review concepts mode and has selected a new topic
    $('#IntroToConceptList > li').on('click', function(){
		let currIndex = $('#IntroToConceptList > li').index($(this));
		makeVideoActive(currIndex);
	});
	
	// user is measuring the frequency of something.  
	// On first click, it will turn on the timer, For the next three clicks, it will measure a period.
	// If that period is fairly constant (std dev < 1/2 period), it will continue to measure period and print out the running average.  
	// When a click comes that is more than the measured period, we will assume user is stopping measurement 
	// and put up the final results and stop clock. 
	// If the first few clicks are too erratic (std dev > 1/2 period).  We will stop clock, zero everything out and put up warning.
	function updateStatOutput() {
		// update all the text output to the user so they know status...
		$('#IntroFreqPeriod').text(avPer.toFixed(1));
		$('#IntroFreqHz').text((1/avPer).toFixed(1));
		$('#IntroFreqBPM').text((60/avPer).toFixed(1))
	}
	let currTime = 0;  // accumulated time
	let timeIntoPeriod = 0;  // resets on begin of every period
	let timerIsOn = false;
	let USER_NOT_INTERACTING = 10; //user hit button once and never again, not a desired outcome
	let startInterval = setInterval(function(){
		if (timerIsOn){
			currTime = currTime + 0.1; // add 100 ms everytime we come here	
			timeIntoPeriod = timeIntoPeriod + 0.1;	
			$('#IntroFreqTime').text(currTime.toFixed(1));  // update time label	
			$('#IntroFreqTimeReset').text(timeIntoPeriod.toFixed(1));
			if ( (avPer > 0) && (currTime - lastTimeMarker) > (2 * avPer) ) {
				// user has stopped hitting freq count button, this is a legitimate ending of counting
				updateStatOutput();
				timerIsOn = false;
				currTime = 0;
				timeIntoPeriod = 0;
				numTimesClicked = 0;
				lastTimeMarker = 0;
				avPer = 0;
				periodAccum = 0;
				console.log('user hit natural ending');
			}
			if ( (currTime - lastTimeMarker) > USER_NOT_INTERACTING ) {
				// user hit button once and never again, need to explain how this all works 
				timerIsOn = false;
				currTime = 0;
				timeIntoPeriod = 0;
				numTimesClicked = 0;
				lastTimeMarker = 0;
				avPer = 0;
				periodAccum = 0;
				$("#informUserFreqQuality").html("Hit button on event start");
				console.log('user hit abnormal ending');
			}
		}
    }, 100);
	let numTimesClicked = 0;
	let lastTimeMarker = 0;
	let avPer = 0;
	let periodAccum = 0;
	$("#UserMeasuresFrequency").on('click', function() {
		if (0 == numTimesClicked) {
			currTime = 0;
			timerIsOn = true;
			$("#informUserFreqQuality").html("");
			console.log('turn on timer');
		} else {
			let currPeriod = currTime - lastTimeMarker;
			periodAccum = periodAccum + currPeriod;
			avPer = periodAccum/numTimesClicked;
			timeIntoPeriod = 0;
			updateStatOutput();
			lastTimeMarker = currTime;  // for next click
		}	
		numTimesClicked = numTimesClicked + 1;
    });
	

})