'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {

	// implement the Tone sounding and chart tools
	let $currFreq = $("#in-range-freq");
	let $currAmp = $("#in-range-amp");
	let $currPhase = $("#in-range-phase")
	
	let ToneIsOnNow = false;
	let osc = new Tone.Oscillator(); 
	
	//initialize variables needed to play the non synthesized tone musical notes
	const DEFAULT_TONE = 0;  // first item in drop down is always plain synthesized tone
	let tuneState = [];
	let currTuneState = DEFAULT_TONE;  // pick the first element, which will be the synthesized tones
	let tuneExpln = [];
	let tuneFilename = [];
	let tuneTitle = [];
	let tuneBuffer = [];  // and AudioBuffer for currTuneState 1 through N, all musical notes
	
	
	//everything is relative to the html page this code operates on, server needs to work from /static directory (without django intervention)
	const STATIC_FILE_LOC = "../../static/json/";
	const urlInitValJson = STATIC_FILE_LOC + "MusicNotes.json";
	const MUSIC_FILE_LOC = "../../static/MusicNotes/";
	
	
	let timeMsLong = [];
	let ampLong = [];
	let timeMsShort = [];
	let ampShort = [];

	//const NUM_PTS_PLOT_SHORT = 100;
	const NUM_PTS_PLOT_SHORT = 200;
	const NUM_PTS_PLOT_LONG = 1000;
	//const NUM_PTS_PLOT_LONG = 1000;
	//const NUM_PTS_PLOT_LONG = 1323;
	const DURATION_LONG_PLOT_MS = 10;
	const DURATION_SHORT_PLOT_MS = 1;	
	let ampCurrNote = [];
	
	function fillInArrays(){
		//sample period in sec
		// yes, these are ridiculously high rates, didn't want to have ANY sampling artifacts in plots...
		let samplePeriodLong = DURATION_LONG_PLOT_MS/(1000 * NUM_PTS_PLOT_LONG);
		let samplePeriodShort = DURATION_SHORT_PLOT_MS/(1000 * NUM_PTS_PLOT_SHORT);
		var i;
		for (i=0; i<=NUM_PTS_PLOT_LONG; i++) {
			ampLong[i] = $currAmp.val() * Math.sin(2 * Math.PI * ($currFreq.val() * i * samplePeriodLong + $currPhase.val() / 360.0) );
			timeMsLong[i] = roundFP(i * samplePeriodLong * 1000, 2);
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
	    
		// now fill the arrays
		fillInArrays();

	    sine_plot_100_1k.data.datasets.forEach((dataset) => {
	    	console.log("At Update, size of ampLong is " + ampLong.length);
	        dataset.data.push(ampLong);
	    });	   
	    // update title to match new parameters
	    // http://www.javascripter.net/faq/greekletters.htm added pi in as greek letter
	    var currTitleText = 'y = ' + $currAmp.val() + ' * sin{ 2 * \u03C0 * (' + $currFreq.val() + ' * t + ' + $currPhase.val() + '/360) }';
	    sine_plot_100_1k.options.title.text = currTitleText;
	    // make all these changes happen
	    sine_plot_100_1k.update();
	    
	    sine_plot_1k_10k.data.datasets.forEach((dataset) => {
	    	console.log("At update, size of ampShort is " + ampShort.length);
	        dataset.data.push(ampShort);
	    });	                
	    sine_plot_1k_10k.update();  
	};
	
	//want to round but leave value as number, not string, so toFixed() is out. 
	//If x axis is a number, chart js will figure out grid lines/step size as needed
	function roundFP(number, prec) {
	    var tempnumber = number * Math.pow(10, prec);
	    tempnumber = Math.round(tempnumber);
	    return tempnumber / Math.pow(10, prec);
	};
	
	//***********************************
	//  User instigated callback events
	//***********************************
	// Change label on freq slider and adjust the tone as appropriate
	$('#in-range-freq').on('input', function(){
		//min and max freq chosen depends on audio speakers used, my speakers can just barely respond at 100 Hz
		$currFreq= $("#in-range-freq")   // get slider value
		$("#currFreqLabel").text($currFreq.val());   // and put it on the label as string
		if (ToneIsOnNow==true) {
			osc.frequency.value = $currFreq.val();
			// if tone isn't on, don't have to change anything...
		}
	});
	
	// Change label on amplitude slider and adjust the tone as appropriate
	$('#in-range-amp').on('input', function(){
		$currAmp = $("#in-range-amp")
		$("#currAmpLabel").text($currAmp.val());
		if (ToneIsOnNow==true) {
			var tonejs_dB = -40 + 20.0 * Math.log10($currAmp.val());
			osc.volume.value = tonejs_dB;
			// if tone isn't on, don't have to change anything...
		}
	});
	
	// Change label on phase slider and adjust the tone as appropriate
	$('#in-range-phase').on('input', function(){		
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
		var tonejs_dB = -40 + 20.0 * Math.log10($currAmp.val());
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
	
	$("#toneChanges").on('input',drawTone);
	
	// Handle user selecting the musical note drop down menu
	$('#InstrumentDropDownMenu .dropdown-menu li a').on('click', function(event){
		let selectItem = $('#InstrumentDropDownMenu .dropdown-menu li a').index($(this));
		currTuneState = selectItem;
		$("#classExpln").text(tuneExpln[currTuneState]);
		$("#musicalActivity").text(tuneTitle[currTuneState]);
		if (currTuneState === DEFAULT_TONE) {
			// no instruments to play, its tone only.  No need for a play tone button
			$("#allowNotePlay").hide();
		} else {
			// then there is music to play, allow user to choose when to play
			$("#allowNotePlay").show();
		};
    });		


	// if user selects a musical note, and then clicks "play note" need to play it
	$('#allowNotePlay').on('click', function(event){
		//NEED some check that the user is not a bot before we give a server file, and that file is valid name with . in middle
		// check that the filename has .mp3 in it, thats all we handle now.
		
		let source;
		let context;
		// Safari has implemented AudioContext as webkitAudioContext so need next LOC
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();	
		source = context.createBufferSource();		

		if (tuneBuffer == null || tuneBuffer[currTuneState] == null) {
			// get musical note for first time
			if (tuneFilename[currTuneState].toLowerCase().indexOf('.mp3') >=0) {
				console.log("get the file from server");
				let request;
				// would be nice to do this in jquery but it looks too painful, requiring ajaxTransport to get arraybuffer returns
			    request = new XMLHttpRequest();
			    request.open("GET",tuneFilename[currTuneState],true);
			    request.responseType = "arraybuffer";
				// DO:  look into putting a loading spinner icon to show progress in bringing over file (see bootstrap lib)
			    request.onload = function() {
			      // DO, rewrite this with promise syntax
			      // first time through, the decodeAudioData takes some time and its asynchronous so force a wait
			      // to play the tone.  First time must be inside the success function off decodeAudioData
			      context.decodeAudioData(request.response, function(buffer) {
			      	// to get here means asynchronous mp3 decode is complete and successful
			      	console.log("finished decoding mp3");
			        source.buffer = buffer;
			        // copy AudioBuffer into array for this instrument/note so don't have to bug the server with requests
			        // DO, try and throw on RangeError (not enough space) for copying buffer
			        tuneBuffer[currTuneState] = context.createBuffer(1, buffer.length , buffer.sampleRate)
			        buffer.copyFromChannel(tuneBuffer[currTuneState].getChannelData(0), 0);
			        let ptrToMP3data = buffer.getChannelData(0);
			        // we want NUM_PTS_PLOT_LONG but will be interpolating by
			        //for (var i = 0; i < NUM_PTS_44_1_LONG; i++) {
			        //	ampCurrNote[i] = $currAmp.val() * ptrToMP3data[i + 2000];
			        //	console.log("i = " + i + " tone val = " + ampCurrNote[i]);
			        //}
			        source.connect(context.destination);
			        // auto play
			        source.start(0); // start was previously noteOn
			        console.log("finished copying AudioBuffer for current musical note, state = " + currTuneState);
			      });
			    };
		      	request.send();
	      	} else {
	      		alert('Currently we only handle mp3 files, check MusicNotes.json for correct filename for this instrument'); 
	      	}
	     } else {
	     	console.log("reuse the stored value");
	     	source.buffer = tuneBuffer[currTuneState];
			source.connect(context.destination);
	        // auto play
	        source.start(0); 
        }
    });	
	
	//***********************************
	//  Immediate execution here
	//***********************************

	let ctxLong, ctxShort, ctxExpandTime;
    if ( $("#sine_plotsLong").length ) {
    	ctxLong = $("#sine_plotsLong").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain sin_plotsLo context');
	};
    if ( $("#sine_plotsShort").length ) {
    	ctxShort = $("#sine_plotsShort").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain sin_plotsHi context');
	};
	// draw explanatory lines between the charts
	//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
	if ( $("#timeExpand").length ) {
    	ctxExpandTime = $("#timeExpand").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain timeExpand context');
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
	            }]
	    },
	    options: TOP_CHART
	});
	
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
					tuneFilename[index] = MUSIC_FILE_LOC + paramSet.filename;
					tuneTitle[index] = paramSet.title;
				});
				$("#classExpln").text(tuneExpln[currTuneState]);
				$("#musicalActivity").text(tuneTitle[currTuneState]);
			}
			else {
				console.log("config json file request returned with status = " + status);
			}
		})
		.fail(function(data, status, error) {
			console.log("Error in JSON file " + status + error);
			alert("Error in JSON file " + status + error);
		})

})
