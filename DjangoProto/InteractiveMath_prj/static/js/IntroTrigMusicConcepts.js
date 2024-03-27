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
	$("#UserSelectionVideo").css('display', 'none');
	$("#IntroConceptVideo").css('display', 'none');
	$("#IntroMusicInteractive").css('display', 'none');
	// array not a list of actual filenames, only pointers into config file in binaries repo to get actual mp4 filename
	let VIDEO_EXPLN_FILENAMES = ["IntroToFrequencyVideo", "IntroToTrigVideo", "IntroToSoundVideo"]
	getActualFilename(VIDEO_EXPLN_FILENAMES[0])
   		.done(resp1 => {
			  	VIDEO_EXPLN_FILENAMES[0] = resp1;
			  	// these should be fast, in case previous one had to open file all this is now cached
			  	getActualFilename(VIDEO_EXPLN_FILENAMES[1])
			  	.done(resp2 => VIDEO_EXPLN_FILENAMES[1] = resp2)
			  	getActualFilename(VIDEO_EXPLN_FILENAMES[2])
			  	.done(resp2 => VIDEO_EXPLN_FILENAMES[2] = resp2)
			  	});
	const ACTIVE_TOPIC = "     <-- Current Topic";
	function makeVideoActive(currVideoIndex){
		activeVideoIndex = currVideoIndex;
		// need to make size of page bigger so buttons/footers float to correct place at bottom
		$("#TrigMusicVideoIntro").css('height', '650px');
		// let user know which video is active
		$('#VideoList > li').each(function(index) {
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
		$("#UserSelectionVideo").css('display', 'block');
		$("#IntroConceptVideo").css('display', 'block');
		$("#IntroMusicInteractive").css('display', 'flex');
		makeVideoActive(0);	
	}
	// user doesn't want to wait till end of Triggy's intro, clean off this page and go to review topics
	$("#ReviewConcepts").on('click', function() {
		//It may be user aborts intro by hitting review button, need to stop audio
		$("#trigIntro-controls").currentTime = 0;
		//use [] to return html dom object from jquery object
		$("#trigIntro-controls")[0].pause();
		cleanOffPageAndReview();
    });
    // intro speech is done, go to the review page.
    $("#trigIntro-controls").on('ended', function(){
		cleanOffPageAndReview();
    });
    
    
    // if audio is complete, do same as if user had hit the Review Concepts button
    
    // user is in review concepts mode and has selected a new topic
    $('#VideoList > li').on('click', function(){
		let currIndex = $('#VideoList > li').index($(this));
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