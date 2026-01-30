'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	//if Next  button hit (in base template), set it up to go to intro page
	$("#GoToNextPage").wrap('<a href="../MusicNotesTrig"></a>');
	$("#GoToPreviousPage").wrap('<a href="../DynamicTrig2"></a>');
	
	// user can only pick expert/newbie mode on the first home page
	let newbieMode = sessionStorage.getItem('UserIsNew');
	if (newbieMode && (newbieMode.toLowerCase() === "true")) {
		// emphasize the auto demo as first place
		$("#startAutoDemo").addClass('newbieMode');
	} else {
		// user somehow got here without going through landing page or deleted sessionStorage, put in newbie mode
		$("#startAutoDemo").addClass('newbieMode');
	}

	let ctxLong, ctxShort, ctxExpandTime;
	//***********************************
	//  Immediate execution here
	//***********************************

	// With the graphs drawn, prepare to draw explanatory lines between the charts
	//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
	if ( $("#timeExpand").length ) {
    	ctxExpandTime = $("#timeExpand").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain timeExpand context');
	};
	// prepare to draw the 10ms plot at top
    if ( $("#sine_plotsLong").length ) {
    	ctxLong = $("#sine_plotsLong").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain sin_plotsLo context');
	};
	// prepare to draw the 1ms plot below the top 10 ms plot
    if ( $("#sine_plotsShort").length ) {
    	ctxShort = $("#sine_plotsShort").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain sin_plotsHi context');
	};
	
	// implement the Tone sounding and chart tools
	let $currFreq = $("#in-range-freq");
	let $currAmp = $("#in-range-amp");
	let $currPhase = $("#in-range-phase")
	
	let ToneIsOnNow = false;  // for synthesized tone, both musical note and tone can play additively.
	let osc = new Tone.Oscillator(); 
	
	// used for plotting
	let timeMsLong = [];
	let ampLong = [];
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
			timeMsLong[i] = roundFP(i * samplePeriodLong * 1000, 3);		
		}
		for (i=0; i<=NUM_PTS_PLOT_SHORT; i++) {
			ampShort[i] = $currAmp.val() * Math.sin(2 * Math.PI * ($currFreq.val() * i * samplePeriodShort + $currPhase.val() / 360.0) );
			// need higher precision here on time than with the longer plot
			timeMsShort[i] = roundFP(i * samplePeriodShort * 1000, 4);				
		}	
	};
	
	function drawTone()
	{	    
	    // update title to match new parameters
	    // http://www.javascripter.net/faq/greekletters.htm added pi in as greek letter
	    let currTitleText = 'Pitch tone y = ' + $currAmp.val() + ' ' + MULT_DOT + ' sin{ 2 ' + MULT_DOT + ' ' + PI + ' ' +  MULT_DOT +  ' (' + $currFreq.val() + ' ' + MULT_DOT + ' t + ' + $currPhase.val() + '/360) }';
		sine_plot_100_1k.options.plugins.title.text = currTitleText;
		// now fill the arrays and they will automatically be reread into plots
		fillInArrays();   

	    // make all these changes happen
	    sine_plot_100_1k.update();	                    
	    sine_plot_1k_10k.update();  
	};
	
	function updateFreq() {
		//min and max freq chosen depends on audio speakers used, my speakers can just barely respond at 100 Hz
		//max freq depends on value set by user in #freqMax
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
		if (ToneIsOnNow==true) {
			osc.phase = $currPhase.val();
			// if tone isn't on, don't have to change anything...
		}	
	}
	//--------------------------------------------------------------------------------------------------------------------
	function DrawExpansionLinesBtwnGraphs() {
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
		ctxExpandTime.strokeStyle = "black";	
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

		ctxExpandTime.fillStyle = "black";
		ctxExpandTime.font = "20px Arial";
		ctxExpandTime.fillText("1ms", 40, CNV_H/2.5);
		ctxExpandTime.fillText("expanded", 40, CNV_H/2.5 + 20);
		ctxExpandTime.stroke();
		ctxExpandTime.closePath();
	}
	//--------------------------------------------------------------------------------------------------------------------
		
	//***********************************
	//  User instigated callback events
	//***********************************
	// When user changes max freq allowed, update all
	$('#freqMax').on('change', function(){
		let $maxFreq = $("#freqMax");
		//clamp max/min value for user entry
		if ($maxFreq.val() < 1000) {
			$maxFreq.prop('value', 1000);
		} else if ($maxFreq.val() > 10000) {
			$maxFreq.prop('value', 10000);
		}
		let $maxFreqForSlider = ($maxFreq.val());
		let $currToneFreq = $("#in-range-freq");
		// setting the max will cap out current freq,if it exceeds max down to new max
		$currToneFreq.attr("max", $maxFreqForSlider);
		updateFreq();
	});

	// Change label on freq slider and adjust the tone as appropriate
	$('#in-range-freq').on('change', function(){
		updateFreq();
	});
	
	// Change label on amplitude slider and adjust the tone as appropriate
	$('#in-range-amp').on('change', function(){
		$currAmp = $("#in-range-amp");
		$("#currAmpLabel").text($currAmp.val());
		if (ToneIsOnNow==true) {
			let tonejs_dB = -40 + 20.0 * Math.log10($currAmp.val());
			osc.volume.value = tonejs_dB;
			// if tone isn't on, don't have to change anything...
		}
	});
	
	// Change label on phase slider and adjust the tone as appropriate
	$('#in-range-phase').on('change', function(){		
		updatePhase();
	});
	
	$('#toneStartButton').css('background-color', GO_COLOR);  // initial value
	// handle user clicking on/off the tone on/off button
	$('#toneStartButton').on('click', function(){
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
			$("#toneStartButton").attr("src", VOL_ON_ICON);
			$("#toneStartButton").attr("alt", VOL_ON_ALT);
			$("#toneStartButton").attr("data-original-title", 'click to turn off your sine wave');
			$('#toneStartButton').css('background-color', STOP_COLOR);
			ToneIsOnNow = true;
		} else {
			osc.toDestination().stop();
			$("#toneStartButton").attr("src", VOL_OFF_ICON);
			$("#toneStartButton").attr("alt", VOL_OFF_ALT);
			$("#toneStartButton").attr("data-original-title", 'turn on speaker and click to hear sine wave you created');
			$('#toneStartButton').css('background-color', GO_COLOR);
			ToneIsOnNow = false;
		}
	});
	
	//whenever any of the tone params change, redraw both graphs and update
	$("#toneChanges").on('change',drawTone);
	
	const CHART_OPTIONS = {
		responsive: true,
		maintainAspectRatio: false,
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
			},
			y: {
				type: 'linear', 
				title: {
					display: true,
					text: 'y amplitude'
				}
			}
		}
	};
	
	// careful!  if you are looking at chartjs documentation, current version is 4.3.0 and this was an old version 2.9.4
    //7/12/2023 upgrade to 4.3.0 https://www.chartjs.org/docs/latest/
    const TOP_LABEL = {plugins: { 
			title: {
				display: true,  
				font: {size: 20}, 
				text: 'Pitch tone y = ' + $currAmp.val() + ' * sin{ 2 * pi * (' + $currFreq.val() + ' * t + ' + $currPhase.val() + '/360) }'
				},
			legend: {
	        	display: false 
			}
		}};
	const TOP_CHART = {...CHART_OPTIONS, ...TOP_LABEL};
	let sine_plot_100_1k = new Chart(ctxLong, {
	    type: 'line',
	    data: {
	    	labels: timeMsLong,
	        datasets: [{
	            label: 'Pitch tone (sine wave)',
	            data: ampLong,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',  //aqua
	            },
	            ]
	    },
	    options: TOP_CHART
	});
    const BOTTOM_LABEL = {plugins: { 
			legend: {
	        	display: false 
			}
		}};
	const BOTTOM_CHART = {...CHART_OPTIONS, ...BOTTOM_LABEL};
	// if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	let sine_plot_1k_10k = new Chart(ctxShort, {
	    type: 'line',
	    data: {
	    	labels: timeMsShort,
	        datasets: [{
	            data: ampShort,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',  //aqua
	            }]
	    },
	    options: BOTTOM_CHART
	});
		
	//***********************************
	//initialize values for tone as page first comes up
	//***********************************
	function initializePage(){
		//reset all values to default wake up values
		const DEFAULT_MAX_FREQ=2000; //
		$("#freqMax").prop("value", DEFAULT_MAX_FREQ);
		$("#in-range-freq").attr("max", DEFAULT_MAX_FREQ);
		const DEFAULT_FREQ = 1000; // as set in html for element
		$("#in-range-freq").prop("value", DEFAULT_FREQ);
		const DEFAULT_AMP = 10;
		$("#in-range-amp").prop("value", DEFAULT_AMP);
		const DEFAULT_PHASE = 0;
		$("#in-range-phase").prop("value", DEFAULT_PHASE);
		$("#currFreqLabel").text($("#in-range-freq").val());
		$("#currAmpLabel").text($("#in-range-amp").val());
		$("#currPhaseLabel").text($("#in-range-phase").val());
		$currFreq = $("#in-range-freq");
		$currAmp = $("#in-range-amp");
		$currPhase = $("#in-range-phase")
	
		//turn off tone initially
		ToneIsOnNow = false;
		osc.toDestination().stop();
		$("#toneStartButton").attr("src", VOL_OFF_ICON);
		$("#toneStartButton").attr("alt", VOL_OFF_ALT);
		$("#toneStartButton").attr("data-original-title", 'turn on speaker and click to hear sine wave you created');
		$('#toneStartButton').css('background-color', GO_COLOR);
		// on power up, draw the expansion lines between graphs
		DrawExpansionLinesBtwnGraphs();
		// draw current selected freq
		fillInArrays();
		drawTone();
		
	}
    // do on power up and as needed
    initializePage();
    
    //****************************************************************************
    // Autodemo script for tone trig
    //**************************************************************************** 
	const SCRIPT_AUTO_DEMO = [
	{ segmentName: "Sine Sounds Great",
	  headStartForAudioMillisec: 34000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'ToneTrigSeg0'}
			},
			//*****************************
			// click on freq slider to change freq to 100 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "100",
			 	 offset: {x: 23, y: 10},  // in the 100Hz location
			 	 waitTimeMillisec: 3000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-freq',
			 	 action: "nothing",
			 	 waitTimeMillisec: 1000} 
			},
			//*****************************
			// click on start tone  button to play tone
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 25, y: 20},
			 	 waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "nothing",
			 	 waitTimeMillisec: 3000} 
			},
			//*****************************
			// increase the volume
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "80",
			 	 offset: {x: -68, y: 10},  // turn volume up high
			 	 waitTimeMillisec: 5000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-amp',
			 	 action: "nothing",
			 	 waitTimeMillisec: 13000} 
			},
			//*****************************
			// turn down volume
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "5",
			 	 offset: {x: 16, y: 10},  // turn volume way down
			 	 waitTimeMillisec: 2000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-amp',
			 	 action: "nothing",
			 	 waitTimeMillisec: 9000} 
			},			
			//*****************************
			// click on freq slider to change freq to 233 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "233",
			 	 offset: {x: 16, y: 10},  // in the 233Hz location
			 	 waitTimeMillisec: 10000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-freq',
			 	 action: "nothing",
			 	 waitTimeMillisec: 13000} 
			},		
			//*****************************
			// click on freq slider to change freq to 2 khz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "2000",
			 	 offset: {x: -92, y: 10},  // in the 2kHz location, max position
			 	 waitTimeMillisec: 20000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-freq',
			 	 action: "nothing",
			 	 waitTimeMillisec: 23000} 
			},		
			//*****************************
			// click on freq slider to change freq to 8 khz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'freqMax',
			 	 value: "10000",
			 	 offset: {x: -12, y: 10},
			 	 waitTimeMillisec: 2000}  // this is wait before you go on to next item
			 },		
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#freqMax',
			 	 action: "nothing",
			 	 waitTimeMillisec: 1000} 
			},		
			// now change freq slider	
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "8000",
			 	 offset: {x: -57, y: 10},  // in the 8kHz location
			 	 waitTimeMillisec: 7000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-freq',
			 	 action: "nothing",
			 	 waitTimeMillisec: 3000} 
			},		
			//*****************************
			// click on start tone  button to stop tones
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 25, y: 20},
			 	 waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#toneStartButton',
			 	 action: "nothing",
			   	 waitTimeMillisec: 19000} 
			},	
			//*************************************** */	
			// go back to default values since high freq annoying
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'freqMax',
			 	 value: "2000",
			 	 offset: {x: 10, y: 10},
			 	 waitTimeMillisec: 2000}  // this is wait before you go on to next item
			 },	
			 {segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#freqMax',
			 	 action: "nothing",
			 	 waitTimeMillisec: 1000} 
			},
			 {segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "1000",
			 	 offset: {x: -32, y: 10},  // in the 1kHz, midrange
			 	 waitTimeMillisec: 2000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-freq',
			 	 action: "nothing",
			 	 waitTimeMillisec: 2000} 
			},	

	  ]
	},
	{ segmentName: "Amplitude and Phase",
	  headStartForAudioMillisec: 24000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'ToneTrigSeg1'}
			},
			//*****************************
			// click on freq slider to change freq to 1000 hz, in case user moved it around
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "1000",
			 	  offset: {x: -20, y: 10},  // in the 1000Hz location
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			 },	
			 // remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-freq',
			 	 action: "nothing",
			 	waitTimeMillisec: 1000} 
			},	
			//*****************************
			// click on amplitude slider to 5,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "5",
			 	  offset: {x: 30, y: 10},  // in the 5 location
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			 },	
			// remove cursor on amp slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 1000} 
			},
			//*****************************
			// click on start tone  button to play default tone
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
			 	waitTimeMillisec: 4000} 
			},
			//*****************************
			// increase the volume to 10
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "10",
			 	  offset: {x: 20, y: 10},  // turn volume up high
			 	waitTimeMillisec: 2000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 3000} 
			},
			//*****************************
			// increase volume to 20
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "20",
			 	  offset: {x: 12, y: 10},  // turn volume way down
			 	waitTimeMillisec: 2000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 3000} 
			},	
			//*****************************
			// decrease the volume to 5
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "5",
			 	  offset: {x: 25, y: 10},  // turn volume up high
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 18000} 
			},		
			//*****************************
			// click on phase slider to make it a cosine at 90 degrees,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-phase',
			 	 value: "90",
			 	  offset: {x: 5, y: 10},  // in the 90 location
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'#in-range-phase',
			 	 action: "nothing",
			 	waitTimeMillisec: 15000} 
			},					
			//*****************************
			// click on start tone  button to stop tones
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
			 	waitTimeMillisec: 3000} 
			},	
				

	  		]
		}
	];

    //****************************************************************************
    // User initiates autoDemo activity
    //****************************************************************************   
	//*** user clicks the start demo image, iniitalize everything
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO);  // give the demo the full script
    $('#startAutoDemo').on('click', function(event) {
  		// prep the control box for user to interact with auto demo
		demo.prepDemoControls();
  	  	//move header and tone/music controls to right when autodemo is active
    	demo.moveToRightForAutoDemo($('#musicalActivity'));
    	demo.moveToRightForAutoDemo($('#toneChanges'));	
    });
   
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************

	// User has selected play
    $('#playSegment').on('click', function(){	
		//So Safari requires that a user touch (cant do CustomEvent) instigates a WebAudio event
		// here we "cheat" and let user play button touch do a quick audio action to satisfy Safari before Autodemo
		// which will play tones or music
		osc.toDestination().start();
		osc.frequency.value = 80;  // below what most speakers will play
		osc.toDestination().stop();
		// end Safari hack	
		
    	// in case plots have other stuff on them from other activities, clean it up
    	initializePage();
    	demo.startDemo();
    });
    
    $('#stopSegment').on('click', function(){	
    	demo.stopThisSegment(false);  //we don't want to destroy controls box
    	// turn off sound and put page back the way it was
    	initializePage();
    });
    
    $('#dismissAutoDemo').on('click', function(){	
    	// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen
    	demo.stopThisSegment();  // may or may not be needed
  		// turn off sound and put page back the way it was
    	initializePage();
  		//Autodemo over, move elements back where they were
  		demo.moveToLeftForAutoDemo($('#musicalActivity'));
    	demo.moveToLeftForAutoDemo($('#toneChanges'));	
    	
    });
    
    $("#segNum").change(function(){
		let currSeg = parseInt($('#segNum').val());
		demo.setCurrSeg(currSeg);
		
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
	});
	
	

})
