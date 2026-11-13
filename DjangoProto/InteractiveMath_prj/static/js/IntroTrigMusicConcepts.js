/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      IntroTrigMusicConcepts
 * ============================================================================
 * 
 * DESCRIPTION:
 * Handle user interaction of page with corresponding name (i.e. test1.js handles user
 * interaction for test1.html which is styled by test1.css).  This page starts with 
 * animated professor bird explaining this section of the site then drops into review
 * videos on the main terms used:  frequency/period, sine/cosine, soundwaves/pitch frequency
 * The videos are hosted on Youtube and they are interactive, user is invited to 
 * measure frequencies using buttons run by this file.  
 * 
 * DEPENDENCIES:
 * SCRIPT_AUTO_DEMO is the script sent to autodemo.js to execute the automated demo of
 * how the page works as a tutorial to user.
 * - All static files, such as this js, are served over cloud service such as Cloudflare
 * 
 * ARCHITECTURE NOTES:
 * There is no jquery or bootstrap dependency, we do use a "sugar" file that has 
 *    the parts of those libraries we need but uses native HTML/JS:  jqBS-shorthand.js
 * 
 * FIRST PRODUCTION VERSION: 2026-06-07
 * AUTHOR:     C. DeMeyer (with Gemini AI assist)
 * ============================================================================
 */
'use strict'

