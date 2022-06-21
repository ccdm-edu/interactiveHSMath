'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {

	// implement the Tone sounding and chart tools
	let $currFreq = $("#in-range-freq");
	let $currAmp = $("#in-range-amp");
	let $currPhase = $("#in-range-phase")
	
	let noteIsOnNow = false;  // for musical note
	let ToneIsOnNow = false;  // for synthesized tone, both musical note and tone can play additively.
	let osc = new Tone.Oscillator(); 
	
	//initialize variables needed to play the non synthesized tone musical notes
	const DEFAULT_TONE = 0;  // first item in drop down is always plain synthesized tone
	let tuneState = [];
	let currTuneState = DEFAULT_TONE;  // pick the first element, which will be the synthesized tones
	let tuneExpln = [];
	let tuneToDo = []
	let tuneInstrument = [];
	let tuneTitle = [];
	let tuneBuffer = [];  // array of AudioBuffer for currTuneState 1 through N, all musical notes, used to play full mp3 file
	let tuneOffset = []; // determines when plotting will begin in mp3 file, index is currTuneState
	let tuneFundamentalFreq = []; // initialize tone for closest approx
	let tuneGraphLong = [[]];  // holds an array, per note, of graphing points for long graph (10ms)
	let tuneGraphShort = [[]];    // holds an array, per note, of graphing points for short graph (1ms)
	let noteFilePoint = [];   // array for every instrument of InstrumentNote, will determine next point using multirate sample rate conversion
	// DO need to handle the currTuneState = tone and we don't plot that one this way...
	
	//everything is relative to the html page this code operates on, server needs to work from /static directory (without django intervention)
	const STATIC_FILE_LOC = "../../static/json/";
	const urlInitValJson = STATIC_FILE_LOC + "ToneTrigConfig.json";
	
	// used for plotting
	let timeMsLong = [];
	let ampLong = [];
	let ampLongCurrNote = [];  // what is plotted
	let timeMsShort = [];
	let ampShort = [];

	const NUM_PTS_PLOT_SHORT = 200;
	const NUM_PTS_PLOT_LONG = 1000;
	const DURATION_LONG_PLOT_MS = 10;
	const DURATION_SHORT_PLOT_MS = 1;	
	//sample period in sec
	// yes, these are ridiculously high rates, didn't want to have ANY sampling artifacts in plots...
	const samplePeriodLong = DURATION_LONG_PLOT_MS/(1000 * NUM_PTS_PLOT_LONG);
	const samplePeriodShort = DURATION_SHORT_PLOT_MS/(1000 * NUM_PTS_PLOT_SHORT);
	
	function fillInArrays(){
		let i;
		for (i=0; i<=NUM_PTS_PLOT_LONG; i++) {
			ampLong[i] = $currAmp.val() * Math.sin(2 * Math.PI * ($currFreq.val() * i * samplePeriodLong + $currPhase.val() / 360.0) );
			timeMsLong[i] = roundFP(i * samplePeriodLong * 1000, 2);	
			// this allows us to turn off graph yet keep data around, for currTuneState=TONE_ONLY, this will be a null array 
			if (tuneGraphLong[currTuneState] != null) {
				// arbitrary fixed amplification factor put on mp3 signals for ease in plotting.  Changing
				// amplitude only changes tone volume, not the mp3 musical note volume
				ampLongCurrNote[i] = 10 * tuneGraphLong[currTuneState][i];	

			}	
		}
		for (i=0; i<=NUM_PTS_PLOT_SHORT; i++) {
			ampShort[i] = $currAmp.val() * Math.sin(2 * Math.PI * ($currFreq.val() * i * samplePeriodShort + $currPhase.val() / 360.0) );
			timeMsShort[i] = roundFP(i * samplePeriodShort * 1000, 2);				

		}	

	};
	
	function drawTone()
	{
		// CHART js hint:  update time, need to add the new and THEN remove the old.  X axis doesn't like to be empty...
		// actually, I decided to never change time
		
	    // update tone, remove old (although for now, just one data set)
	    sine_plot_100_1k.data.datasets.forEach((dataset) => {
	    	// somehow, this pop changes the length of ampLong, so best to refill arrays afterwards to get full length
	    	// seems like a library bug? but one we can get around
	        dataset.data.pop();
	    });
				
	    // update tone, remove old (although for now, just one data set), add new
	    sine_plot_1k_10k.data.datasets.forEach((dataset) => {
	    	// somehow, this pop changes the length of ampShort, so best to refill arrays afterwards to get full length
	        dataset.data.pop();
	    });
	    
	    // update title to match new parameters
	    // http://www.javascripter.net/faq/greekletters.htm added pi in as greek letter
	    let currTitleText = 'y = ' + $currAmp.val() + ' * sin{ 2 * \u03C0 * (' + $currFreq.val() + ' * t + ' + $currPhase.val() + '/360) }';
	    sine_plot_100_1k.options.title.text = currTitleText;
		
		// now fill the arrays and push them to the plots
		fillInArrays();   
		// update 10 ms plot
		sine_plot_100_1k.data.datasets[0].data.push(ampLong);	 
		// update 1 ms plot
	    sine_plot_1k_10k.data.datasets[0].data.push(ampShort);


	    // make all these changes happen
	    sine_plot_100_1k.update();	                    
	    sine_plot_1k_10k.update();  
	};
	
	function updateFreq() {
		//min and max freq chosen depends on audio speakers used, my speakers can just barely respond at 100 Hz
		$currFreq= $("#in-range-freq")   // get slider value
		$("#currFreqLabel").text($currFreq.val());   // and put it on the label as string
		if (ToneIsOnNow==true) {
			osc.frequency.value = $currFreq.val();
			// if tone isn't on, don't have to change anything...
		}
	}
	
	function updatePhase() {
		$currPhase = $("#in-range-phase")
		$("#currPhaseLabel").text($currPhase.val());
		// LATER:  move this to jquery popups, doesn't work well in safari
		switch (parseInt($currPhase.val())) {
			case 180:
				//alert('Hey Look!  phase = 180 is a negative sine wave! \nsin(a+180) = sin(a)cos(180) + cos(a)sin(180)\n                  = sin(a) * -1       + cos(a) * 0 \n                  = -sin(a)');
				break;
			case 270:
				//alert('Hey Look!  phase = 270 is a negative cosine wave! \nsin(a+270) = sin(a)cos(270) + cos(a)sin(270)\n                  = sin(a) * 0       + cos(a) * -1 \n                  = -cos(a)');
				break;
			case 360:
				//alert('Hey Look!  phase = 360 = 0 is a sine wave! \nWhy?  Because 360 degrees = 2 pi takes you back to the beginning at zero');
				break;
		}
		if (ToneIsOnNow==true) {
			osc.phase = $currPhase.val();
			// if tone isn't on, don't have to change anything...
		}	
	}

	//***********************************
	//  Classes 
	//***********************************
	// this class is just for drawing the musical note on the graph, we save only a tiny chunk of buffer
	class InstrumentNote {
		constructor(buffer, tuneState, noteFreq) {
			this.samplePeriodMp3 = 1/buffer.sampleRate;
			// only save what we need to recreate plot and adds some more to handle extra needed to phase up to sine wave
			// so client can see how well the musical tone matches up to its pitch sine wave
			// calculate estimate of the number of points needed to show 1 period of musical note at the buffer sample rate
			this.POINTS_IN_NOTE_PERIOD = buffer.sampleRate / noteFreq;
			// 1.5 adds some points to search the period for "zero phase" before changing sample rate to plot
			const PHASE_UP_POINTS = 1.5 * this.POINTS_IN_NOTE_PERIOD;
			console.log(" we calculate phase up pts as " + PHASE_UP_POINTS);
			this.mp3Data = buffer.getChannelData(0).slice(tuneOffset[tuneState], tuneOffset[tuneState] + NUM_PTS_PLOT_LONG + PHASE_UP_POINTS + 1);
			this.currTuneState = tuneState;  
			if (tuneState === DEFAULT_TONE) {
				console.error(" This should never be called for the synthesized tone, only for mp3 files");
			}
			this.sinePhase = 0;  //This is only for increasing ascending slopes, if we find descending, choose 180
		}
		
		// Web Audio opens the given mp3 file and resamples it according to the destination's desired sample rate
		// For example, all the mp3 files are at 44.1k and this is fine for many desktops but laptops seem to want
		// 48k and resample the buffer to get that.  If I want to phase up the mp3, I need to find best place to start
		// given we don't know sample rate apriori.  Want to find best "zero phase starting point" for musical note 
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
					
			// if we are matching to an ascending plot, use sine phase of 0, else its descending and use 180
			(bestInterval.rising) ? this.sinePhase = 0: this.sinePhase = 180;
			
			// truncate the buffer so we start just before the zero crossing
			this.mp3Data = this.mp3Data.slice(bestInterval.justB4CrossPt, bestInterval.justB4CrossPt + NUM_PTS_PLOT_LONG + 1);
		}
		
		getGraphArray(graphIndx) {
		// graphIndx 0 is the 10ms timespan upper plot, index 1 is 1 ms timespan lower plot, 
		// musical data only plotted on upper plot (loses meaning on lower plot)
			let graphArray = [];
			// count up time on the graph
			let tG = 0.0;
			// count up time for each point in the mp3 file
			let currIndxMp3 = 0;
			let numPtsPlot;
			let graphTs;
			if (graphIndx === 0) {
				// plotting for the 10 ms graph
				numPtsPlot = NUM_PTS_PLOT_LONG;
				graphTs = samplePeriodLong;
			} else {
				if (graphIndx === 1) { 
					// plotting for the 1 ms graph
					numPtsPlot = NUM_PTS_PLOT_SHORT;
					graphTs = samplePeriodShort;
				} else {
					// coding error
					console.error("unexpected value for graph index in getGraphArray, value was " + graphIndx);
				}
			}	
			// want to illustrate that sine wave at pitch freq is the periodicity of musical note waveform
			// To enhance visualization, phase up the buffer so that we "start" at zero crossing of steepest ascent/descent
			// we will then feed this "new" buffer into the sample rate converter for plotting
			this.findStartPhase();
			
			// using nearest neighbor approximation for arbitrary sample rate conversion of MP3 rate to graph rate
			for (let i = 0; i <= numPtsPlot; i++) {
				tG = graphTs * i;
				let tM = currIndxMp3 * this.samplePeriodMp3;
				let tMp1 = tM + this.samplePeriodMp3;
				if (graphIndx === 0) {
					// This if for top graph over longer time interval
					if ( (tG - tM) > (tMp1 - tG) ) {
						currIndxMp3 = currIndxMp3 + 1;
					}
					// mp3 scales so max value is 1, rescale so it will fit this graph
					graphArray[i] = this.mp3Data[currIndxMp3];
				} else {
					// not well tested, lower graph proved to be a distraction
					if (tG >= tMp1) {
						currIndxMp3 = currIndxMp3 + 1;
						tM = currIndxMp3 * this.samplePeriodMp3;
						tMp1 = tM + this.samplePeriodMp3;
					}
					let slope = (this.mp3Data[currIndxMp3 + 1] - this.mp3Data[currIndxMp3])/this.samplePeriodMp3;
					// mp3 scales so max value is 1, rescale so it will fit this graph
					graphArray[i] = this.mp3Data[currIndxMp3] + slope * (tG - tM) ;
				}
			}
			// compare expected with actual graph sample rate/ mp3 file sample rate
			let approxSampRatio = numPtsPlot/currIndxMp3;
			let actualSampRatio = this.samplePeriodMp3/graphTs;
			console.log("Calculated (Sample rate of Graph)/(sample Rate of Mp3) as " + approxSampRatio);
			console.log("We expected Fsg/Fsmp3 = " + actualSampRatio + " Difference is " + (approxSampRatio - actualSampRatio));
			return graphArray;
		}
	}
		
	//***********************************
	//  User instigated callback events
	//***********************************
	// Change label on freq slider and adjust the tone as appropriate
	$('#in-range-freq').on('input', function(){
		updateFreq();
	});
	
	// Change label on amplitude slider and adjust the tone as appropriate
	$('#in-range-amp').on('input', function(){
		$currAmp = $("#in-range-amp")
		$("#currAmpLabel").text($currAmp.val());
		if (ToneIsOnNow==true) {
			let tonejs_dB = -40 + 20.0 * Math.log10($currAmp.val());
			osc.volume.value = tonejs_dB;
			// if tone isn't on, don't have to change anything...
		}
	});
	
	// Change label on phase slider and adjust the tone as appropriate
	$('#in-range-phase').on('input', function(){		
		updatePhase();
	});
	
	// handle user clicking on/off the tone on/off button
	$('#start-stop-button').on('click', function(){
		if (typeof ToneIsOnNow == "undefined")  {
			// First time in, 
			ToneIsOnNow = false;
		};
		// convert amplitude to what tone.js calls decibels.  In tone.js, -40 dB is very quiet
		// and 0 dB is plenty loud enough.  I know this isn't the music industry definition (decibel SPL where 0 dB
		// is the quietest sound one can hear and 100 dB will cause hearing damage) so I will say Amplitude = 1
		// is min audible and amplitude 40 dB higher (40 = 20log(A1/A0) or A1=100 if A0 = 1) is max we want to put out
		let tonejs_dB = -40 + 20.0 * Math.log10($currAmp.val());
		if (ToneIsOnNow==false) {
			// currently false, clicked by user and about to be true 
			osc = new Tone.Oscillator({
					frequency: $currFreq.val(), 
					volume: tonejs_dB,
					phase: $currPhase.val(),
					type:"sine"});
			osc.toDestination().start();	
			$("#start-stop-button").prop("value", "Stop Tone");
			ToneIsOnNow = true;
		} else {
			osc.toDestination().stop();
			$("#start-stop-button").prop("value", "Start Tone");
			ToneIsOnNow = false;
		}
	});
	
	//whenever any of the tone params change, redraw both graphs and update
	$("#toneChanges").on('input',drawTone);
	
	// Handle user selecting the musical note drop down menu
	$('#InstrumentDropDownMenu .dropdown-menu li a').on('click', function(event){
		let selectItem = $('#InstrumentDropDownMenu .dropdown-menu li a').index($(this));
		currTuneState = selectItem;
		$("#LongTextBox_TT").text(tuneToDo[currTuneState]);
		$("#ToDo_or_expln_TT").prop("value", "Explain");
		$("#musicalActivity").html(tuneTitle[currTuneState]);
		if (currTuneState === DEFAULT_TONE) {
			// no instruments to play, its tone only.  No need for a play tone button
			$("#allowNotePlay").hide();
			// update graphs, to eliminate musical note if present
			drawTone()
		} else {	
			let context;
			// Safari has implemented AudioContext as webkitAudioContext so need next LOC
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			context = new AudioContext();			

			if (tuneBuffer == null || tuneBuffer[currTuneState] == null) {
				// get musical note for first time, filename in config must be mp3
				// I don't think we need a csrf token for this ajax post.  1.  there is already a session ID required for this
				// request 2.  Nothing is stored to database, request must be a filename we have or else get error back
				// DO:  look into putting a loading spinner icon to show progress in bringing over file (see bootstrap lib)
			    $.ajax({url:  '../give_file/',
			    		type: 'GET',
			    	  	data:  {instrument: tuneInstrument[currTuneState]},
			    	  	// if all is ok, return a blob, which we will convert to arrayBuffer, else return text cuz its an error
			    	  	xhr: function () {
                			let xhr = new XMLHttpRequest();
                			xhr.onreadystatechange = function () {
                        		if (xhr.readyState == 2) {
                        			// send() was called and headers and status are returned
                            		if (xhr.status == 200) {
                                		xhr.responseType = "blob";
                            		} else {
                                		xhr.responseType = "text";
                            		}
                        		}
                			};
                			return xhr;
            			},
					})
					.done(function(data, statusText, jqXHR) {
							// DO, rewrite this with promise syntax  https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
							// first time through, the decodeAudioData takes some time and its asynchronous so force a wait
							// to play the tone.  First time must be inside the success function off decodeAudioData
							// By definition, to get here means request is done and successful, (status = 4 and 200)
							let blobTune = new Blob([data], { 'type': 'audio/mpeg' });  // this must match what we send over
							console.log('file size is ' + blobTune.size + ' type is ' + blobTune.type);
							blobTune.arrayBuffer().then(blob2array => 
								{ // done converting blob to arrayBuffer, promise complete, convert blob2array to buffer
								context.decodeAudioData(blob2array, function(buffer) {
									// to get here means asynchronous mp3 decode is complete and successful
									console.log("finished decoding mp3");
									// copy AudioBuffer into array for this instrument/note so don't have to bug the server with requests
									try {
										console.log(" buffer length is " + buffer.length + " buffer sample rate is " + buffer.sampleRate + " currTuneState = " + currTuneState);
										tuneBuffer[currTuneState] = context.createBuffer(1, buffer.length , buffer.sampleRate);
										buffer.copyFromChannel(tuneBuffer[currTuneState].getChannelData(0), 0);
										// setup the class from which we will get points to graph the note
										noteFilePoint[currTuneState] = new InstrumentNote(buffer, currTuneState, tuneFundamentalFreq[currTuneState]);
									} catch(e) {
										// most likely not enough space to createBuffer
										console.error(e);
										alert("Failed note file setup, error is " + e);
									}
																
									// get array of values for both plots. Actually no need for short plot for low freq waveforms
									tuneGraphLong[currTuneState] = noteFilePoint[currTuneState].getGraphArray(0);
									
									// set up tone to approximate the fundamental freq of musical instrument
									let newToneFreq = tuneFundamentalFreq[currTuneState];
									$("#currFreqLabel").text(newToneFreq);   // and put it on the label as string
									$("#in-range-freq").val(newToneFreq);
									updateFreq();
									
									// we set up signal so it looks best at zero phase
									$("#currPhaseLabel").text(noteFilePoint[currTuneState].sinePhase.toString());
									$("#in-range-phase").val(noteFilePoint[currTuneState].sinePhase);
									updatePhase();
							
									// update graphs
									drawTone()
									// we have new instrument mp3, allow play
									$("#allowNotePlay").show(); 
									
									// decodeAudioData is async and doesn't support promises, can't use try/catch for errors
									},function(err) { alert("err(decodeAudioData) on file for: " + tuneInstrument[currTuneState] + " error =" + err); } )
								}, reason => {
									console.error("conversion of blob to arraybuffer failed");
								}
		
							);

						})  // done with success function
						.fail(function(jqXHR, exception) {
								if (jqXHR.status == 403) {
									alert("Need to pass bot test to access server file.  No file for YOU!");  
								} else if (jqXHR.status == 404) {
									alert("File not found.  See Administrator");
								} else {
									alert("ERROR:  return status is " + jqXHR.status );
									console.error(jqXHR)
								}
							}
				);   // done with ajax
	
        	} else {
				// we have new instrument mp3, allow play
				$("#allowNotePlay").show(); 
				// set up tone to approximate the fundamental freq of musical instrument
				let newToneFreq = tuneFundamentalFreq[currTuneState];
				$("#currFreqLabel").text(newToneFreq);   // and put it on the label as string
				$("#in-range-freq").val(newToneFreq);
				updateFreq();
				
				// we set up musical note for zero phase as we line it up with associated pitch sine
				$("#currPhaseLabel").text("0");
				$("#in-range-phase").val(0);
				updatePhase();
				
				// update graphs with stored musical tone data (we've done this before)
				drawTone();
			}
		};
    });		

	// must do these at a global level since we allow an abort of tone playing, must keep around the original
	// source reference
	let sourceNote;
	let context;
	
	//****************************************************************	
	// if user selects a musical note, and then clicks "play note" need to play it
	//****************************************************************
	$('#allowNotePlay').on('click', function(event){
		if (typeof noteIsOnNow == "undefined")  {
			// First time in, 
			noteIsOnNow = false;
		};			
		console.log("Just before we USE it, newly created buffer len = " + tuneBuffer[currTuneState].length);
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
				// Safari has implemented AudioContext as webkitAudioContext so need next LOC
				window.AudioContext = window.AudioContext || window.webkitAudioContext;
				context = new AudioContext();	
				sourceNote = context.createBufferSource();
				// about to turn on the note
				console.log("reuse the stored value");
				sourceNote.buffer = tuneBuffer[currTuneState];
				sourceNote.connect(context.destination);
				// auto play
				sourceNote.start(0); 
				noteIsOnNow = true;
				$("#allowNotePlay").prop("value", "Stop Note");
			} else {
	        	// someone is tired of listening to our lovely tuning note
	        	sourceNote.stop(0); 
				noteIsOnNow = false;
				$("#allowNotePlay").prop("value", "Play Note");
			}
			sourceNote.onended = () => {
				// no longer playing the note, either by user stop or natural completion
				noteIsOnNow = false;
				$("#allowNotePlay").prop("value", "Play Note");
			}
        }
    });	

	//*****
	// User can choose a TO DO set for the text box or an explanation, this code is the implementation
	//*****
	$('#ToDo_or_expln_TT').on('click', function(event){
		if ("Explain" == $("#ToDo_or_expln_TT").prop("value")) {
			// currently showing the Try This text.  Move into explanation text
			$("#LongTextBox_TT").text(tuneExpln[currTuneState]);
			$("#ToDo_or_expln_TT").prop("value", "Try This");
		} else {
			// currently showing the explanation text.  Move into Try This text
			$("#LongTextBox_TT").text(tuneToDo[currTuneState]);
			$("#ToDo_or_expln_TT").prop("value", "Explain");
		}
    });	
		
	//***********************************
	//  Immediate execution here
	//***********************************

	let ctxLong, ctxShort, ctxExpandTime;
    if ( $("#sine_plotsLong").length ) {
    	ctxLong = $("#sine_plotsLong").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain sin_plotsLo context');
	};
    if ( $("#sine_plotsShort").length ) {
    	ctxShort = $("#sine_plotsShort").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain sin_plotsHi context');
	};
	// draw explanatory lines between the charts
	//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
	if ( $("#timeExpand").length ) {
    	ctxExpandTime = $("#timeExpand").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain timeExpand context');
	};	

			
	//if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	const CHART_OPTIONS = {
		maintainAspectRatio: false,  //uses the size it is given
		responsive: true,
	    legend: {
	        display: false // gets rid of dataset label/legend
	     },
		elements:{
			point:{
				radius: 1     // to get rid of individual points
			}
		},
		scales: {
	
			xAxes: [{
				scaleLabel: {
					display: true,
					labelString: 't (milliseconds)'
				},
	
			}],
			yAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'y amplitude'
				}
			}]
		}
	};
	Object.freeze(CHART_OPTIONS);
	let currTitle = {display: true, text: 'y = ' + $currAmp.val() + ' * sin{ 2 * pi * (' + $currFreq.val() + ' * t + ' + $currPhase.val() + '/360) }'};
	
	const TOP_CHART = {...CHART_OPTIONS, title: currTitle };
	let sine_plot_100_1k = new Chart(ctxLong, {
	    type: 'line',
	    data: {
	    	labels: timeMsLong,
	        datasets: [{
	            label: 'Tone Graph',
	            data: ampLong,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',
	            },
	            {
	            label: 'Musical Tone',
	            data: ampLongCurrNote,
	            fill: false,
	            borderColor: 'rgb(255,165,0)',
	            }]
	    },
	    options: TOP_CHART
	});
	Object.freeze(TOP_CHART);
	// if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	let sine_plot_1k_10k = new Chart(ctxShort, {
	    type: 'line',
	    data: {
	    	labels: timeMsShort,
	    	//borderColor: 'rgb(255, 165, 0)', this is orange
	        datasets: [{
	            label: 'Tone Graph',
	            data: ampShort,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',
	            }]
	    },
	    options: CHART_OPTIONS
	});
	
	//--------------------------------------------------------------------------------------------------------------------
	// CONSTANTS FOR DRAWING LINES BETWEEN GRAPHS
	const ZERO = 20;  // about where the zero axis ends up on the canvas
	const ONE_MS = 48;
	const CNV_W = ctxExpandTime.canvas.scrollWidth; 
	const CNV_H = ctxExpandTime.canvas.scrollHeight; 
	// I have no idea why I need this crazy fudge factor on  width of canvas, but it works
	// I think javascript and css treat sizes differently
	const END = CNV_W /2.69;
	const ARW = 5;   // what seems to be good for number of pixels for arrow
	ctxExpandTime.lineWidth = 1;
	
	// draw a line from 0 ms to 0 ms
	ctxExpandTime.beginPath();
	ctxExpandTime.moveTo(ZERO, 0);
	ctxExpandTime.lineTo(ZERO, CNV_H);
	// left arrow
	ctxExpandTime.moveTo(ZERO - ARW, CNV_H - ARW);
	ctxExpandTime.lineTo(ZERO, CNV_H);
	// right arrow
	ctxExpandTime.moveTo(ZERO + ARW, CNV_H - ARW);
	ctxExpandTime.lineTo(ZERO, CNV_H);
	
	
	// draw line from 1 ms to 1 ms
	ctxExpandTime.moveTo(ONE_MS, 0);
	ctxExpandTime.lineTo(END, CNV_H - ARW);
	// bottom arrow
	ctxExpandTime.moveTo(END - ARW, CNV_H);
	ctxExpandTime.lineTo(END, CNV_H - ARW)
	//top arrow
	ctxExpandTime.moveTo(END - ARW, CNV_H - 3*ARW)
	ctxExpandTime.lineTo(END, CNV_H - ARW)
	ctxExpandTime.stroke();
	ctxExpandTime.closePath();
	
	ctxExpandTime.font = "20px Arial";
	ctxExpandTime.fillText("1ms", 40, CNV_H/2.5);
	ctxExpandTime.fillText("expanded", 40, CNV_H/2.5 + 20);
	//--------------------------------------------------------------------------------------------------------------------
	
	//***********************************
	//initialize default values for tone
	//***********************************
	fillInArrays();
	drawTone();
	$("#currFreqLabel").text($("#in-range-freq").val());
	$("#currAmpLabel").text($("#in-range-amp").val());
	$("#currPhaseLabel").text($("#in-range-phase").val());

	//***********************************
	//initialize data fields for tone and musical notes
	//***********************************	
	$.getJSON(urlInitValJson)
		.done(function(data,status,xhr) {
			//xhr has good stuff like status, responseJSON, statusText, progress
			if (status === 'success') {				
				$.each(data.TestNote, function(index, paramSet) {
					tuneState[index] = (paramSet.instrument).replace(" ","_") + "_" + paramSet.musicalNote;
					tuneExpln[index] = paramSet.expln;		
					tuneToDo[index]= paramSet.todo;			
					tuneInstrument[index] = paramSet.instrument;
					tuneTitle[index] = paramSet.title;
					tuneOffset[index] = parseInt(paramSet.tuneOffset);
					tuneFundamentalFreq[index] = parseInt(paramSet.fundamentalHz);
				});
				$("#LongTextBox_TT").text(tuneToDo[currTuneState]);
				$("#ToDo_or_expln_TT").prop("value", "Explain");
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
	// happen once per session
	if (!sessionStorage.adModal) {
		setTimeout(function() {
			$('#admodal').find('.item').first().addClass('active');
		    $('#admodal').modal({
		    	backdrop: 'static',
	    		keyboard: false
		    });
		}, 1000);
	    sessionStorage.adModal = 1;
    }

})
