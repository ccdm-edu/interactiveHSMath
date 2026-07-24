/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      MusicNotesTrig.js
 * ============================================================================
 * 
 * DESCRIPTION:
 * Handle user interaction of page with corresponding name (i.e. test1.js handles user
 * interaction for test1.html which is styled by test1.css).  On this page we have musicians
 * tuning notes which we parse and plot to compare to the sine wave pitch frequency for that note.
 * 
 * 
 * DEPENDENCIES:
 * SCRIPT_AUTO_DEMO is the script sent to autodemo.js to execute the automated demo of
 * how the page works as a tutorial to user.
 * - All static files, such as this js, are served over cloud service such as Cloudflare
 * 
 * ARCHITECTURE NOTES:
 *
 * There is no jquery or bootstrap dependency, we do use a "sugar" file that has 
 *    the parts of those libraries we need but uses native HTML/JS:  jqBS-shorthand.js
 * 
 * FIRST PRODUCTION VERSION: 2026-06-07
 * AUTHOR:     C. DeMeyer (with Gemini AI assist)
 * ============================================================================
 */
'use strict'

// Native DOMContentLoaded listener replaces legacy $(function() { ... })
document.addEventListener('DOMContentLoaded', () => {

	// Framework-free DOM helper replaces legacy jQuery .wrap() utilities
	// Helper function to handle wrapping nodes natively
	// WrapNode purpose: It dynamically injects a new structural parent element around an existing element to 
	//change how that element behaves visually or structurally on the page.  It allows a page to change via js.
	const wrapNode = (el, wrapperType) => {
		let wrapper = document.createElement(wrapperType);
		el.parentNode.insertBefore(wrapper, el);
		wrapper.appendChild(el);
		return wrapper;
	};

	let nextBtn = document.getElementById("GoToNextPage");
	if (nextBtn) wrapNode(nextBtn, "a").href = "../MusicSineSummary";

	let prevBtn = document.getElementById("GoToPreviousPage");
	if (prevBtn) wrapNode(prevBtn, "a").href = "../ToneTrig";

	// Handle user layout state level mapping
	let newbieMode = sessionStorage.getItem('UserIsNew');
	let stopModal = true;
	let $startDemo = $("#startAutoDemo");

	if (newbieMode && (newbieMode.toLowerCase() === "true")) {
		if ($startDemo) $startDemo.classList.add('newbieMode');
	} else if (newbieMode && (newbieMode.toLowerCase() === 'false')) {
		stopModal = false;
	} else {
		if ($startDemo) $startDemo.classList.add('newbieMode');
	}

	const volNoteOnEl = document.querySelector(".allowNotePlay .VolOn");
	const volNoteOffEl = document.querySelector(".allowNotePlay .VolOff");
	const volToneOnEl = document.querySelector(".toneStartButton .VolOn");
	const volToneOffEl = document.querySelector(".toneStartButton .VolOff");

	// Guard clause: Exit safely if the elements aren't present on this specific page
	if (!volNoteOnEl || !volNoteOffEl || !volToneOnEl || !volToneOffEl) return;

	// Extend them using js-shorthand.js library helpers
	const $noteVolOn = extendElement(volNoteOnEl);
	const $noteVolOff = extendElement(volNoteOffEl);
	const $toneVolOn = extendElement(volToneOnEl);
	const $toneVolOff = extendElement(volToneOffEl);
	
	// Frequency constants for Bflat tracking definitions
	const C5_FREQ = 466.16;
	const C4_FREQ = 233.08;
	let currFreq = C5_FREQ;
	let noteIsOnNow = false;
	let ToneIsOnNow = false;

	// Safely interface third party audio components if initialized
	let osc = (typeof Tone !== 'undefined') ? new Tone.Oscillator() : { frequency: { value: 0 } };

	const UNSELECTED = -1;
	let tuneState = [];
	let currTuneState = UNSELECTED;
	let tuneExpln = [];
	let tuneFilenameURL = [];
	let tuneToDo = [];
	let tuneInstrument = [];
	let tuneMusicalNote = [];
	let tuneTitle = [];
	let tuneBuffer = [];
	let tuneOffset = [];
	let tuneFundamentalFreq = [];
	let tuneGraphLong = [[]];
	let noteFilePoint = [];

	const C5_NOTE = "C<sub>5</sub>";
	const C4_NOTE = "C<sub>4</sub>";
	const BFLAT4_NOTE = "B<sup><span>♭</span></sup><sub>4</sub>";

	const NOTE_MAPPING = new Map([
		["C5", C5_NOTE], ["C4", C4_NOTE], ["B4flat", BFLAT4_NOTE]
	]);

	const DEFAULT_TITLE = "Musical Notes <br>and Underlying Trig";
	let $musicalActivity = $("#musicalActivity");
	if ($musicalActivity) $musicalActivity.innerHTML = DEFAULT_TITLE;

	let timeMsLong = [];
	let ampLong = [];
	let ampLongCurrNote = [];
	const NUM_PTS_PLOT_LONG = 1000;
	const DURATION_LONG_PLOT_MS = 10;
	//sample period in sec
	// yes, these are ridiculously high rates, didn't want to have ANY sampling artifacts in plots...
	const samplePeriodLong = DURATION_LONG_PLOT_MS / (1000 * NUM_PTS_PLOT_LONG);

	function fillInArrays() {
		let i;
		for (i = 0; i <= NUM_PTS_PLOT_LONG; i++) {
			ampLong[i] = 10.0 * Math.sin(2 * Math.PI * (currFreq * i * samplePeriodLong));
			timeMsLong[i] = roundFP(i * samplePeriodLong * 1000, 3);

			if (tuneGraphLong[currTuneState] != null) {
				ampLongCurrNote[i] = 10 * tuneGraphLong[currTuneState][i];
			}
		}
	};

	function drawTone() {
		fillInArrays();
		if (typeof sine_plot_100_1k !== 'undefined') {
			sine_plot_100_1k.update();
		}
	};

	function updateFreq() {
		let newToneFreq = tuneFundamentalFreq[currTuneState];
		let $freqLabel = $("#currFreqLabel");
		if ($freqLabel) $freqLabel.textContent = newToneFreq;

		currFreq = newToneFreq;
		osc.frequency.value = currFreq;
	}

	//*********************************** 
	// show periodicity as musical instrument comes up with the pitch freq 
	//*********************************** 
	// Setup Path Drawing Context Natively
	let ctxPeriod;
	let expandTimeCanvas = document.getElementById("periodicityIndicator");
	if (expandTimeCanvas) {
		ctxPeriod = expandTimeCanvas.getContext('2d');
	} else {
		console.error('Cannot obtain timeExpand context');
	};

	let backgroundPlot;
	if (ctxPeriod && expandTimeCanvas) {
		backgroundPlot = ctxPeriod.getImageData(0, 0, expandTimeCanvas.width, expandTimeCanvas.height);
	}

	let root = document.documentElement;
	let rootStyles = window.getComputedStyle(root);
	let LEFT_EDGE_X = parseInt(rootStyles.getPropertyValue('--LEFT_EDGE_PLOT').replace('px', '')) || 0;
	let LEFT_EDGE_Y = parseInt(rootStyles.getPropertyValue('--TOP_EDGE_PLOT').replace('px', '')) || 0;

	function showPeriodicity(freqSelect) {
		if (!ctxPeriod) return;
		ctxPeriod.putImageData(backgroundPlot, 0, 0);

		let $perText1 = $('#Period_Text1');
		let $perText2 = $('#Period_Text2');

		if (currTuneState == UNSELECTED) {
			if ($perText1) $perText1.style.visibility = "hidden";
			if ($perText2) $perText2.style.visibility = "hidden";
			return;
		}

		const LEFT_X = 20;
		const MARKER_Y_UP = LEFT_EDGE_Y - 100;
		const MARKER_Y_DOWN = LEFT_EDGE_Y + 45;

		if ($perText1) $perText1.style.visibility = "visible";
		if ($perText2) $perText2.style.visibility = "visible";

		if (C4_FREQ == freqSelect) {
			const SHORT_T = parseInt(rootStyles.getPropertyValue('--WIDTH_466HZ').replace('px', '')) || 0;
			const DOUBLE_T = 2 * SHORT_T;

			let $perTone = $('.Period_Tone');
			if ($perTone) $perTone.style.width = DOUBLE_T + 'px';

			let $firstP = $('.First_Period');
			let $secondP = $('.Second_Period');
			let $thirdP = $('.Third_Period');
			let $fourthP = $('.Fourth_Period');

			if ($firstP) $firstP.style.visibility = "visible";
			if ($secondP) $secondP.style.visibility = "visible";
			if ($thirdP) $thirdP.style.visibility = "hidden";
			if ($fourthP) $fourthP.style.visibility = "hidden";

			const NEW_PERIOD_BOX_LEFT = LEFT_EDGE_X + DOUBLE_T;
			if ($secondP) $secondP.style.left = NEW_PERIOD_BOX_LEFT + 'px';

			if ($perText1) $perText1.innerHTML = 'Period T <br>= 1/Frequency = 1/(233.08 Hz) = 4.29 ms';
			if ($perText2) {
				$perText2.style.left = (NEW_PERIOD_BOX_LEFT + SHORT_T) + 'px';
				$perText2.innerHTML = 'T = 4.29 ms';
			}

			const SECOND_L_233_X = LEFT_X + 120 - 2;
			const SECOND_R_233_X = SECOND_L_233_X + 2;
			const THIRD_L_233_X = SECOND_R_233_X + 120 - 2;

			// Native Canvas Path drawing method mappings replace canvas helpers
			ctxPeriod.beginPath();
			ctxPeriod.moveTo(LEFT_X, MARKER_Y_UP);
			ctxPeriod.lineTo(LEFT_X, MARKER_Y_DOWN);
			ctxPeriod.strokeStyle = "red";
			ctxPeriod.lineWidth = 1;
			ctxPeriod.moveTo(SECOND_L_233_X, MARKER_Y_UP);
			ctxPeriod.lineTo(SECOND_L_233_X, MARKER_Y_DOWN);
			ctxPeriod.moveTo(LEFT_X, LEFT_EDGE_Y);
			ctxPeriod.lineTo(SECOND_L_233_X, LEFT_EDGE_Y);
			ctxPeriod.stroke();

			ctxPeriod.beginPath();
			ctxPeriod.moveTo(SECOND_R_233_X, MARKER_Y_UP);
			ctxPeriod.lineTo(SECOND_R_233_X, MARKER_Y_DOWN);
			ctxPeriod.strokeStyle = "blue";
			ctxPeriod.stroke();
			ctxPeriod.moveTo(THIRD_L_233_X, MARKER_Y_UP);
			ctxPeriod.lineTo(THIRD_L_233_X, MARKER_Y_DOWN);
			ctxPeriod.moveTo(SECOND_R_233_X, LEFT_EDGE_Y);
			ctxPeriod.lineTo(THIRD_L_233_X, LEFT_EDGE_Y);
			ctxPeriod.stroke();
			ctxPeriod.closePath();

			if (typeof AxisArrow !== 'undefined') {
				new AxisArrow(ctxPeriod, [LEFT_X, LEFT_EDGE_Y], 'L', "red").draw();
				new AxisArrow(ctxPeriod, [SECOND_L_233_X, LEFT_EDGE_Y], 'R', "red").draw();
				new AxisArrow(ctxPeriod, [SECOND_R_233_X, LEFT_EDGE_Y], 'L', "blue").draw();
				new AxisArrow(ctxPeriod, [THIRD_L_233_X, LEFT_EDGE_Y], 'R', "blue").draw();
			}
		} else if (C5_FREQ == freqSelect) {

			const SHORT_T = parseInt(rootStyles.getPropertyValue('--WIDTH_466HZ').replace('px', '')) || 0;
			let $perTone = $('.Period_Tone');
			if ($perTone) $perTone.style.width = SHORT_T + 'px';

			// Need to show all 4 boxes of period natively
			let $firstP = $('.First_Period');
			let $secondP = $('.Second_Period');
			let $thirdP = $('.Third_Period');
			let $fourthP = $('.Fourth_Period');

			if ($firstP) $firstP.style.visibility = "visible";
			if ($secondP) $secondP.style.visibility = "visible";
			if ($thirdP) $thirdP.style.visibility = "visible";
			if ($fourthP) $fourthP.style.visibility = "visible";

			// Move the second box over by the new width of longer period 
			const NEW_PERIOD_BOX_LEFT = LEFT_EDGE_X + SHORT_T;
			if ($secondP) $secondP.style.left = NEW_PERIOD_BOX_LEFT + 'px';

			// Change the period wording natively
			let $perText1 = $('#Period_Text1');
			let $perText2 = $('#Period_Text2');

			if ($perText1) $perText1.innerHTML = 'Period T <br>= 1/Frequency<br><br>= 1/(466.16 Hz) <br>= 2.15 ms';
			if ($perText2) {
				$perText2.style.left = (NEW_PERIOD_BOX_LEFT + 40) + 'px';
				$perText2.innerHTML = 'T = 2.15 ms';
			}

			const SECOND_L_466_X = LEFT_X + 60 - 1;
			const SECOND_R_466_X = SECOND_L_466_X + 2; // move it over a touch to account for line thickness 
			const THIRD_L_466_X = SECOND_R_466_X + 60 - 1;

			//*****Create the arrows, lines and text to show periodicity ******/ 
			// Need to make vertical lines to show where Period hits on graph 
			ctxPeriod.beginPath();
			ctxPeriod.moveTo(LEFT_X, MARKER_Y_UP);
			ctxPeriod.lineTo(LEFT_X, MARKER_Y_DOWN);
			ctxPeriod.strokeStyle = "red";
			ctxPeriod.lineWidth = 1;

			// Make end of period lines in red 
			ctxPeriod.moveTo(SECOND_L_466_X, MARKER_Y_UP);
			ctxPeriod.lineTo(SECOND_L_466_X, MARKER_Y_DOWN);

			// Make straight line between arrows 
			ctxPeriod.moveTo(LEFT_X, LEFT_EDGE_Y);
			ctxPeriod.lineTo(SECOND_L_466_X, LEFT_EDGE_Y);
			ctxPeriod.stroke();

			// Make period lines in blue for second period 
			ctxPeriod.beginPath();
			ctxPeriod.moveTo(SECOND_R_466_X, MARKER_Y_UP);
			ctxPeriod.lineTo(SECOND_R_466_X, MARKER_Y_DOWN);
			ctxPeriod.strokeStyle = "blue";
			ctxPeriod.stroke();

			ctxPeriod.moveTo(THIRD_L_466_X, MARKER_Y_UP);
			ctxPeriod.lineTo(THIRD_L_466_X, MARKER_Y_DOWN);

			// Make straight line between arrows 
			ctxPeriod.moveTo(SECOND_R_466_X, LEFT_EDGE_Y);
			ctxPeriod.lineTo(THIRD_L_466_X, LEFT_EDGE_Y);
			ctxPeriod.stroke();
			ctxPeriod.closePath();

			// Need to make red/blue arrows for each period text natively
			if (typeof AxisArrow !== 'undefined') {
				new AxisArrow(ctxPeriod, [LEFT_X, LEFT_EDGE_Y], 'L', "red").draw();
				new AxisArrow(ctxPeriod, [SECOND_L_466_X, LEFT_EDGE_Y], 'R', "red").draw();
				new AxisArrow(ctxPeriod, [SECOND_R_466_X, LEFT_EDGE_Y], 'L', "blue").draw();
				new AxisArrow(ctxPeriod, [THIRD_L_466_X, LEFT_EDGE_Y], 'R', "blue").draw();
			}
		} else {
			console.error(' Coding error, unexpected input freq to showPeriodicity as ' + freqSelect);
		}
	}

	//*********************************** 
	// Adjust mp3 plots so they phase line up with sine waves in most illustrative way possible 
	//*********************************** 
	function updatePlotsUserAides() {
		let $firstP = $('.First_Period');
		let $secondP = $('.Second_Period');
		let $thirdP = $('.Third_Period');
		let $fourthP = $('.Fourth_Period');

		// We set up musical note for zero phase as we line it up with associated pitch sine 
		if (currTuneState == UNSELECTED) {
			// User has chosen "no instrument" 
			// Get rid of all old periodicity stuff natively
			if ($firstP) $firstP.style.visibility = "hidden";
			if ($secondP) $secondP.style.visibility = "hidden";
			if ($thirdP) $thirdP.style.visibility = "hidden";
			if ($fourthP) $fourthP.style.visibility = "hidden";

			showPeriodicity(); // turn everything off 

			if (typeof sine_plot_100_1k !== 'undefined') {
				sine_plot_100_1k.data.datasets[1].label = "";
				sine_plot_100_1k.data.datasets[1].borderColor = 'rgb(255,255,255)'; // white for legend (invisible) 
			}

			// Clean up any Periodicity arrows/text if left over from musical notes and redraw expansion lines 
			if (ctxPeriod && backgroundPlot) ctxPeriod.putImageData(backgroundPlot, 0, 0);

			if (typeof sine_plot_100_1k !== 'undefined') sine_plot_100_1k.update();
			return;
		}

		updateFreq();

		if (typeof sine_plot_100_1k !== 'undefined') {
			// Change the musical note legends 
			let instrArray = tuneState[currTuneState].split("_");
			let musicVerb = " plays ";
			if ("Human" == tuneInstrument[currTuneState]) {
				musicVerb = " sings ";
			}

			// The label wont accept html tags for sup/sub scripts or flat symbols 
			sine_plot_100_1k.data.datasets[1].label = tuneInstrument[currTuneState];
			sine_plot_100_1k.data.datasets[1].borderColor = 'rgb(255,165,0)';
			sine_plot_100_1k.data.datasets[0].label = 'Pitch tone y=10sin(2' + PI + '(' + tuneFundamentalFreq[currTuneState] + ')t)';
		}

		// Update graphs 
		drawTone();

		// Get rid of all old periodicity stuff natively
		if ($firstP) $firstP.style.visibility = "hidden";
		if ($secondP) $secondP.style.visibility = "hidden";
		if ($thirdP) $thirdP.style.visibility = "hidden";
		if ($fourthP) $fourthP.style.visibility = "hidden";

		// Add periodicity as per the pitch freq (only two allowed here, 233.08 and 466.16) 
		showPeriodicity(tuneFundamentalFreq[currTuneState]);
	}

	//*********************************** 
	// Classes 
	//*********************************** 
	// This class is just for drawing the musical note on the graph, we save only a tiny chunk of buffer 
	class InstrumentNote {
		constructor(buffer, tuneStateIndex, noteFreq) {
			this.samplePeriodMp3 = 1 / buffer.sampleRate;
			// Only save what we need to recreate plot and adds some more to handle extra needed to phase up to sine wave 
			// Calculate estimate of the number of points needed to show 1 period of musical note at the buffer sample rate 
			this.POINTS_IN_NOTE_PERIOD = buffer.sampleRate / noteFreq;
			// 1.5 adds some points to search the period for "zero phase" before changing sample rate to plot 
			const PHASE_UP_POINTS = 1.5 * this.POINTS_IN_NOTE_PERIOD;
			this.mp3Data = buffer.getChannelData(0).slice(tuneOffset[tuneStateIndex], tuneOffset[tuneStateIndex] + NUM_PTS_PLOT_LONG + PHASE_UP_POINTS + 1);
		}

		// Web Audio opens the given mp3 file and resamples it according to the destination's desired sample rate
		// For example, all the mp3 files are at 44.1k and this is fine for many desktops but laptops seem to want
		// 48k and resample the buffer to get that.  If I want to phase up the mp3, I need to find best place phase to start
		// points, given we don't know sample rate apriori.  Want to find best "zero phase starting point" for musical note 
		// and then resample upward for good plotting
		findStartPhase() {
			// start at begin of buffer and search for 1.5 * POINTS_IN_NOTE_PERIOD points for interval with
			// largest change in Y that crosses zero axis, and is monotonic
			// search zone must be long enough so that if we start midsection of a steep ascent/descent, we pick up full interval at end
			const NUM_PTS_SEARCH = Math.trunc(this.POINTS_IN_NOTE_PERIOD * 1.25);
			let bestInterval = { startPt: 0, endPt: 0, deltaY: 0, justB4CrossPt: 0, rising: false };
			let monotonicInc = false;  // positive slope
			let monotonicDec = false;	// negative slope
			let startPt = 0;
			let endPt = 0;
			// we'll keep track of rough extimate of zero crossing and improve when sample rate increases for graphing
			let justB4Crossing = 0;

			for (let i = 0; i < NUM_PTS_SEARCH; i++) {
				if (this.mp3Data[i + 1] > this.mp3Data[i]) {
					// slope is positive and we are INCREASING
					monotonicInc = true;
					if (monotonicDec) {
						// we were decreasing, now we are increasing, do we want to save this last interval?
						// the interval must cross X axis
						if (Math.sign(this.mp3Data[startPt]) != Math.sign(this.mp3Data[endPt])) {
							let currDeltaY = this.mp3Data[startPt] - this.mp3Data[endPt];
							if (currDeltaY > bestInterval.deltaY) {
								// this is either the best interval or the first
								bestInterval.startPt = startPt;
								bestInterval.endPt = endPt;
								bestInterval.deltaY = currDeltaY;
								bestInterval.justB4CrossPt = justB4Crossing;
								bestInterval.rising = false;
								// ok, now its saved, lets keep looking for better
							}
						}
						startPt = i;
						justB4Crossing = 0;
						monotonicDec = false;
						// need to check if this was the highest delta y
					} else {
						// we were increasing and still are
						endPt = i + 1;
						// did we pass through x axis?
						if ((justB4Crossing == 0) && (Math.sign(this.mp3Data[startPt]) != Math.sign(this.mp3Data[i + 1]))) {
							// only want to catch this the first time
							justB4Crossing = i;
						}
					}
				} else {
					// slope is negative and we are DECREASING
					monotonicDec = true;
					if (monotonicInc) {
						// we were increasing, we are now decreasing, do we want to save this last interval?
						// the interval must cross X axis
						if (Math.sign(this.mp3Data[startPt]) != Math.sign(this.mp3Data[endPt])) {
							let currDeltaY = this.mp3Data[endPt] - this.mp3Data[startPt];
							if (currDeltaY > bestInterval.deltaY) {
								// this is either the best interval or the first
								bestInterval.startPt = startPt;
								bestInterval.endPt = endPt;
								bestInterval.deltaY = currDeltaY;
								bestInterval.justB4CrossPt = justB4Crossing;
								bestInterval.rising = true;
								// ok, now its saved, lets keep looking for better
							}
						}
						startPt = i;
						justB4Crossing = 0;
						monotonicInc = false;
						// need to check if this was the highest delta y
					} else {
						// we were decreasing and still are
						endPt = i + 1;
						if ((justB4Crossing == 0) && (Math.sign(this.mp3Data[startPt]) != Math.sign(this.mp3Data[i + 1]))) {
							// only want to catch this the first time
							justB4Crossing = i;
						}
					}
				}
			}

			// Truncate the buffer so we start just before the zero crossing.  If the interval we are matching is ascending,
			// we are already at zero phase. If interval is descending, need to move back by T/2.  Better to be early than
			// late so when we get better precision on zero crossing, we will further perfect the starting point
			let plotFirstPt = bestInterval.justB4CrossPt;
			let riseFallState = (bestInterval.rising) ? "rising" : "falling";
			if (!bestInterval.rising) {
				plotFirstPt = bestInterval.justB4CrossPt + Math.trunc(this.POINTS_IN_NOTE_PERIOD / 2);
			}
			this.mp3Data = this.mp3Data.slice(plotFirstPt, plotFirstPt + NUM_PTS_PLOT_LONG + 1);
		}

		// Continuance of Class InstrumentNote Methods: getGraphArray()
		// Implements nearest-neighbor sampling and phase alignment for plot data.
		getGraphArray() {
			let graphArray = [];
			let currIndxMp3 = 0;
			// want to illustrate that sine wave at pitch freq is the periodicity of musical note waveform
			// To enhance visualization, phase up the buffer so that we "start" at zero crossing of steepest ascent/descent
			// we will then feed this "new" buffer into the sample rate converter for plotting
			this.findStartPhase(); // Aligns data to zero-crossing
			
			// using nearest neighbor approximation for arbitrary sample rate conversion of MP3 rate to graph rate
			for (let i = 0; i <= NUM_PTS_PLOT_LONG; i++) {
				let tG = samplePeriodLong * i;
				let tM = currIndxMp3 * this.samplePeriodMp3;
				if ((tG - tM) > (tM + this.samplePeriodMp3 - tG)) currIndxMp3++;
				graphArray[i] = this.mp3Data[currIndxMp3];
			}
			// compare expected with actual graph sample rate/ mp3 file sample rate
			let approxSampRatio = NUM_PTS_PLOT_LONG/currIndxMp3;
			let actualSampRatio = this.samplePeriodMp3/samplePeriodLong;
			console.log("Calculated (Sample rate of Graph)/(sample Rate of Mp3) as " + approxSampRatio);
			console.log("We expected Fsg/Fsmp3 = " + actualSampRatio + " Difference is " + (approxSampRatio - actualSampRatio));

			return graphArray;
		}
	}

	// Global Event Listeners & Audio Context Management
	let sourceNote=null
	let context 
	let gainMusicNode=null;
//	try {
//		//DELETE ME window.AudioContext = window.AudioContext || window.webkitAudioContext;
//		//context = new AudioContext()
//		
//		// Point 'context' directly to the Tone.js underlying native context
//    	context = Tone.getContext().rawContext; 
//		gainMusicNode = context.createGain();
//		//DELETE ME gainMusicNode.connect(context.destination);
//		// Connect your gain node into Tone.js's master output engine
//    	gainMusicNode.connect(Tone.getDestination().input); 
//	} catch (e) { alert("Audio initialization for MP3 music notes failed"); }

	function changeMP3Volume(mute = false) {
		//for MP3, will use max volume setting to give factor of 2 (3db) increase.
		//middle setting is no amplification and zero setting is mute
		// https://stackoverflow.com/questions/70480176/webaudio-api-change-volume-for-one-of-sources
		// createGain can be used to mute as well
		let ampVal = mute ? 0 : ($('#music-amp').val() || 3);

	    let volumeDb = Tone.gainToDb(ampVal * 2 / 10);
	    // Only adjust the active sourceNote volume node, leaving other oscillators alone
	    if (sourceNote && sourceNote.volume) {
	        sourceNote.volume.value = volumeDb;
	    }		
	}

	// UI Event Handlers (Change volume/start-stop)
	function setMusicAmp(){
		$("#currMusicVolLabel").text($('#music-amp').val());
		changeMP3Volume();
	}
	function setToneAmp() {
		let val = $("#tone-amp").val();
		$("#currToneVolLabel").text(val);
		if (osc) osc.volume.value = -20 + 20.0 * Math.log10(val);
	}

	$('#tone-amp').on('change', setToneAmp);
	$('#music-amp').on('change', setMusicAmp);

	$('.toneStartButton').on('click', function() {
		if (typeof ToneIsOnNow == "undefined") ToneIsOnNow = false;
		// convert amplitude to what tone.js calls decibels.  In tone.js, -40 dB is very quiet
		// and 0 dB is plenty loud enough.  I know this isn't the music industry definition (decibel SPL where 0 dB
		// is the quietest sound one can hear and 100 dB will cause hearing damage) so I will say Amplitude = 1
		// is min audible and amplitude 40 dB higher (40 = 20log(A1/A0) or A1=100 if A0 = 1) is max we want to put out
		let db = -20 + 20.0 * Math.log10($("#tone-amp").val());

		if (!ToneIsOnNow) {
			//Its off, but we will turn tone on
			osc = new Tone.Oscillator({ frequency: currFreq, volume: db, type: "sine" }).toDestination().start();
			$toneVolOn.show();
			$toneVolOff.hide();
			ToneIsOnNow = true;
		} else {
			//Its on but we will stop tone
			osc.toDestination().stop();
			$toneVolOn.hide();
			$toneVolOff.show();
			ToneIsOnNow = false;
		}
	});

	// Initialize sliders
	const DEFAULT_VOL = 3;
	document.querySelectorAll("#tone-amp, #music-amp").forEach(input => {
	    input.value = DEFAULT_VOL;
	    input.dispatchEvent(new Event('change')); 
	});
	setToneAmp();
	const toneLabel = document.getElementById("currToneVolLabel");
	if (toneLabel) toneLabel.textContent = DEFAULT_VOL;
	const musicLabel = document.getElementById("currMusicVolLabel");
	if (musicLabel) musicLabel.textContent = DEFAULT_VOL;

	// Update advanced topics native dialog query nodes cleanly (Avoiding Bootstrap container nesting)
	let todo_tab_element = "#tab011 > p";
	let expln_tab_element = "#tab021 > p";

	//*********************************** 
	// User instigated callback events User SELECTS NEW instrument 
	//*********************************** 
	async function prepToPlayNote(chosenInstrument, prepOnly = false) {
		let currInstrument = chosenInstrument;
		currTuneState = UNSELECTED;

		// Find index loop mapping cleanly natively
		tuneInstrument.forEach((inst, index) => {
			if (currInstrument === inst) currTuneState = index;
		});

		if (currTuneState === UNSELECTED) {
			// should never happen
			console.error('SW Bug, html does not match JSON config file');
			updatePlotsUserAides();
			let $activity = $("#musicalActivity");
			if ($activity) $activity.innerHTML = DEFAULT_TITLE;
			$noteVolOn.hide();
			$noteVolOff.hide();
			let $noteLabel = $("#currMusicNoteLabel");
			if ($noteLabel) $noteLabel.innerHTML = "";
			throw new Error("SW bug, html does not match JSON config file");
		}

		// Inject parameters directly inside your native modalless dialog window container context
		let myDialog = document.getElementById('AdvancedTopics');
		if (myDialog) {
			let $todoContent = myDialog.querySelector(todo_tab_element);
			let $explnContent = myDialog.querySelector(expln_tab_element);
			if ($todoContent) $todoContent.innerHTML = tuneToDo[currTuneState];
			if ($explnContent) $explnContent.innerHTML = tuneExpln[currTuneState];
		}

		if (!prepOnly) {
			let $activity = $("#musicalActivity");
			if ($activity) $activity.innerHTML = tuneTitle[currTuneState];

			let $noteLabel = $("#currMusicNoteLabel");
			if ($noteLabel) $noteLabel.innerHTML = NOTE_MAPPING.get(tuneMusicalNote[currTuneState]) || "";
		}

		// Check Audio Stream Buffer Cache 
		if (tuneBuffer[currTuneState] != null) {
			if (!prepOnly) updateUIAfterLoad();
			return "Music file was already in local cache";
		}

		try {
			// Get the URL (Signed or Local) 
			const response = await fetch('/getDynamicFilename/?fileName=MusicNotes/' + tuneFilenameURL[currTuneState]);
			if (!response.ok) throw new Error(`Config fetch failed: ${response.status}`);

			const data = await response.json();
			const musicianNoteMp3URL = data.url;

			// Fetch the actual MP3 binary data stream
			const mp3Response = await fetch(musicianNoteMp3URL);
			if (!mp3Response.ok) throw new Error(`MP3 fetch failed: ${mp3Response.status}`);
			const arrayBuffer = await mp3Response.arrayBuffer();

	        // DECODE VIA TONE.JS CONTEXT:
	        // This decodes the arrayBuffer natively using Tone's active background thread
	        const decodedBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
			tuneBuffer[currTuneState] = decodedBuffer;
		
			// save the raw buffer in cache, since easier to deal with
			noteFilePoint[currTuneState] = new InstrumentNote(decodedBuffer, currTuneState, tuneFundamentalFreq[currTuneState]);
			tuneGraphLong[currTuneState] = noteFilePoint[currTuneState].getGraphArray();

			if (!prepOnly) {
				updateUIAfterLoad();
			}
			return "Music file was successfully retrieved and decoded";
		} catch (err) {
			alert("Error processing note: " + err.message);
			console.error(err);
			throw err;
		}
	}

	// Helper to prepToPlayNote function 
	function updateUIAfterLoad() {
		updatePlotsUserAides();
		$noteVolOn.hide();
		$noteVolOff.show();
	}

	// User selects an instrument from your dropdown flyout components natively
	// Core dropdown toggle functionality	
	const dropdownContainer = document.getElementById('InstrumentSel');
	if (!dropdownContainer) return; 

	// 1. Direct native scoping ensures we get the exact elements inside this container
	const toggleElement = dropdownContainer.querySelector('.dropdown-toggle');
	const menuElement = dropdownContainer.querySelector('.dropdown-menu');

	// 2. Extend them individually using your library
	const $toggleBtn = extendElement(toggleElement);
	const $dropdownMenu = extendElement(menuElement);
	
	// 3. Toggle visibility on button click
	$toggleBtn.on('click', (event) => {
		event.stopPropagation();
		$dropdownMenu.toggleClass('show');
	});

	// 4. Handle item selection
	let instrumentButtons = dropdownContainer.querySelectorAll('.dropdown-item');
	instrumentButtons.forEach(btn => {
		let $btn = extendElement(btn);
		
		$btn.on('click', function() {
			$toggleBtn.html($btn.html());
			$dropdownMenu.removeClass('show');
			prepToPlayNote($btn.val());
		});
	});

	// 5. Global listener to close when clicking outside
	document.addEventListener('click', () => {
		$dropdownMenu.removeClass('show');
	});
	

	//*********************************** 
	// User instigated callback events User selects PLAY INSTRUMENT they have selected 
	//*********************************** 
	let $playNoteBtn = $('.allowNotePlay');
	if ($playNoteBtn) {
		$playNoteBtn.on('click', async function() {
			if (typeof noteIsOnNow == "undefined") {
				noteIsOnNow = false;
			}

			if (tuneBuffer == null || tuneBuffer[currTuneState] == null) {
				let prob = tuneBuffer == null ? " Whole tune buffer is null" : " The tune buffer for state " + currTuneState + " is null";
				console.error("Timing error, file transfer and decode not complete." + prob);
			} else {
				if (!noteIsOnNow) {
							
					// 1. Ensure the master audio context is awake
				    Tone.start(); 
				
				    // 2. Calculate the volume setting from your HTML input
				    let ampVal = ($('#music-amp').val() || 3);
				    
				    // 3. Convert your 0-10 slider math into a clean Tone.js Decibel unit
				    // Tone.gainToDb(1) is 0dB (unaltered). Tone.gainToDb(0) is -Infinity (silent).
				    let volumeDb = Tone.gainToDb(ampVal * 2 / 10); 			

				    sourceNote = new Tone.BufferSource({
				        playbackRate: 1,
				        loop: false,
				        volume: volumeDb,
				    });
				    // BYPASS CONSTRUCTOR bug in Tone.js: Assign the native browser AudioBuffer directly 
					// using Tone's low-level hardware assignment. This skips the type-checking error.
					sourceNote.buffer = tuneBuffer[currTuneState];

				    // 5. Connect the source through Tone's volume system to the speakers and start it
				    sourceNote.toDestination();

				    sourceNote.start();
				    noteIsOnNow = true;
				    $noteVolOn.show();
				    $noteVolOff.hide();
				
				    // 6. Handle the automatic cleanup when the MP3 finishes
				    sourceNote.onended = () => {
				        noteIsOnNow = false;
				        $noteVolOn.hide();
				        $noteVolOff.show();
				    };
    			};
    		};
		});
	}
	//*********************************** 
	// Immediate execution here 
	//*********************************** 
	// Setup Chart.js context via framework-free DOM lookups
	let ctxLong;
	let chartCanvas = document.getElementById("sine_plotsLong");
	if (chartCanvas) {
		ctxLong = chartCanvas.getContext('2d');
	} else {
		console.error('Cannot obtain sin_plotsLo context');
	}

	// Chart configuration mapped exactly to native parameters
	const CHART_OPTIONS = {
		maintainAspectRatio: false,
		responsive: true,
		elements: {
			point: { radius: 1 }
		},
		scales: {
			x: {
				type: 'linear',
				title: { display: true, text: 't (milliseconds)' },
				ticks: { stepSize: 0.2 }
			},
			y: {
				type: 'linear',
				max: 10,
				min: -10,
				title: { display: true, text: 'y amplitude' }
			}
		}
	};

	const TOP_CHART = { ...CHART_OPTIONS };

	let sine_plot_100_1k = new Chart(ctxLong, {
		type: 'line',
		data: {
			labels: timeMsLong,
			datasets: [
				{
					label: 'Pitch tone y=10sin(2' + PI + '(' + C5_FREQ + ')t)',
					data: ampLong,
					fill: false,
					borderColor: 'rgb(75, 192, 192)'
				},
				{
					label: '',
					data: ampLongCurrNote,
					fill: false,
					borderColor: 'rgb(255,255,255)'
				}
			]
		},
		options: TOP_CHART
	});

	// Initialize data arrays and view structures
	fillInArrays();
	drawTone();

	let $freqLabel = $("#currFreqLabel");
	if ($freqLabel) $freqLabel.textContent = currFreq.toString();

	//*********************************** 
	// Fetch Audio Configuration Data
	//*********************************** 
	async function loadAudioConfig() {
		try {
			const response = await fetch('/GetMarchingBandTuningNoteAudioConfig/');
			if (!response.ok) throw new Error(`HTTP status: ${response.status}`);

			const data = await response.json();
			if (data && data.TestNote) {
				// Safe, framework-free sequential iteration loop replaces $.each
				data.TestNote.forEach((paramSet, index) => {
					tuneState[index] = (paramSet.instrument).replace(" ", "_") + "_" + paramSet.musicalNote;
					tuneMusicalNote[index] = paramSet.musicalNote;
					tuneExpln[index] = paramSet.expln;
					tuneToDo[index] = paramSet.todo;
					tuneInstrument[index] = paramSet.instrument;
					tuneTitle[index] = paramSet.title;
					tuneOffset[index] = parseInt(paramSet.tuneOffset);
					tuneFundamentalFreq[index] = parseFloat(paramSet.fundamentalHz);
					tuneFilenameURL[index] = paramSet.filenameURL;
				});

				let $activity = $("#musicalActivity");
				if ($activity) $activity.innerHTML = tuneTitle[currTuneState] || DEFAULT_TITLE;
			}
		} catch (err) {
			console.error("Error in JSON configuration file pipeline: ", err);
			alert("Error in JSON configuration file pipeline: " + err.message);
		}
	}

	// Trigger config load immediately on DOM load
	loadAudioConfig();

	//*********************************** 
	// Initial User Modal Assistance 
	//*********************************** 
	if ((!sessionStorage.adModal) && (!stopModal)) {
		setTimeout(function() {
			let adModalEl = document.getElementById('admodal');
			if (adModalEl) {
				// Native HTML5 Dialog modal layout launch pattern replaces Bootstrap .modal() calls
				if (typeof adModalEl.showModal === 'function') {
					adModalEl.showModal();
				} else {
					adModalEl.style.display = 'block';
				}
			}
		}, 1000);
		sessionStorage.adModal = 1;
	}

	//****************************************************************************
	// Autodemo script for tone trig
	//**************************************************************************** 
	const SCRIPT_AUTO_DEMO = [

		{
			segmentName: "Trig in Trumpet",
			headStartForAudioMillisec: 11000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'MusicNotesTrigSeg0' }
					},
					//*****************************
					// click on select instrument pulldown menu 
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentTypeSel',
							action: "click",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 3000
						}  // this is wait before you go on to next item
					},

					//*****************************
					// show we will click on trumpet from drop down menu
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentSelections button[value="Trumpet"]',
							action: "focus",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 3000
						}  // this is wait before you go on to next item
					},

					// focus first then click so user sees what we do
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentSelections button[value="Trumpet"]',
							action: "click",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 50
						}  // this is wait before you go on to next item
					},
					// get rid of click cursor
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentSelections button[value="Trumpet"]',
							action: "click",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 59000
						}  // this is wait before you go on to next item
					},

					//*****************************
					// Big gap here as we explain the periodicity of trumpet
					//*****************************	

					// TURN ON sine wave tone
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.toneStartButton',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 25, y: 20 },
							waitTimeMillisec: 1000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.toneStartButton',
							action: "nothing",
							waitTimeMillisec: 1000
						}
					},
					// wait a bit and TURN ON trumpet
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.allowNotePlay',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 25, y: 20 },
							waitTimeMillisec: 1000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.allowNotePlay',
							action: "nothing",
							waitTimeMillisec: 5000
						}
					},
					// TURN OFF sine wave, Trumpet will play itself out
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.toneStartButton',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 25, y: 20 },
							waitTimeMillisec: 1000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.toneStartButton',
							action: "nothing",
							waitTimeMillisec: 1000
						}
					},
				]
		},
		{
			segmentName: "Other instruments",
			headStartForAudioMillisec: 25000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'MusicNotesTrigSeg1' }
					},
					//*****************************
					// click on select instrument pulldown menu 
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentTypeSel',
							action: "click",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 3000
						}  // this is wait before you go on to next item
					},
					// get rid of drop down menu cursor
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentTypeSel',
							action: "nothing",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 1000
						}
					},
					//*****************************
					// show we will click on flute from drop down menu
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentSelections button[value="Flute"]',
							action: "focus",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 3000
						}  // this is wait before you go on to next item
					},

					// focus first then click so user sees what we do
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentSelections button[value="Flute"]',
							action: "click",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 50
						}  // this is wait before you go on to next item
					},
					// get rid of focus cursors
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentSelections  button[value="Flute"]',
							action: "nothing",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 50
						}  // this is wait before you go on to next item
					},
					// get rid of click cursor
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#InstrumentSelections button[value="Flute"]',
							action: "nothing",
							offset: { x: 20, y: 20 },
							waitTimeMillisec: 17000
						}  // this is wait before you go on to next item
					},

					//*****************************
					// Big gap here as we explain the periodicity of trumpet
					//*****************************	
					// TURN ON sine wave tone
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.toneStartButton',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 25, y: 20 },
							waitTimeMillisec: 1000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.toneStartButton',
							action: "nothing",
							waitTimeMillisec: 1000
						}
					},
					// wait a bit and TURN ON flute
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.allowNotePlay',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 25, y: 20 },
							waitTimeMillisec: 1000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.allowNotePlay',
							action: "nothing",
							waitTimeMillisec: 5000
						}
					},
					// TURN OFF sine wave, instrument will play itself out
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.toneStartButton',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 25, y: 20 },
							waitTimeMillisec: 1000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '.toneStartButton',
							action: "nothing",
							waitTimeMillisec: 1000
						}
					},

				]
		},
	];
	//**************************************************************************** 
	// User initiates autoDemo activity 
	//**************************************************************************** 
	//*** user clicks the start demo image, iniitalize everything 
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO); // give the demo the full script 

	let $startAutoDemoBtn = $('#startAutoDemo');
	if ($startAutoDemoBtn) {
		$startAutoDemoBtn.on('click', function() {
			demo.prepDemoControls();
			// Only in autodemos that use MP3 (like MusicNotesTrig that plays musician notes), we need to send the original webAudio context
			// since iOS will not allow initial use of AudioContext unless initialized by user click (not CustomEvent as is done in AutoDemo). To solve
			// this, on user click of start here button, we create the WebAudio that will be used in the demo (using trumpet). We will create the tone
			// WebAudio object when user hits play. Both events take time, want to spread that out as much as possible
			// MP3 in response to CustomEvent. On other pages with AutoDemo that don't play extra MP3 (other than voice that explains), this value is not set and its ok
			// to just define it here.  

			if (typeof noteIsOnNow == "undefined") { 
			    noteIsOnNow = false; 
			}
			
			// 1. Instantly unlock the iOS audio context
			Tone.start().then(() => {
			    console.log("Tone.js Audio Context securely unlocked for iOS AutoDemo.");
			    
			    // 2. ZERO-BLIP FIX: Create a tiny, completely empty 1-sample silent buffer manually
			    // There are no audio waves here, so it is physically impossible to make a sound or blip.
			    let nativeContext = Tone.getContext().rawContext;
			    let completelySilentBuffer = nativeContext.createBuffer(1, 1, nativeContext.sampleRate);
			    
			    // 3. Create the player node and feed it the custom empty buffer
			    let silentWarmup = new Tone.BufferSource();
			    silentWarmup.buffer = completelySilentBuffer;
			    
			    // 4. Hard mute the gain node just to be absolutely certain
			    if (silentWarmup.volume && silentWarmup.volume.gain) {
			        silentWarmup.volume.gain.value = 0;
			    }
			    
			    // 5. Connect and fire the warmup to satisfy the iOS hardware lock
			    silentWarmup.toDestination();
			    silentWarmup.start();
			    silentWarmup.stop("+0.05");
			});
			
			// 6. Pre-load your Trumpet cache completely separately for the demo!
			// This breaks the race condition since the player above doesn't depend on this download.
			if (tuneBuffer == null || tuneBuffer[currTuneState] == null) {
			    prepToPlayNote("Trumpet", true).then(
			        (onResolved) => { console.log("AutoDemo asset cached for later use: " + onResolved); },
			        (onRejected) => { console.error("Failure caching asset: " + onRejected); }
			    );
			}

			
			
		});
	}

	//**************************************************************************** 
	// User has interacted with autoDemo controls 
	//**************************************************************************** 
	function resetToDefaults() {
		// get rid of any musical note legends and make the title "generic"
		let $activity = $("#musicalActivity");
		if ($activity) $activity.innerHTML = DEFAULT_TITLE;

		let $noteLabel = $("#currMusicNoteLabel");
		if ($noteLabel) $noteLabel.innerHTML = "";

		if (typeof sine_plot_100_1k !== 'undefined') {
			sine_plot_100_1k.data.datasets[1].label = "";
			sine_plot_100_1k.data.datasets[1].borderColor = 'rgb(255,255,255)'; // white for legend (invisible) 
		}

		// clean up any Periodicity arrows/text if left over from musical notes and redraw expansion lines
		if (ctxPeriod && backgroundPlot) ctxPeriod.putImageData(backgroundPlot, 0, 0);

		// get rid of all old periodicity stuff, in case its present
		let $firstP = $('.First_Period');
		let $secondP = $('.Second_Period');
		let $thirdP = $('.Third_Period');
		let $fourthP = $('.Fourth_Period');
		let $perText1 = $("#Period_Text1");
		let $perText2 = $('#Period_Text2');

		if ($firstP) $firstP.style.visibility = "hidden";
		if ($secondP) $secondP.style.visibility = "hidden";
		if ($thirdP) $thirdP.style.visibility = "hidden";
		if ($fourthP) $fourthP.style.visibility = "hidden";
		if ($perText1) $perText1.style.visibility = "hidden";
		if ($perText2) $perText2.style.visibility = "hidden";

		// update graphs, to eliminate musical note if present
		drawTone();

		// set all volumes to default values
		let $toneAmp = $("#tone-amp");
		let $musicAmp = $("#music-amp");
		if ($toneAmp) $toneAmp.value = DEFAULT_VOL;

		let $currToneVol = $("#currToneVolLabel");
		if ($currToneVol && $toneAmp) $currToneVol.textContent = $toneAmp.value;
		setToneAmp();

		if ($musicAmp) $musicAmp.value = DEFAULT_VOL;
		let $currMusicVol = $("#currMusicVolLabel");
		if ($currMusicVol && $musicAmp) $currMusicVol.textContent = $musicAmp.value;
		setMusicAmp();

		// turn off all sounds
		if (sourceNote) {
			try { sourceNote.stop(0); } catch (e) { }
		}
		noteIsOnNow = false;

		// default is no instrument selected, then no volume on/off button
		$noteVolOn.hide();
		$noteVolOff.show();

		// turn off tone
		if (osc && typeof osc.stop === 'function') {
			osc.stop();
		} else if (osc && osc.toDestination) {
			try { osc.toDestination().stop(); } catch (e) { }
		}

		// go back to original html defaults
		$toneVolOn.hide();
		$toneVolOff.show();
		ToneIsOnNow = false;
	}

	// User has selected play 
	let $playSegmentBtn = $('#playSegment');
	if ($playSegmentBtn) {
		$playSegmentBtn.on('click', function() {
			// So Safari requires that a user touch (cant do CustomEvent) instigates a WebAudio event
			// here we "cheat" and let user play button touch do a quick audio action to satisfy Safari before Autodemo
			// which will play tones or music
			if (osc && osc.toDestination) {
				try {
					osc.toDestination().start();
					osc.frequency.value = 80; // below what most speakers will play 
					osc.toDestination().stop();
				} catch (e) { }
			}
			// as noted above for iOS, cant instigate a WebAudio event from CustomEvent (which is how autodemo works when user hits play,
			// it simulates real user events). start the WebAudio event for source note mp3 from musicians here so it can be done for real later
			// so we will send the AudioContext used for musician notes to the autoDemo so it can be initialized with explainers voice MP3
			// audioContext_iOS: context} <-- part of script where we pass in WebAudio object for initialization upon user click of "play"
			// end Safari hack

			// in case plots have other stuff on them from other activities, clean it up
			resetToDefaults();
			demo.startDemo();
		});
	}

	let $stopSegmentBtn = $('#stopSegment');
	if ($stopSegmentBtn) {
		$stopSegmentBtn.on('click', function() {
			demo.stopThisSegment(false); // we don't want to destroy controls box 
			resetToDefaults(); // turn off any sound, clean up 
		});
	}

	let $dismissAutoDemoBtn = $('#dismissAutoDemo');
	if ($dismissAutoDemoBtn) {
		$dismissAutoDemoBtn.on('click', function() {
			// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen 
			demo.stopThisSegment(); // may or may not be needed 
			resetToDefaults(); // turn off any sound, clean up 
		});
	}

	let $segNumSelect = $("#segNum");
	if ($segNumSelect) {
		$segNumSelect.on('change', function() {
			let currSeg = parseInt($segNumSelect.value);
			demo.setCurrSeg(currSeg);

			// remove the class so the animation will work on next page, cant do this until animation completes 
			let $clickHereCursor = $('#clickHereCursor');
			if ($clickHereCursor) $clickHereCursor.classList.remove('userHitPlay');
		});
	}

});

