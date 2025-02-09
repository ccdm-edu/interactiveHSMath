'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	// turn on help in upper left corner
	$('#startAutoDemo').css('display', 'inline-block');
	
	//if Next, button hit (in base template), set it up to go to intro page
	$("#GoToNextPage").wrap('<a href="../MusicSineSummary"></a>');
	$("#GoToPreviousPage").wrap('<a href="../ToneTrig"></a>');
	
	// user can only pick expert/newbie mode on the first home page
	let newbieMode = sessionStorage.getItem('UserIsNew');
	let stopModal = true;  // will stop modal window from popping up later in this script
	if (newbieMode && (newbieMode.toLowerCase() === "true")) {
		// emphasize the auto demo as first place
		$("#startAutoDemo").addClass('newbieMode');
	} else if (newbieMode && (newbieMode.toLowerCase() === 'false')) {
		// remind user what to do 
		stopModal = false;
	} else {
		// user somehow got here without going through landing page or deleted sessionStorage, put in newbie mode
		$("#startAutoDemo").addClass('newbieMode');
	}


	// implement the Tone sounding and chart tools
	const C5_FREQ = 466.16; // frequency in Hz of Bflat instrument playing C5
	const C4_FREQ = 233.08;  // frequency in Hz of Bflat instrument playing C4
	let currFreq = C5_FREQ;
	
	let noteIsOnNow = false;  // for musical note
	let ToneIsOnNow = false;  // for synthesized tone, both musical note and tone can play additively.
	let osc = new Tone.Oscillator(); 
	
	let ctxPeriod, ctxLong;
	
	//initialize variables needed to play the non synthesized tone musical notes
	const UNSELECTED = -1;  
	let tuneState = [];
	let currTuneState = UNSELECTED;  // pick the first element, which will be the synthesized tones
	let tuneExpln = [];
	let tuneFilenameURL = [];  // filename at server
	let tuneToDo = []
	let tuneInstrument = [];
	let tuneMusicalNote = [];
	let tuneTitle = [];
	let tuneBuffer = [];  // array of AudioBuffer for currTuneState 0 through N-1, all musical notes, used to play full mp3 file
	let tuneOffset = []; // determines when plotting will begin in mp3 file, index is currTuneState
	let tuneFundamentalFreq = []; // initialize tone for closest approx
	let tuneGraphLong = [[]];  // holds an array, per musical note, of graphing points for long graph (10ms)
	let noteFilePoint = [];   // array for every instrument of InstrumentNote, will determine next point using multirate sample rate conversion
	
	//list of notes used
	const C5_NOTE = "C<sub>5</sub>";
	const C4_NOTE = "C<sub>4</sub>";
	const BFLAT4_NOTE = "B<sup><span>&#9837;</span></sup><sub>4</sub>";
	// map JSON texts to html
	const NOTE_MAPPING = new Map([ ["C5", C5_NOTE],["C4", C4_NOTE],["B4flat", BFLAT4_NOTE] ]);

	//everything is relative to the html page this code operates on, server needs to work from /static directory (without django intervention)
	const STATIC_FILE_LOC = "../../static/static_binaries/";
	const urlInitValJson = STATIC_FILE_LOC + "Configuration/filelistofmusicalinstrumentsplayingtuningnote.json";
	
	const DEFAULT_TITLE = "Musical Notes and Underlying Trig";
	$("#musicalActivity").html(DEFAULT_TITLE);  //load up default
	$("#allowNotePlay").css("visibility", "hidden");   // load up default, until user selects instrument
	$('#toneStartButton').css('background-color', GO_COLOR);  // initial value, this is never hidden
	
	// used for plotting
	let timeMsLong = [];
	let ampLong = [];
	let ampLongCurrNote = [];  // what is plotted
	
	const NUM_PTS_PLOT_LONG = 1000;
	const DURATION_LONG_PLOT_MS = 10;	
	//sample period in sec
	// yes, these are ridiculously high rates, didn't want to have ANY sampling artifacts in plots...
	const samplePeriodLong = DURATION_LONG_PLOT_MS/(1000 * NUM_PTS_PLOT_LONG);
	
	function fillInArrays(){
		let i;
		for (i=0; i<=NUM_PTS_PLOT_LONG; i++) {
			// for plot purposes, fix the tone amp to 10, else plots change too much and it is confusing for kids and
			// they might adjust things too much so you lose the punch line of musical note periodicity
			ampLong[i] = 10.0 * Math.sin(2 * Math.PI * (currFreq * i * samplePeriodLong) );
			timeMsLong[i] = roundFP(i * samplePeriodLong * 1000, 3);	
			// this allows us to turn off graph yet keep data around, for currTuneState=TONE_ONLY, this will be a null array 
			if (tuneGraphLong[currTuneState] != null) {
				// arbitrary fixed amplification factor put on mp3 signals for ease in plotting.  Changing
				// amplitude only changes tone volume, not the mp3 musical note volume
				ampLongCurrNote[i] = 10 * tuneGraphLong[currTuneState][i];	
			}	
		}
	};
	
	function drawTone()
	{	
		// now fill the arrays and push them to the plots
		fillInArrays();   
	    // make all these changes happen
	    sine_plot_100_1k.update();	                    
	};
	
	function updateFreq() {
		let newToneFreq = tuneFundamentalFreq[currTuneState];
		$("#currFreqLabel").text(newToneFreq);   // and put it on the tone freq label as string
		currFreq = newToneFreq;
		osc.frequency.value = currFreq;
	}
	
	//***********************************
	// show periodicity as musical instrument comes up with the pitch freq
	//***********************************
	// Add space for lines indicating periodicity of musical notes
	//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
	if ( $("#periodicityIndicator").length ) {
    	ctxPeriod = $("#periodicityIndicator").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain timeExpand context');
	};
	
	// keep a snapshot of two plots before the expansion lines inbetween show up
	// When we move to musical instruments, the 1ms plot on bottom is irrelevant but want the space used
	// to indicate "1ms expansion" to show periodicity
    let backgroundPlot; 
    let expandTimeCanvas = $("#periodicityIndicator").get(0);
	backgroundPlot = ctxPeriod.getImageData(0, 0, expandTimeCanvas.width, expandTimeCanvas.height);
		
	// go to CSS, pull out scales values and pull off px suffix and convert to numbers	
	var root = document.querySelector(':root');
	var rootStyles = window.getComputedStyle(root);
	let LEFT_EDGE_X = parseInt(rootStyles.getPropertyValue('--LEFT_EDGE_PLOT').replace('px', ''));
	let LEFT_EDGE_Y = parseInt(rootStyles.getPropertyValue('--TOP_EDGE_PLOT').replace('px', ''));
	// Under the graphs, show the periodicity for both C5 and C4(as approptiate) on tone and musicical note
	function showPeriodicity(freqSelect){
		// delete the expansion lines to make room for these periodicity indicators/verbiage
		ctxPeriod.putImageData(backgroundPlot, 0, 0);
		if (currTuneState == UNSELECTED) {
			//clean out everything
			$('#Period_Text1').css("visibility", "hidden");			
			$('#Period_Text2').css("visibility", "hidden");
			return; // nothing left to do
		}
		// set up constants to be used to lines and arrows below the plot for periodicity
		const LEFT_X = 20;
		const MARKER_Y_UP = LEFT_EDGE_Y - 100;
		const MARKER_Y_DOWN = LEFT_EDGE_Y + 45;
		$('#Period_Text1').css("visibility", "visible");			
		$('#Period_Text2').css("visibility", "visible");
		if (C4_FREQ == freqSelect) {
			// go to CSS, pull out scales values and pull off px suffix and convert to numbers
			const SHORT_T = parseInt(rootStyles.getPropertyValue('--WIDTH_466HZ').replace('px', ''));
			const DOUBLE_T = 2 * SHORT_T;
			$('.Period_Tone').css("width", DOUBLE_T + 'px');
			// only need the first two boxes, turn off the last two
			$('.First_Period').css("visibility", "visible");			
			$('.Second_Period').css("visibility", "visible");
			$('.Third_Period').css("visibility", "hidden");
			$('.Fourth_Period').css("visibility", "hidden");
			// move the second box over by the new width of longer period
			const NEW_PERIOD_BOX_LEFT = LEFT_EDGE_X + DOUBLE_T;  
			$('.Second_Period').css("left", NEW_PERIOD_BOX_LEFT + 'px');
			//change the period wording
			$("#Period_Text1").html('Period T <br>= 1/Frequency = 1/(233.08 Hz) = 4.29 ms');
			$('#Period_Text2').css("left", (NEW_PERIOD_BOX_LEFT + SHORT_T) + 'px');
			$("#Period_Text2").html('T = 4.29 ms');
			// create X and Y of two "signposts"
			const SECOND_L_233_X = LEFT_X + 120 - 2;  // move it over a touch to account for line thickness
			const SECOND_R_233_X = SECOND_L_233_X + 2;  // move it over a touch to account for line thickness
			const THIRD_L_233_X = SECOND_R_233_X + 120 -2;   // move it over a touch to account for line thickness
			//*****Create the arrows, lines and text to show periodicity ******/
			// Need to make vertical lines to show where Period hits on graph
			ctxPeriod.beginPath();
			ctxPeriod.moveTo(LEFT_X, MARKER_Y_UP);	
			ctxPeriod.lineTo(LEFT_X, MARKER_Y_DOWN);
			ctxPeriod.strokeStyle = "red";
		    ctxPeriod.lineWidth = 1;  // no I don't know why the width is way wider than this... guess i dont care here
			// make end of period lines in red
			ctxPeriod.moveTo(SECOND_L_233_X, MARKER_Y_UP);
			ctxPeriod.lineTo(SECOND_L_233_X, MARKER_Y_DOWN);
			// make straight line between arrows
			ctxPeriod.moveTo(LEFT_X, LEFT_EDGE_Y);
			ctxPeriod.lineTo(SECOND_L_233_X, LEFT_EDGE_Y);
			ctxPeriod.stroke();
			// make period lines in blue for second period
			ctxPeriod.beginPath();
			ctxPeriod.moveTo(SECOND_R_233_X, MARKER_Y_UP);
			ctxPeriod.lineTo(SECOND_R_233_X, MARKER_Y_DOWN);	
			ctxPeriod.strokeStyle = "blue";		
			ctxPeriod.stroke();
			ctxPeriod.moveTo(THIRD_L_233_X, MARKER_Y_UP);
			ctxPeriod.lineTo(THIRD_L_233_X, MARKER_Y_DOWN);
			// make straight line between arrows
			ctxPeriod.moveTo(SECOND_R_233_X, LEFT_EDGE_Y);
			ctxPeriod.lineTo(THIRD_L_233_X, LEFT_EDGE_Y);
			ctxPeriod.stroke();
			ctxPeriod.closePath();
			// Need to make red/blue arrows for each period text
			new AxisArrow(ctxPeriod, [LEFT_X, LEFT_EDGE_Y], 'L',"red").draw();
			new AxisArrow(ctxPeriod, [SECOND_L_233_X, LEFT_EDGE_Y], 'R',"red").draw();
			new AxisArrow(ctxPeriod, [SECOND_R_233_X, LEFT_EDGE_Y], 'L',"blue").draw();
			new AxisArrow(ctxPeriod, [THIRD_L_233_X, LEFT_EDGE_Y], 'R',"blue").draw();
			
		} else if (C5_FREQ == freqSelect) {			
			// go to CSS, pull out scales values and pull off px suffix and convert to numbers
			const SHORT_T = parseInt(rootStyles.getPropertyValue('--WIDTH_466HZ').replace('px', ''));
			$('.Period_Tone').css("width", SHORT_T + 'px');
			// need to show all 4 boxes of period
			$('.First_Period').css("visibility", "visible");			
			$('.Second_Period').css("visibility", "visible");
			$('.Third_Period').css("visibility", "visible");
			$('.Fourth_Period').css("visibility", "visible");
			// move the second box over by the new width of longer period
			const NEW_PERIOD_BOX_LEFT = LEFT_EDGE_X + SHORT_T;  
			$('.Second_Period').css("left", NEW_PERIOD_BOX_LEFT + 'px');
			//change the period wording
			$("#Period_Text1").html('Period T <br>= 1/Frequency<br><br>= 1/(466.16 Hz) <br>= 2.15 ms');
			$('#Period_Text2').css("left", (NEW_PERIOD_BOX_LEFT + 40) + 'px');
			$("#Period_Text2").html('T = 2.15 ms');

			const SECOND_L_466_X = LEFT_X + 60 - 1;  
			const SECOND_R_466_X = SECOND_L_466_X + 2;  // move it over a touch to account for line thickness
			const THIRD_L_466_X = SECOND_R_466_X + 60 -1;
			//*****Create the arrows, lines and text to show periodicity ******/
			// Need to make vertical lines to show where Period hits on graph
			ctxPeriod.beginPath();
			ctxPeriod.moveTo(LEFT_X, MARKER_Y_UP);	
			ctxPeriod.lineTo(LEFT_X, MARKER_Y_DOWN);
			ctxPeriod.strokeStyle = "red";
		    ctxPeriod.lineWidth = 1;  // no I don't know why the width is way wider than this... guess i dont care here
			// make end of period lines in red
			ctxPeriod.moveTo(SECOND_L_466_X, MARKER_Y_UP);
			ctxPeriod.lineTo(SECOND_L_466_X, MARKER_Y_DOWN);
			// make straight line between arrows
			ctxPeriod.moveTo(LEFT_X, LEFT_EDGE_Y);
			ctxPeriod.lineTo(SECOND_L_466_X, LEFT_EDGE_Y);
			ctxPeriod.stroke();
			// make period lines in blue for second period
			ctxPeriod.beginPath();
			ctxPeriod.moveTo(SECOND_R_466_X, MARKER_Y_UP);
			ctxPeriod.lineTo(SECOND_R_466_X, MARKER_Y_DOWN);	
			ctxPeriod.strokeStyle = "blue";		
			ctxPeriod.stroke();
			ctxPeriod.moveTo(THIRD_L_466_X, MARKER_Y_UP);
			ctxPeriod.lineTo(THIRD_L_466_X, MARKER_Y_DOWN);
			// make straight line between arrows
			ctxPeriod.moveTo(SECOND_R_466_X, LEFT_EDGE_Y);
			ctxPeriod.lineTo(THIRD_L_466_X, LEFT_EDGE_Y);
			ctxPeriod.stroke();
			ctxPeriod.closePath();
			// Need to make red/blue arrows for each period text
			new AxisArrow(ctxPeriod, [LEFT_X, LEFT_EDGE_Y], 'L',"red").draw();
			new AxisArrow(ctxPeriod, [SECOND_L_466_X, LEFT_EDGE_Y], 'R',"red").draw();
			new AxisArrow(ctxPeriod, [SECOND_R_466_X, LEFT_EDGE_Y], 'L',"blue").draw();
			new AxisArrow(ctxPeriod, [THIRD_L_466_X, LEFT_EDGE_Y], 'R',"blue").draw();
						
		} else console.log(' Coding error, unexpected input freq to showPeriodicity as ' + freqSelect);	
	}	

	//***********************************
	// adjust mp3 plots so they phase line up with sine waves in most illustrative way possible
	//***********************************	
	function updatePlotsUserAides() {
		// we set up musical note for zero phase as we line it up with associated pitch sine	
		if (currTuneState == UNSELECTED) {
			// user has chosen "no instrument"
			// get rid of all old periodicity stuff, that overlays graphs, selectively turn on as needed later on	
			$('.First_Period').css("visibility", "hidden");			
			$('.Second_Period').css("visibility", "hidden");
			$('.Third_Period').css("visibility", "hidden");
			$('.Fourth_Period').css("visibility", "hidden");
			showPeriodicity();  //turn everything off
			sine_plot_100_1k.data.datasets[1].label = "";
			sine_plot_100_1k.data.datasets[1].borderColor = 'rgb(255,255,255)'; // white for legend (invisible)
			// clean up any Periodicity arrows/text if left over from musical notes and redraw expansion lines
			ctxPeriod.putImageData(backgroundPlot, 0, 0);
	    	// make all these changes happen
	    	sine_plot_100_1k.update();	
			return;
		}
		updateFreq();
		
		// change the musical note legends
		let instrArray = tuneState[currTuneState].split("_");
		let musicVerb = " plays ";
		if ("Human" == tuneInstrument[currTuneState]) { musicVerb = " sings "; }
		//The label wont accept html tags for sup/sub scripts or flat symbols
		sine_plot_100_1k.data.datasets[1].label = tuneInstrument[currTuneState];
		sine_plot_100_1k.data.datasets[1].borderColor = 'rgb(255,165,0)'
		sine_plot_100_1k.data.datasets[0].label = 'Pitch tone y=10sin(2' + PI + '(' + tuneFundamentalFreq[currTuneState] + ')t)';

		// update graphs
		drawTone()
		
		// get rid of all old periodicity stuff, that overlays graphs, selectively turn on as needed later on	
		$('.First_Period').css("visibility", "hidden");			
		$('.Second_Period').css("visibility", "hidden");
		$('.Third_Period').css("visibility", "hidden");
		$('.Fourth_Period').css("visibility", "hidden");

		// add periodicity as per the pitch freq (only two allowed here, 233.08 and 466.16)
		showPeriodicity(tuneFundamentalFreq[currTuneState]);
	}

	//***********************************
	//  Classes 
	//***********************************
	// this class is just for drawing the musical note on the graph, we save only a tiny chunk of buffer
	class InstrumentNote {
		constructor(buffer, tuneState, noteFreq) {
			this.samplePeriodMp3 = 1/buffer.sampleRate;
			// only save what we need to recreate plot and adds some more to handle extra needed to phase up to sine wave
			// so user can see how well the musical tone matches up to its pitch sine wave
			// calculate estimate of the number of points needed to show 1 period of musical note at the buffer sample rate
			this.POINTS_IN_NOTE_PERIOD = buffer.sampleRate / noteFreq;
			// 1.5 adds some points to search the period for "zero phase" before changing sample rate to plot
			const PHASE_UP_POINTS = 1.5 * this.POINTS_IN_NOTE_PERIOD;
			this.mp3Data = buffer.getChannelData(0).slice(tuneOffset[tuneState], tuneOffset[tuneState] + NUM_PTS_PLOT_LONG + PHASE_UP_POINTS + 1); 
		}
		
		// Web Audio opens the given mp3 file and resamples it according to the destination's desired sample rate
		// For example, all the mp3 files are at 44.1k and this is fine for many desktops but laptops seem to want
		// 48k and resample the buffer to get that.  If I want to phase up the mp3, I need to find best place phase to start
		// points, given we don't know sample rate apriori.  Want to find best "zero phase starting point" for musical note 
		// and then resample upward for good plotting
		findStartPhase(){
			// start at begin of buffer and search for 1.5 * POINTS_IN_NOTE_PERIOD points for interval with
			// largest change in Y that crosses zero axis, and is monotonic
			// search zone must be long enough so that if we start midsection of a steep ascent/descent, we pick up full interval at end
			const NUM_PTS_SEARCH = Math.trunc(this.POINTS_IN_NOTE_PERIOD * 1.25);  
			let bestInterval = {startPt: 0, endPt: 0, deltaY: 0, justB4CrossPt: 0, rising: false};
			let monotonicInc = false;  // positive slope
			let monotonicDec = false;	// negative slope
			let startPt = 0;
			let endPt = 0;
			// we'll keep track of rough extimate of zero crossing and improve when sample rate increases for graphing
			let justB4Crossing = 0;
				
			for (let i = 0; i < NUM_PTS_SEARCH; i++) {
				if (this.mp3Data[i+1] > this.mp3Data[i]) {
					// slope is positive and we are INCREASING
					monotonicInc = true;
					if (monotonicDec) {
						// we were decreasing, now we are increasing, do we want to save this last interval?
						// the interval must cross X axis
						if ( Math.sign(this.mp3Data[startPt]) != Math.sign(this.mp3Data[endPt]) ){
							let currDeltaY = this.mp3Data[startPt] - this.mp3Data[endPt];
							if (currDeltaY > bestInterval.deltaY ) {
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
						if ( (justB4Crossing == 0) && (Math.sign(this.mp3Data[startPt]) != Math.sign(this.mp3Data[i+1])) ) {
							// only want to catch this the first time
							justB4Crossing = i;
						}							
					}
				} else {
					// slope is negative and we are DECREASING
					monotonicDec = true;
					if (monotonicInc){
						// we were increasing, we are now decreasing, do we want to save this last interval?
						// the interval must cross X axis
						if ( Math.sign(this.mp3Data[startPt]) != Math.sign(this.mp3Data[endPt]) ){
							let currDeltaY = this.mp3Data[endPt] - this.mp3Data[startPt];
							if (currDeltaY > bestInterval.deltaY ) {
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
						endPt = i+1;
						if ( (justB4Crossing == 0) && (Math.sign(this.mp3Data[startPt]) != Math.sign(this.mp3Data[i+1])) ) {
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
			let riseFallState = (bestInterval.rising)?"rising":"falling";
			console.log("For this musical note, interval chosen is " + riseFallState);
			if (!bestInterval.rising) {
				plotFirstPt = bestInterval.justB4CrossPt + Math.trunc(this.POINTS_IN_NOTE_PERIOD/2); 
			}
			this.mp3Data = this.mp3Data.slice(plotFirstPt, plotFirstPt + NUM_PTS_PLOT_LONG + 1);
		}
		
		getGraphArray() {
			let graphArray = [];			
			// count up time on the graph
			let tG = 0.0;
			// count up time for each point in the mp3 file
			let currIndxMp3 = 0;
			let numPtsPlot;
			let graphTs;

			// plotting for the 10 ms graph
			numPtsPlot = NUM_PTS_PLOT_LONG;
			graphTs = samplePeriodLong;

			// want to illustrate that sine wave at pitch freq is the periodicity of musical note waveform
			// To enhance visualization, phase up the buffer so that we "start" at zero crossing of steepest ascent/descent
			// we will then feed this "new" buffer into the sample rate converter for plotting
			this.findStartPhase();
			
			// using nearest neighbor approximation for arbitrary sample rate conversion of MP3 rate to graph rate
			for (let i = 0; i <= numPtsPlot; i++) {
				tG = graphTs * i;
				let tM = currIndxMp3 * this.samplePeriodMp3;
				let tMp1 = tM + this.samplePeriodMp3;
				
				// This if for top graph over longer time interval
				if ( (tG - tM) > (tMp1 - tG) ) {
					currIndxMp3 = currIndxMp3 + 1;
				}
				// mp3 scales so max value is 1, rescale so it will fit this graph
				graphArray[i] = this.mp3Data[currIndxMp3];
			}
			// compare expected with actual graph sample rate/ mp3 file sample rate
			let approxSampRatio = numPtsPlot/currIndxMp3;
			let actualSampRatio = this.samplePeriodMp3/graphTs;
			console.log("Calculated (Sample rate of Graph)/(sample Rate of Mp3) as " + approxSampRatio);
			console.log("We expected Fsg/Fsmp3 = " + actualSampRatio + " Difference is " + (approxSampRatio - actualSampRatio));
			return graphArray;
		}
	}  // end of class InstrumentNote
		
	//***********************************
	//  User instigated callback events   CHANGE Musical Note Volume
	//***********************************
	// must do these at a global level since we allow an abort of tone playing, must keep around the original
	// source reference
	let sourceNote;
	let context;
	// Safari has implemented AudioContext as webkitAudioContext so need next LOC
	
	// Do we have Web Audio API? if not, alert user to failure
	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
	} catch (e) {
		alert("Web Audio API is not supported in this browser, you won't be able to hear tones/musical notes");
	}

	function changeMP3Volume(mute = false){
		//for MP3, will use max volume setting to give factor of 2 (3db) increase.
		//middle setting is no amplification and zero setting is mute
		// https://stackoverflow.com/questions/70480176/webaudio-api-change-volume-for-one-of-sources
		// createGain can be used to mute as well
		let ampVal = $currMusicAmp.val();
		if (mute) {
			ampVal = 0;
		}
		let mp3Gain = ampVal;
		let gainMusicNode = context.createGain();  //return is a GainNode
		const MAX_VOL_GAIN = 10;  // need to do better here, match this with max vol from html
		gainMusicNode.gain.value = mp3Gain * 2 / MAX_VOL_GAIN;  // between 0 and 1 is attenuation, over 1 is gain. 
		if (sourceNote) {
			// otherwise, we dont have an instrument selected so nothing to do
			sourceNote.disconnect(0);  // get rid of old tone volume
			sourceNote.connect(gainMusicNode).connect(context.destination);  // bring in new volume tone						
		}
	}
	
	function setMusicAmp(){
		$currMusicAmp = $("#music-amp")
		$("#currMusicVolLabel").text($currMusicAmp.val());
		changeMP3Volume();
	}

	function setToneAmp(){
		$currToneAmp = $("#tone-amp");
		$("#currToneVolLabel").text($currToneAmp.val());
		let tonejs_dB = -20 + 20.0 * Math.log10($currToneAmp.val());
		osc.volume.value = tonejs_dB;		
	}
	//***********************************
	//  User instigated callback events   CHANGE Tone Volume
	//***********************************
	// Change label on music amplitude slider and adjust the tone as appropriate
	$('#music-amp').on('change', function(){
		setMusicAmp();
	});
	
	// set the default initial value to low value
	let DEFAULT_VOL = 3; // as set in html for element
	$("#tone-amp").prop("value", DEFAULT_VOL);
	let $currToneAmp = $("#tone-amp");
	setToneAmp();
	$("#currToneVolLabel").text($("#tone-amp").val());
	$("#music-amp").prop("value", DEFAULT_VOL);
	let $currMusicAmp = $("#music-amp");
	$("#currMusicVolLabel").text($("#music-amp").val());


	// allow for user changes
	$('#noteVol').on('input', function(){
		setVolume();
	});
	
	// Change label on tone amplitude slider and adjust the tone as appropriate
	$('#tone-amp').on('change', function(){
		setToneAmp();
	});	
	
	//***********************************
	//  User instigated callback events   User STARTS or STOPS TONE
	//***********************************
	$('#toneStartButton').on('click', function(){
		if (typeof ToneIsOnNow == "undefined")  {
			// First time in, 
			ToneIsOnNow = false;
		};
		// convert amplitude to what tone.js calls decibels.  In tone.js, -40 dB is very quiet
		// and 0 dB is plenty loud enough.  I know this isn't the music industry definition (decibel SPL where 0 dB
		// is the quietest sound one can hear and 100 dB will cause hearing damage) so I will say Amplitude = 1
		// is min audible and amplitude 40 dB higher (40 = 20log(A1/A0) or A1=100 if A0 = 1) is max we want to put out
		let tonejs_dB = -20 + 20.0 * Math.log10($currToneAmp.val());
		if (ToneIsOnNow==false) {
			// currently false, clicked by user and about to be true 
			osc = new Tone.Oscillator({
					frequency: currFreq, 
					volume: tonejs_dB,
					type:"sine"});
			osc.toDestination().start();	
			$("#toneStartButton").attr("src", VOL_ON_ICON);
			$("#toneStartButton").attr("alt", VOL_ON_ALT);
			$("#toneStartButton").attr("data-original-title", 'click to turn off your sine wave');
			$('#toneStartButton').css('background-color', STOP_COLOR);
			ToneIsOnNow = true;
		} else {
			osc.toDestination().stop();
			$("#toneStartButton").attr("src", VOL_OFF_ICON);
			$("#toneStartButton").attr("alt", VOL_OFF_ALT);
			$("#toneStartButton").attr("data-original-title", 'turn on speaker and click to hear sine wave');
			$('#toneStartButton').css('background-color', GO_COLOR);
			ToneIsOnNow = false;
		}
	});
	
	// update advanced topics modal tab text
	let todo_tab_element = "#AdvancedTopics > .modal-dialog > .modal-content > .modal-body > #tab011 > p";
	let expln_tab_element = "#AdvancedTopics > .modal-dialog > .modal-content > .modal-body > #tab021 > p";
	
	//***********************************
	//  User instigated callback events   User SELECTS NEW instrument
	// prepOnly means we are just initializing sourceNote for AutoDemo since iOS will not allow init of any webAudio element from a CustomEvent 
	// (which all autodemo events are, since they are simulated real events).  prepOnly=false is normal behavior
	//***********************************
	function prepToPlayNote(chosenInstrument, prepOnly = false) {
		let currInstrument = chosenInstrument;
		//find the index of the selected instrument that was read in from JSON file
		currTuneState = UNSELECTED;
		$.each(tuneInstrument, function(index) {
			if (currInstrument == tuneInstrument[index]) {
				// no software error, html matches JSON
				currTuneState = index;
			}
		});

		return new Promise((resolve,reject) => {

	    	if (currTuneState === UNSELECTED) {
				// should never happen
				console.log('SW Bug, html does not match JSON config file')
				updatePlotsUserAides();
				$("#musicalActivity").html(DEFAULT_TITLE);
				$("#allowNotePlay").css("visibility", "hidden"); 
				$("#currMusicNoteLabel").html("");
				reject("SW bug, html does match JSON config file");
			} else {	
				console.log('currTuneState is ' + currTuneState)
				// update advanced modal window
				$(todo_tab_element).html(tuneToDo[currTuneState]);
				$(expln_tab_element).html(tuneExpln[currTuneState]);
				if (!prepOnly){
					$("#musicalActivity").html(tuneTitle[currTuneState]);
					$("#currMusicNoteLabel").html(NOTE_MAPPING.get(tuneMusicalNote[currTuneState]) );	
				}		
	
				if (tuneBuffer == null || tuneBuffer[currTuneState] == null) {
					// get musical note for first time, filename in config must be mp3
					// I don't think we need a csrf token for this ajax post. Nothing is stored to database, request must be a filename we have or else get error back
					// DO:  look into putting a loading spinner icon to show progress in bringing over file (see bootstrap lib)
					fetch(tuneFilenameURL[currTuneState])
					.then(response => {
						if (!response.ok) {
        					throw new Error("Fetch error, status = " + response.status);
						} else {
							return response.arrayBuffer()
						}		
					})
					.then(arrayBuffer => context.decodeAudioData(arrayBuffer),
					                     function(err) { 
											 alert("err(decodeAudioData) on file for: " + tuneInstrument[currTuneState] + " error =" + err); 
											 } )
					.then(buffer => {
						// to get here means asynchronous mp3 decode is complete and successful
						console.log("finished decoding mp3");
						// copy AudioBuffer into array for this instrument/note so don't have to bug the server with requests
						try {
							console.log(" buffer length is " + buffer.length + " buffer sample rate is " + buffer.sampleRate + " currTuneState = " + currTuneState);
							tuneBuffer[currTuneState] = context.createBuffer(1, buffer.length , buffer.sampleRate);
							buffer.copyFromChannel(tuneBuffer[currTuneState].getChannelData(0), 0);
						} catch(e) {
							// most likely not enough space to createBuffer
							console.error(e);
					 		alert("Failed note file setup, error is " + e);
						}
			
						console.log("the length of copied tune Buffer is " + tuneBuffer[currTuneState].length)						
						// setup the class from which we will get points to graph the note
						noteFilePoint[currTuneState] = new InstrumentNote(buffer, currTuneState, tuneFundamentalFreq[currTuneState]);
						tuneGraphLong[currTuneState] = noteFilePoint[currTuneState].getGraphArray();
						
						// clean up the signal params and graphs and user aides for new instrument
						if (!prepOnly){
							updatePlotsUserAides();
							
							// we have new instrument mp3, allow play
							$("#allowNotePlay").attr("src", VOL_OFF_ICON);
							$("#allowNotePlay").attr("alt", VOL_OFF_ALT);
							$("#allowNotePlay").attr("data-original-title", 'turn on speaker and click to hear musical note');
							$("#allowNotePlay").css("background-color", GO_COLOR); // initial value
							$("#allowNotePlay").css("visibility", "visible");  
						}
						// indicate that we did need to load this up for first time
						resolve("Music file was successfully retrieved and decoded");
					},function(err) { alert("error creating buffer: " + tuneInstrument[currTuneState] + " error =" + err); } )
					.catch(error => console.log("Error in " + tuneInstrument[currTuneState] + ".  " + error))
					
	        	} else {
					// we already have this instrument cached
					// clean up the signal params and graphs and user aides for new instrument
					if (!prepOnly){
						updatePlotsUserAides();
						// we have new instrument mp3, allow play
						$("#allowNotePlay").attr("src", '../../static/images/volume-off.svg');
						$("#allowNotePlay").attr("alt", 'Volume is currently off');
						$("#allowNotePlay").attr("data-original-title", 'turn on speaker and click to hear musical note');
						$("#allowNotePlay").css("background-color", GO_COLOR); // initial value
		     			$("#allowNotePlay").css("visibility", "visible"); 
					}
					// indicate we already had this mp3 file loaded up so all good
					resolve("Music file was already in local cache") 
				}
			}
		})	
	}
	
	// user selects an instrument from dropdown menu
	$('#InstrumentSel .dropdown-menu button').click(function () {  
		prepToPlayNote($(this).val())
	})		

	//***********************************
	//  User instigated callback events   User selects PLAY INSTRUMENT they have selected
	//***********************************
	$('#allowNotePlay').on('click', function(){
		if (typeof noteIsOnNow == "undefined")  {
			// First time in, 
			noteIsOnNow = false;
		};			
		if (tuneBuffer == null || tuneBuffer[currTuneState] == null) {
			// should never happen, decode and copy should finish before we get here with normal user (non robot)
			let prob;
			if (tuneBuffer == null) {
				prob = "  Whole tune buffer is null";
			}
			else {
				prob = "  The tune buffer for state " + currTuneState + " is null";
			}
			console.error("Timing error, file transfer and decode not complete." + prob);
		} else {
			if (noteIsOnNow === false) {	
				sourceNote = context.createBufferSource();
				sourceNote.buffer = tuneBuffer[currTuneState];
				changeMP3Volume(); // sets up gain to current user setting and start
				// auto play
				sourceNote.start(0);			
				noteIsOnNow = true;
				$("#allowNotePlay").attr("src", VOL_ON_ICON);
				$("#allowNotePlay").attr("alt", VOL_ON_ALT);
				$("#allowNotePlay").attr("data-original-title", 'click to turn off musical note');
				$("#allowNotePlay").css("background-color", STOP_COLOR);
			} else {
	        	// someone is tired of listening to our lovely tuning note
	        	sourceNote.stop(0); 
				noteIsOnNow = false;
				$("#allowNotePlay").attr("src", VOL_OFF_ICON);
				$("#allowNotePlay").attr("alt", VOL_OFF_ALT);
				$("#allowNotePlay").attr("data-original-title", 'turn on speaker and click to hear musical note');
				$("#allowNotePlay").css("background-color", GO_COLOR); // initial value
			}
			sourceNote.onended = () => {
				// no longer playing the note, either by user stop or natural completion
				noteIsOnNow = false;
				$("#allowNotePlay").attr("src", VOL_OFF_ICON);
				$("#allowNotePlay").attr("alt", VOL_OFF_ALT);
				$("#allowNotePlay").attr("data-original-title", 'turn on speaker and click to hear musical note');
				$("#allowNotePlay").css("background-color", GO_COLOR);
			}
        }
    });	
		
	//***********************************
	//  Immediate execution here
	//***********************************

	// prepare to draw the 10ms plot at top
    if ( $("#sine_plotsLong").length ) {
    	ctxLong = $("#sine_plotsLong").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain sin_plotsLo context');
	};
			
	//if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	const CHART_OPTIONS = {
		maintainAspectRatio: false,  //uses the size it is given
		responsive: true,
		elements:{
			point:{
				radius: 1     // to get rid of individual points
			}
		},
		scales: {	
			x: {
				type: 'linear',
				title: {
					display: true,
					text: 't (milliseconds)'
				},
				// see https://www.chartjs.org/docs/latest/axes/cartesian/linear.html
				ticks: {
					stepSize: 0.2,
				}
			},
			y: {
				type: 'linear',
				max: 10,  //too confusing to teens if scale changes because one number is 1% over, better to clip
				min: -10,
				title: {
					display: true,
					text: 'y amplitude',
				},
			}
		},
	};
	
	const TOP_CHART = {...CHART_OPTIONS };
	let sine_plot_100_1k = new Chart(ctxLong, {
	    type: 'line',
	    data: {
	    	labels: timeMsLong,
	        datasets: [{
	            label: 'Pitch tone y=10sin(2' + PI + '(' + C5_FREQ + ')t)',
	            data: ampLong,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',  //aqua
	            },
	            // this will be the musical note data
	            {
	            label: '',
	            data: ampLongCurrNote,
	            fill: false,
	            borderColor: 'rgb(255,255,255)',  // set it to white, cheezy way to null the legend till needed
	            }]
	    },
	    options: TOP_CHART
	});
	// if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	
	//***********************************
	//initialize values for tone as page first comes up
	//***********************************
	fillInArrays();
	drawTone();
	$("#currFreqLabel").text(currFreq);

	//***********************************
	//initialize data fields for tone and musical notes
	//***********************************	
	$.getJSON(urlInitValJson)
		.done(function(data,status,xhr) {
			//xhr has good stuff like status, responseJSON, statusText, progress
			if (status === 'success') {				
				$.each(data.TestNote, function(index, paramSet) {
					// set the params for all the instruments
					tuneState[index] = (paramSet.instrument).replace(" ","_") + "_" + paramSet.musicalNote;
					tuneMusicalNote[index] = paramSet.musicalNote;
					tuneExpln[index] = paramSet.expln;		
					tuneToDo[index]= paramSet.todo;			
					tuneInstrument[index] = paramSet.instrument;
					tuneTitle[index] = paramSet.title;
					tuneOffset[index] = parseInt(paramSet.tuneOffset);
					tuneFundamentalFreq[index] = parseFloat(paramSet.fundamentalHz);
					tuneFilenameURL[index] = paramSet.filenameURL;
				});				
				$("#musicalActivity").html(tuneTitle[currTuneState]);
			}
			else {
				console.log("config json file request returned with status = " + status);
			}
		})
		.fail(function(data, status, error) {
			console.error("Error in JSON file " + status + error);
			alert("Error in JSON file " + status + error);
		})
		
	//***********************************
	//initial user help via pop up modal window
	//***********************************	
	// after 1 sec, put up a modal window that explains what to do.  Very short/simple.  Will only
	// happen once per session and only if in expert mode (wont happen in newbie mode)
	if ((!sessionStorage.adModal) && (!stopModal)) {
		setTimeout(function() {
			$('#admodal').find('.item').first().addClass('active');
		    $('#admodal').modal({
		    	backdrop: 'static',
	    		keyboard: false
		    });
		}, 1000);
	    sessionStorage.adModal = 1;
    }
     
    //****************************************************************************
    // Autodemo script for tone trig
    //**************************************************************************** 
	const SCRIPT_AUTO_DEMO = [

	{ segmentName: "Trig in Trumpet",
	  headStartForAudioMillisec: 11000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'MusicNotesTrigSeg0'}
			},
			//*****************************
			// click on select instrument pulldown menu 
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#InstrumentTypeSel',
			 	 action: "click",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// get rid of drop down menu cursor
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#InstrumentTypeSel',
			 	 action: "nothing",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 1000} 
			},
			//*****************************
			// show we will click on trumpet from drop down menu
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#InstrumentSelections button[value="Trumpet"]',
			 	 action: "focus",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},

			// focus first then click so user sees what we do
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#InstrumentSelections button[value="Trumpet"]',
			 	 action: "click",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 50}  // this is wait before you go on to next item
			},
			// get rid of focus cursors
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element: '#InstrumentSelections  button[value="Trumpet"]',
			 	 action: "nothing",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 50}  // this is wait before you go on to next item
			},
			// get rid of click cursor
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element: '#InstrumentSelections button[value="Trumpet"]',
			 	 action: "nothing",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 59000}  // this is wait before you go on to next item
			},

			//*****************************
			// Big gap here as we explain the periodicity of trumpet
			//*****************************	
			
			// TURN ON sine wave tone
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x:25, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "nothing",
			 	waitTimeMillisec: 1000} 
			},
			// wait a bit and TURN ON trumpet
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#allowNotePlay',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x:25, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#allowNotePlay',
			 	 action: "nothing",
			 	waitTimeMillisec: 5000} 
			},			
			// TURN OFF sine wave, Trumpet will play itself out
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x:25, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "nothing",
			 	waitTimeMillisec: 1000} 
			},
	  ]
	},
	{ segmentName: "Other instruments",
	  headStartForAudioMillisec: 25000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'MusicNotesTrigSeg1'}
			},
			//*****************************
			// click on select instrument pulldown menu 
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#InstrumentTypeSel',
			 	 action: "click",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// get rid of drop down menu cursor
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#InstrumentTypeSel',
			 	 action: "nothing",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 1000} 
			},
			//*****************************
			// show we will click on flute from drop down menu
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#InstrumentSelections button[value="Flute"]',
			 	 action: "focus",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},

			// focus first then click so user sees what we do
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#InstrumentSelections button[value="Flute"]',
			 	 action: "click",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 50}  // this is wait before you go on to next item
			},
			// get rid of focus cursors
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element: '#InstrumentSelections  button[value="Flute"]',
			 	 action: "nothing",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 50}  // this is wait before you go on to next item
			},
			// get rid of click cursor
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element: '#InstrumentSelections button[value="Flute"]',
			 	 action: "nothing",
			 	 offset: {x: 20, y: 20},
			 	waitTimeMillisec: 17000}  // this is wait before you go on to next item
			},

			//*****************************
			// Big gap here as we explain the periodicity of trumpet
			//*****************************	
			// TURN ON sine wave tone
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x:25, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "nothing",
			 	waitTimeMillisec: 1000} 
			},
			// wait a bit and TURN ON flute
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#allowNotePlay',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x:25, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#allowNotePlay',
			 	 action: "nothing",
			 	waitTimeMillisec: 5000} 
			},			
			// TURN OFF sine wave, instrument will play itself out
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 25, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "nothing",
			 	waitTimeMillisec: 1000} 
			},

	  ]
	},
	];
	// read the config file and find the actual filenames and put in true values.  First call 'may' have to read
	// from file, all succeeding calls will be faster since read from local memory
	console.log('starting musicnotes trig ' + SCRIPT_AUTO_DEMO[0].segmentActivities[0].segmentParams.filenameURL)
   	getActualFilename(SCRIPT_AUTO_DEMO[0].segmentActivities[0].segmentParams.filenameURL)
   		.done(resp1 => {
			  	SCRIPT_AUTO_DEMO[0].segmentActivities[0].segmentParams.filenameURL = resp1;
			  	console.log('musicnotes trig ' + resp1)
			  	// this one should be fast, in case previous one had to open file
			  	getActualFilename(SCRIPT_AUTO_DEMO[1].segmentActivities[0].segmentParams.filenameURL)
			  	.done(resp2 => SCRIPT_AUTO_DEMO[1].segmentActivities[0].segmentParams.filenameURL = resp2)
			  	});
    //****************************************************************************
    // User initiates autoDemo activity
    //****************************************************************************   
	//*** user clicks the start demo image, iniitalize everything
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO);  // give the demo the full script

	$('#startAutoDemo').click(function() {
  		demo.prepDemoControls();
  		//move header and tone/music controls to right when autodemo is active
    	demo.moveToRightForAutoDemo($('#headerAndCtl_TT'));
    	demo.moveToRightForAutoDemo($('#MusicNotesToneControl'));
    	
		// Only in autodemos that use MP3 (like MusicNotesTrig that plays musician notes), we need to send the original webAudio context
		// since iOS will not allow initial use of AudioContext unless initialized by user click (not CustomEvent as is done in AutoDemo).  To solve
		// this, on user click of start here button, we create the WebAudio that will be used in the demo (using trumpet).  We will create the tone
		// WebAudio object when user hits play.  Both events take time, want to spread that out as much as possible

		// MP3 in response
		// to CustomEvent.  On other pages with AutoDemo that don't play extra MP3 (other than voice that explains), this value is not set and its ok
		// to just define it here.
		if (undefined === sourceNote) {
			// this means user hasn't played with music notes so far and autodemo will not play music notes until we initialize 
			// sourceNote before the CustomEvent happens in AutoDemo
			console.log("We need to initialize SourceNote since extra MP3 will be played during autoDemo");	
			// prep the SourceNote as required by iOS for Autodemo mp3 play]
			prepToPlayNote("Trumpet", true).then( (onResolved) => {
					console.log(onResolved);  // did we need to read from scratch or did we already have it?
					// async function prepToPlayNote returns promise, need to wait till its done
					sourceNote = context.createBufferSource();
					sourceNote.buffer = tuneBuffer[currTuneState];
					//yes I shouldn't have to turn on the sound, but iOS requires this in order to run autodemo with musicians mp3
					changeMP3Volume(true);  //mute the sound,
					sourceNote.start(0);  //turn on fast
					sourceNote.stop(0);   // turn off fast, no one should notice									
				}, 
				(onRejected) => {
					console.log("Failure instantiating sourceNote WebAudio element. " + onRejected)
				}
			);
		}
		   		
    });
   
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************

	function resetToDefaults() {
		// get rid of any musical note legends and make the title "generic"
		$("#musicalActivity").html(DEFAULT_TITLE);  //load up default
		$("#currMusicNoteLabel").html("");  // no note playing   	
		sine_plot_100_1k.data.datasets[1].label = "";
		sine_plot_100_1k.data.datasets[1].borderColor = 'rgb(255,255,255)'; // white for legend (invisible)
		
		// clean up any Periodicity arrows/text if left over from musical notes and redraw expansion lines
		ctxPeriod.putImageData(backgroundPlot, 0, 0);
		// get rid of all old periodicity stuff, in case its present
		$('.First_Period').css("visibility", "hidden");			
		$('.Second_Period').css("visibility", "hidden");
		$('.Third_Period').css("visibility", "hidden");
		$('.Fourth_Period').css("visibility", "hidden");
		$("#Period_Text1").css("visibility", "hidden");			
		$('#Period_Text2').css("visibility", "hidden");
		// update graphs, to eliminate musical note if present
		drawTone()
		// set all volumes to default values
		$("#tone-amp").prop("value", DEFAULT_VOL);
		$("#currToneVolLabel").text($("#tone-amp").val());
		setToneAmp();
		$("#music-amp").prop("value", DEFAULT_VOL);
		$("#currMusicVolLabel").text($("#music-amp").val());
		setMusicAmp();
		// turn off all sounds
		if (sourceNote) {
			//    turn off musical note, if its on
	    	sourceNote.stop(0);
	    } 
		noteIsOnNow = false;
		$("#allowNotePlay").attr("src", VOL_OFF_ICON);
		$("#allowNotePlay").attr("alt", VOL_OFF_ALT);
		$("#allowNotePlay").attr("data-original-title", 'turn on speaker and click to hear musical note');
		$("#allowNotePlay").css("background-color", GO_COLOR); // initial value
		//    turn off tone
		osc.toDestination().stop();
		$("#toneStartButton").attr("src", VOL_OFF_ICON);
		$("#toneStartButton").attr("alt", VOL_OFF_ALT);
		$("#toneStartButton").attr("data-original-title", 'turn on speaker and click to hear sine wave');
		$('#toneStartButton').css('background-color', GO_COLOR);
		ToneIsOnNow = false;
	}
	// User has selected play
    $('#playSegment').on('click', function(){	
		//So Safari requires that a user touch (cant do CustomEvent) instigates a WebAudio event
		// here we "cheat" and let user play button touch do a quick audio action to satisfy Safari before Autodemo
		// which will play tones or music
		osc.toDestination().start();
		osc.frequency.value = 80;  // below what most speakers will play
		osc.toDestination().stop();
		
		// as noted above for iOS, cant instigate a WebAudio event from CustomEvent (which is how autodemo works when user hits play, 
		// it simulates real user events).  start the WebAudio event for source note mp3 from musicians here so it can be done for real later
		// so we will send the AudioContext used for musician notes to the autoDemo so it can be initialized with explainers voice MP3
		// audioContext_iOS: context}  <-- part of script where we pass in WebAudio object for initialization upon user click of "play"	
		// end Safari hack
		
    	// in case plots have other stuff on them from other activities, clean it up
		resetToDefaults();
    	demo.startDemo();
    });
    
    $('#stopSegment').on('click', function(){	
    	demo.stopThisSegment(false);  //we don't want to destroy controls box
    	resetToDefaults();  // turn off any sound, clean up
    });
    
    $('#dismissAutoDemo').on('click', function(){	
    	// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen
    	demo.stopThisSegment();  // may or may not be needed
  		//move header and tone/music controls to right when autodemo is active
    	demo.moveToLeftForAutoDemo($('#headerAndCtl_TT'));
    	demo.moveToLeftForAutoDemo($('#MusicNotesToneControl'));
  		resetToDefaults();  // turn off any sound, clean up
    });
    
    $("#segNum").change(function(){
		let currSeg = parseInt($('#segNum').val());
		demo.setCurrSeg(currSeg);
		
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
	});
	
})