// Replacing $(function() { ... }) with native standard DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

	// only execute if all is loaded
	// if Next button hit (in base template), set it up to go to intro page
	// Changing this button will also trigger in the IntMath.js which will change which page on index to left is active
	$("#GoToPreviousPage")?.hide();
	$("#GoToNextPage")?.on('click', () => window.location.href = "../MusicSineIntro");

	// on power up, hide all the review topics, they will assume proper location when the Triggy intro stuff goes away
	$$("#UserSelectionVideo, #video-resizable-container, #IntroConceptVideo, #IntroMusicInteractive").hide();

	// array not a list of actual filenames, only pointers into config file in binaries repo to get actual mp4 filename
	let VIDEO_EXPLN_FILENAMES = [];
	if (window.APP_CONFIG) {
		VIDEO_EXPLN_FILENAMES = [
			window.APP_CONFIG.FreqPeriodIntroLink,
			window.APP_CONFIG.SinCosIntroLink,
			window.APP_CONFIG.SoundwavePitchIntroLink
		];
	}

	const ACTIVE_TOPIC = "◀ Current Topic";
	let activeVideoIndex = 0; // automatically make first video active

	function makeVideoActive(currVideoIndex) {
		activeVideoIndex = currVideoIndex;
		// let user know which video is active
		let listItems = document.querySelectorAll('#VideoList > li');
		listItems.forEach((li, index) => {
			let $li = extendElement(li);

			if ($li.classList.contains('active')) {
				$li.removeClass('active');
				// go back to default color (css does that) and remove extra text
       			// Find and completely remove the old arrow span if it exists
       		    let oldBadge = $li.querySelector('.topic-badge');
                if (oldBadge) {
                	oldBadge.remove();
                }
            }

			if (index === activeVideoIndex) {
				$li.addClass('active');
				// change text of new active topic
				// Create an isolated HTML container for the arrow text
				let badge = document.createElement('span');
				badge.className = 'topic-badge';
				badge.textContent = ACTIVE_TOPIC;

				// Append it neatly right next to the title text
				$li.appendChild(badge);

				// Swap out the video with new one
				let tutorialVideo = $('#IntroConceptVideo');
				if (tutorialVideo && VIDEO_EXPLN_FILENAMES[index]) {
					tutorialVideo.src = VIDEO_EXPLN_FILENAMES[index];
				}
			}
		});
	}

	// this is called when either Triggy stops the intro or user instigates it
	function cleanOffPageAndReview() {
		// Hide all current elements from the Triggy intro
		$$("#Initial_MCexplaining, #trigIntro-controls, #TriggyIntroText, #ReviewConcepts").hide();

		// bring up all the new elements for review
		$$("#UserSelectionVideo, #video-resizable-container, #IntroConceptVideo").show();
		if ($("#IntroMusicInteractive")) $("#IntroMusicInteractive").style.display = "flex";

		makeVideoActive(0);
	}

	// user doesn't want to wait till end of Triggy's intro, clean off this page and go to review topics
	let $reviewConceptsBtn = $("#ReviewConcepts");
	if ($reviewConceptsBtn) {
		$reviewConceptsBtn.on('click', function() {
			// It may be user aborts intro by hitting review button, need to stop audio
			let audioControl = document.getElementById("trigIntro-controls");
			if (audioControl) {
				audioControl.currentTime = 0;
				audioControl.pause();
			}
			cleanOffPageAndReview();
		});
	}

	// intro speech is done, go to the review page.
	$("#trigIntro-controls")?.on('ended', cleanOffPageAndReview);


	// user is in review concepts mode and has selected a new topic
	let videoListItems = document.querySelectorAll('#VideoList > li');
	videoListItems.forEach((li) => {
		let $li = extendElement(li);
		$li.on('click', function() {
			let allItemsArray = Array.from(document.querySelectorAll('#VideoList > li'));
			let currIndex = allItemsArray.indexOf(li);
			makeVideoActive(currIndex);
		});
	});

	// user is measuring the frequency of something.
	// On first click, it will turn on the timer, For the next three clicks, it will measure a period.
	// If that period is fairly constant (std dev < 1/2 period), it will continue to measure period and print out the running average.
	// When a click comes that is more than the measured period, we will assume user is stopping measurement
	// and put up the final results and stop clock.
	// If the first few clicks are too erratic (std dev > 1/2 period). We will stop clock, zero everything out and put up warning.

	let currTime = 0.0; // accumulated time
	let timeIntoPeriod = 0.0; // resets on begin of every period
	let USER_NOT_INTERACTING = 15; // user hit button once and never again, not a desired outcome
	let numTimesClicked = 0;
	let lastTimeMarker = 0.0;
	let avPer = 0.0;
	let periodAccum = 0.0;
	let startTimer = null;
	let lastTickTime = 0;
	let lastClickTime = 0;
	
	function clearItOut(){
		clearInterval(startTimer);  //stop the timer
		startTimer = null;  // good practice to ensure no timer multiplicity
		currTime = 0.0;
		timeIntoPeriod = 0.0;
		numTimesClicked = 0;
		lastTimeMarker = 0.0;
		avPer = 0.0;
		periodAccum = 0.0;	
	}
	
	// update output to user of their clicking
	const NO_OUTPUT = "--";
	function updateStatOutput() {
		// update all the text output to the user so they know status...
		if (numTimesClicked > 1){
			//a valid period can be presented, user hit button more than once
			$('#IntroFreqPeriod')?.text(avPer.toFixed(1));
			$('#IntroFreqHz')?.text((1 / avPer).toFixed(1));
			$('#IntroFreqBPM')?.text((60 / avPer).toFixed(1));		
		} else {
			// user started timer by hitting once but did not measure anything within large number of sec
			$('#IntroFreqPeriod')?.text(NO_OUTPUT);
			$('#IntroFreqHz')?.text(NO_OUTPUT);
			$('#IntroFreqBPM')?.text(NO_OUTPUT);
		}
	}

	function timeUserEvents() {
		// If startTimerId is NOT null, a timer is already running. Exit immediately!
  		if (startTimer !== null) return; 
  		
  		//setInterval is not reliable enough to measure time, use it only for updates and
  		//to detect user is done measuring.  setInterval can be preempted by higher priority tasks
		startTimer = setInterval(function() {
			// need to keep this here, even though could be inaccurate, since when user stops hitting
			// click me button, need time to keep updating so they know...
			let now = performance.now();
			const deltaMs = now - lastTickTime; 
		    const deltaSeconds = deltaMs / 1000.0;
		    currTime = currTime + deltaSeconds;
		    timeIntoPeriod = timeIntoPeriod + deltaSeconds;
		    //reset the value for next time through
		    lastTickTime = now;
		    	
			let $freqTime = $('#IntroFreqTime');
			let $freqTimeReset = $('#IntroFreqTimeReset');
			if ($freqTime) $freqTime.textContent = currTime.toFixed(1); // update time label, may not be precise
			
			if ((avPer > 0) && ( (now - lastTimeMarker)/1000.0 > (2 * avPer) ) ) {
				// user has stopped hitting freq count button, this is a legitimate ending of counting
				updateStatOutput();
				// Time into period value only has meaning as user hits event button, not at end
				if ($freqTimeReset) $freqTimeReset.textContent = NO_OUTPUT;  
				clearItOut();
			} else if ((0 == avPer) && ( (now - lastTimeMarker)/1000.0 > USER_NOT_INTERACTING ) ) {
				// user hit button once and never again, need to explain how this all works
				clearItOut();

				let $qualityInfo = $("#informUserFreqQuality");
				if ($qualityInfo) $qualityInfo.innerHTML = "Hit button on every event";
			} else {
				// user is still measuring frequency
				if ($freqTimeReset) $freqTimeReset.textContent = timeIntoPeriod.toFixed(1);
			}

		}, 200);		
	}

		    
	// user is hitting button, we measure the frequency of this and update to user on every button click
	// use event timestamp to compensate for fact this routine is sometimes delayed
	
	//Having problem with double bounce on order of 150ms??  eliminate it and dont try to measure frequencies
	//above 1.9Hz
	const MIN_PERIOD_MS = 500; 
	//using vanilla js to ensure timing is as accurate as possible
	document.getElementById("UserMeasuresFrequency").addEventListener('pointerdown', function(e){
			 // Ignore secondary fingers, palm brushes, or multi-touch events
        	if (e.isPrimary === false) return;
        	let now = e.timeStamp;
	        // Ignore hardware switch bounce / impossible sub-50ms double triggers
	        if (numTimesClicked > 0 && (now - lastClickTime) < MIN_PERIOD_MS) {
	            console.warn(`Ignored bounce/rogue event (${(now - lastClickTime).toFixed(1)}ms) from ${e.pointerType}`);
	            return;
	        }

			let $qualityInfo = $("#informUserFreqQuality");
			numTimesClicked = numTimesClicked + 1;
			if (1 == numTimesClicked) {
				// just starting, set up and go
				currTime = 0;
				lastTimeMarker = now;
				lastTickTime = now;
				lastClickTime = now;
				timeUserEvents();  // turn on timer once at begin for updates only
				if ($qualityInfo) $qualityInfo.innerHTML = "";
			} else {
				const deltaMs = now - lastClickTime; 
		    	const deltaSeconds = deltaMs / 1000.0;

		    	// Accumulate the real time passed since user last clicked
				periodAccum = periodAccum + deltaSeconds;
				avPer = periodAccum / (numTimesClicked - 1);  //2 clicks define 1 period, 3 clicks define 2 periods
				//console.log('currPeriod is '+deltaSeconds+' periodAccum is '+periodAccum+' avPer is '+avPer);
				timeIntoPeriod = 0;
				
				// Move the baseline forward
		    	lastClickTime = now;
		    	lastTimeMarker = now;
				
			}
			updateStatOutput();
		});

});
