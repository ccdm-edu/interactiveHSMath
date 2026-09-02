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

	const ACTIVE_TOPIC = " <-- Current Topic";
	let activeVideoIndex = 0; // automatically make first video active

	function makeVideoActive(currVideoIndex) {
		activeVideoIndex = currVideoIndex;
		// need to make size of page bigger so buttons/footers float to correct place at bottom, since 
		// we are moving introducing page with Triggy to showing intro videos.
		let $videoIntroSection = $("#TrigMusicVideoIntro");
		if ($videoIntroSection) $videoIntroSection.style.height = '650px';

		// let user know which video is active
		let listItems = document.querySelectorAll('#VideoList > li');
		listItems.forEach((li, index) => {
			let $li = extendElement(li);

			if ($li.classList.contains('active')) {
				$li.removeClass('active');
				// go back to default color (css does that) and remove extra text
				let currText = $li.textContent;
				currText = currText.replace(ACTIVE_TOPIC, '');
				$li.textContent = currText;
			}

			if (index === activeVideoIndex) {
				$li.addClass('active');
				// change text of new active topic
				let currText = $li.textContent;
				$li.textContent = currText + ACTIVE_TOPIC;

				// swap out the video with new one
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
	function updateStatOutput() {
		// update all the text output to the user so they know status...
		$('#IntroFreqPeriod')?.text(avPer.toFixed(1));
		$('#IntroFreqHz')?.text((1 / avPer).toFixed(1));
		$('#IntroFreqBPM')?.text((60 / avPer).toFixed(1));

	}

	let currTime = 0; // accumulated time
	let timeIntoPeriod = 0; // resets on begin of every period
	let timerIsOn = false;
	let USER_NOT_INTERACTING = 10; // user hit button once and never again, not a desired outcome
	let numTimesClicked = 0;
	let lastTimeMarker = 0;
	let avPer = 0;
	let periodAccum = 0;

	let startInterval = setInterval(function() {
		if (timerIsOn) {
			currTime = currTime + 0.1; // add 100 ms everytime we come here
			timeIntoPeriod = timeIntoPeriod + 0.1;

			let $freqTime = $('#IntroFreqTime');
			let $freqTimeReset = $('#IntroFreqTimeReset');
			if ($freqTime) $freqTime.textContent = currTime.toFixed(1); // update time label
			if ($freqTimeReset) $freqTimeReset.textContent = timeIntoPeriod.toFixed(1);

			if ((avPer > 0) && (currTime - lastTimeMarker) > (2 * avPer)) {
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

			if ((currTime - lastTimeMarker) > USER_NOT_INTERACTING) {
				// user hit button once and never again, need to explain how this all works
				timerIsOn = false;
				currTime = 0;
				timeIntoPeriod = 0;
				numTimesClicked = 0;
				lastTimeMarker = 0;
				avPer = 0;
				periodAccum = 0;

				let $qualityInfo = $("#informUserFreqQuality");
				if ($qualityInfo) $qualityInfo.innerHTML = "Hit button on event start";
				console.log('user hit abnormal ending');
			}
		}
	}, 100);

	let $measureFreqBtn = $("#UserMeasuresFrequency");
	if ($measureFreqBtn) {
		$measureFreqBtn.on('click', function() {
			let $qualityInfo = $("#informUserFreqQuality");
			if (0 == numTimesClicked) {
				currTime = 0;
				timerIsOn = true;
				if ($qualityInfo) $qualityInfo.innerHTML = "";
				console.log('turn on timer');
			} else {
				let currPeriod = currTime - lastTimeMarker;
				periodAccum = periodAccum + currPeriod;
				avPer = periodAccum / numTimesClicked;
				timeIntoPeriod = 0;
				updateStatOutput();
				lastTimeMarker = currTime; // for next click
			}
			numTimesClicked = numTimesClicked + 1;
		});
	}

});
