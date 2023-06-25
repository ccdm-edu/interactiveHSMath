'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	// turn on help in upper left corner
	$('#startAutoDemo').css('display', 'inline-block');
	
	//if Next  button hit (in base template), set it up to go to intro page
	$("#GoToNextPage").wrap('<a href="../MusicNotesTrig"></a>');
	
	// user can only pick expert/newbie mode on the first home page
	let newbieMode = sessionStorage.getItem('UserIsNew');
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
	let $currFreq = $("#in-range-freq");
	let $currAmp = $("#in-range-amp");
	let $currPhase = $("#in-range-phase")
	
	let ToneIsOnNow = false;  // for synthesized tone, both musical note and tone can play additively.
	let osc = new Tone.Oscillator(); 
	
	// used for plotting
	let timeMsLong = [];
	let ampLong = [];
	let ampLongCurrNote = [];  // what is plotted
	let timeMsShort = [];
	let ampShort = [];
	
	const GO_COLOR = "LightGreen";
	const STOP_COLOR = "LightPink";

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
	    let currTitleText = 'Pitch tone y = ' + $currAmp.val() + ' * sin{ 2 * \u03C0 * (' + $currFreq.val() + ' * t + ' + $currPhase.val() + '/360) }';
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
	
	function updatePlotsUserAides() {
		// we set up musical note for zero phase as we line it up with associated pitch sine
		$("#currPhaseLabel").text("0");
		$("#in-range-phase").val(0);
		updatePhase();
		
		// we set up signal so it looks best at zero phase
		$("#currPhaseLabel").text('0');
		$("#in-range-phase").val(0);
		updatePhase();  

		// update graphs
		drawTone()
		// we have new instrument mp3, allow play
		$("#allowNotePlay").css("visibility", "visible"); 
		
		// get rid of all old periodicity stuff, that overlays graphs, selectively turn on as needed later on	
		$('.First_Period').css("visibility", "hidden");			
		$('.Second_Period').css("visibility", "hidden");
		$('.Third_Period').css("visibility", "hidden");
		$('.Fourth_Period').css("visibility", "hidden");

	}
		
	//***********************************
	//  User instigated callback events
	//***********************************
	// Change label on freq slider and adjust the tone as appropriate
	$('#in-range-freq').on('change', function(){
		updateFreq();
	});
	
	// Change label on amplitude slider and adjust the tone as appropriate
	$('#in-range-amp').on('change', function(){
		$currAmp = $("#in-range-amp")
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
			$("#toneStartButton").prop("value", "Stop Tone");
			$('#toneStartButton').css('background-color', STOP_COLOR);
			ToneIsOnNow = true;
		} else {
			osc.toDestination().stop();
			$("#toneStartButton").prop("value", "Start Tone");
			$('#toneStartButton').css('background-color', GO_COLOR);
			ToneIsOnNow = false;
		}
	});
	
	//whenever any of the tone params change, redraw both graphs and update
	$("#toneChanges").on('change',drawTone);
	
	// update advanced topics modal tab text
	let todo_tab_element = "#AdvancedTopics > .modal-dialog > .modal-content > .modal-body > #tab011 > p";
	let expln_tab_element = "#AdvancedTopics > .modal-dialog > .modal-content > .modal-body > #tab021 > p";
	
	function doToneOnly() {
		// no instruments to play, its tone only.  No need for a play tone button
		$("#allowNotePlay").css("visibility", "hidden");
		
		// get rid of any musical note legends
		sine_plot_100_1k.data.datasets[1].label = "";
		sine_plot_100_1k.data.datasets[1].borderColor = 'rgb(255,255,255)'; // white for legend (invisible)
		
		// clean up any Periodicity arrows/text if left over from musical notes and redraw expansion lines
		ctxExpandTime.putImageData(backgroundPlot, 0, 0);
		// get rid of all old periodicity stuff, in case its present
		$('.First_Period').css("visibility", "hidden");			
		$('.Second_Period').css("visibility", "hidden");
		$('.Third_Period').css("visibility", "hidden");
		$('.Fourth_Period').css("visibility", "hidden");
		$("#Period_Text1").css("visibility", "hidden");			
		$('#Period_Text2').css("visibility", "hidden");
		// on power up, draw the expansion lines between graphs
		DrawExpansionLinesBtwnGraphs();
		
		// update graphs, to eliminate musical note if present
		drawTone()
	};
	

	// must do these at a global level since we allow an abort of tone playing, must keep around the original
	// source reference
	let sourceNote;
	let context;
	
		
	//***********************************
	//  Immediate execution here
	//***********************************

	let ctxLong, ctxShort, ctxExpandTime;
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
			
	//if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	const CHART_OPTIONS = {
		maintainAspectRatio: false,  //uses the size it is given
		responsive: true,
	    legend: {
	        display: true // gets rid of dataset label/legend
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
		},
	};
	Object.freeze(CHART_OPTIONS);  // to make it truly const
	let currTitle = {display: true, text: 'Pitch tone y = ' + $currAmp.val() + ' * sin{ 2 * pi * (' + $currFreq.val() + ' * t + ' + $currPhase.val() + '/360) }'};
	
	const TOP_CHART = {...CHART_OPTIONS, title: currTitle };
	let sine_plot_100_1k = new Chart(ctxLong, {
	    type: 'line',
	    data: {
	    	labels: timeMsLong,
	        datasets: [{
	            label: 'Pitch tone (sine wave)',
	            data: ampLong,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',
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
	Object.freeze(TOP_CHART);  //to make it truly const
	// if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	let sine_plot_1k_10k = new Chart(ctxShort, {
	    type: 'line',
	    data: {
	    	labels: timeMsShort,
	    	//borderColor: 'rgb(255, 165, 0)', this is orange
	        datasets: [{
	            label: 'Pitch Tone (sine wave)',
	            data: ampShort,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',
	            }]
	    },
	    options: CHART_OPTIONS
	});
	 
	// With the graphs drawn, prepare to draw explanatory lines between the charts
	//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
	if ( $("#timeExpand").length ) {
    	ctxExpandTime = $("#timeExpand").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain timeExpand context');
	};	
	
	// keep a snapshot of two plots before the expansion lines inbetween show up
	// When we move to musical instruments, the 1ms plot on bottom is irrelevant but want the space used
	// to indicate "1ms expansion" to show periodicity
    let backgroundPlot; 
    let expandTimeCanvas = $("#timeExpand").get(0);
	backgroundPlot = ctxExpandTime.getImageData(0, 0, expandTimeCanvas.width, expandTimeCanvas.height);
	
	// on power up, draw the expansion lines between graphs
	DrawExpansionLinesBtwnGraphs();
	
	//***********************************
	//initialize values for tone as page first comes up
	//***********************************
	fillInArrays();
	drawTone();
	$("#currFreqLabel").text($("#in-range-freq").val());
	$("#currAmpLabel").text($("#in-range-amp").val());
	$("#currPhaseLabel").text($("#in-range-phase").val());
  
    
    //****************************************************************************
    // Autodemo script for tone trig
    //**************************************************************************** 
	const SCRIPT_AUTO_DEMO = [
	{ segmentName: "Sine Sound",
	  headStartForAudioMillisec: 23000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: '../../static/static_binaries/AudioExpln/ToneTrig_Seg0.mp3'}
			},
			//*****************************
			// click on freq slider to change freq to 100 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "100",
			 	  offset: {x: 45, y: 10},  // in the 100Hz location
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-freq',
			 	 action: "nothing",
			 	waitTimeMillisec: 1000} 
			},
			//*****************************
			// click on start tone  button to play default tone
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'toneStartButton',
			 	 action: "nothing",
			 	waitTimeMillisec: 3000} 
			},
			//*****************************
			// increase the volume
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "80",
			 	  offset: {x: -40, y: 10},  // turn volume up high
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 10000} 
			},
			//*****************************
			// turn down volume
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "5",
			 	  offset: {x: 35, y: 10},  // turn volume way down
			 	waitTimeMillisec: 2000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 2000} 
			},			
			//*****************************
			// click on freq slider to change freq to 233 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "233",
			 	  offset: {x: 38, y: 10},  // in the 233Hz location
			 	waitTimeMillisec: 10000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-freq',
			 	 action: "nothing",
			 	waitTimeMillisec: 5000} 
			},		
			//*****************************
			// click on freq slider to change freq to 2 khz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "2000",
			 	  offset: {x: 18, y: 10},  // in the 2kHz location
			 	waitTimeMillisec: 23000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-freq',
			 	 action: "nothing",
			 	waitTimeMillisec: 6000} 
			},		
			//*****************************
			// click on freq slider to change freq to 8 khz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "8000",
			 	  offset: {x: -35, y: 10},  // in the 2kHz location
			 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-freq',
			 	 action: "nothing",
			 	waitTimeMillisec: 3000} 
			},		
			//*****************************
			// click on start tone  button to stop tones
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'toneStartButton',
			 	 action: "nothing",
			 	waitTimeMillisec: 3000} 
			},		

	  ]
	},
	{ segmentName: "Amplitude and Phase",
	  headStartForAudioMillisec: 11000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: '../../static/static_binaries/AudioExpln/ToneTrig_Seg1.mp3'}
			},
			//*****************************
			// click on freq slider to change freq to 1000 hz,  we last left off at 8kHz, need a less annoying freq 
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-freq',
			 	 value: "1000",
			 	  offset: {x: 23, y: 10},  // in the 1000Hz location
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			 },	
			//*****************************
			// click on amplitude slider to 5,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "5",
			 	  offset: {x: 45, y: 10},  // in the 5 location
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-freq',
			 	 action: "nothing",
			 	waitTimeMillisec: 6000} 
			},
			//*****************************
			// click on start tone  button to play default tone
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'toneStartButton',
			 	 action: "nothing",
			 	waitTimeMillisec: 3000} 
			},
			//*****************************
			// increase the volume to 10
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "10",
			 	  offset: {x: 30, y: 10},  // turn volume up high
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 3000} 
			},
			//*****************************
			// increase volume to 20
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "20",
			 	  offset: {x: 25, y: 10},  // turn volume way down
			 	waitTimeMillisec: 2000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 2000} 
			},	
			//*****************************
			// decrease the volume to 5
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-amp',
			 	 value: "5",
			 	  offset: {x: 35, y: 10},  // turn volume up high
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			 },		
			// remove cursor on slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-amp',
			 	 action: "nothing",
			 	waitTimeMillisec: 8000} 
			},		
			//*****************************
			// click on phase slider to make it a cosine at 90 degrees,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'in-range-phase',
			 	 value: "90",
			 	  offset: {x: 15, y: 10},  // in the 90 location
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'in-range-phase',
			 	 action: "nothing",
			 	waitTimeMillisec: 15000} 
			},					
			//*****************************
			// click on start tone  button to stop tones
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'toneStartButton',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'toneStartButton',
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
	const RIGHT_SHIFT_TONE_TRIG = 250;
    $('#startAutoDemo').on('click', function(event) {
        // flash a "click here" image to get them to hit play
    	$('#clickHereCursor').addClass('userHitPlay'); 
    	
		//first get rid of "lets do the demo" image and put up the demo controls
		$('#startAutoDemo').css('display', 'none');
		$('#autoDemoCtls').css('display', 'inline-block');
		$('#autoDemoCtls').css('visibility', 'visible');
		// fill in the controls properly
		//$('#segName').html('<b>' + SCRIPT_AUTO_DEMO[0].segmentName + '</b>');
		$('#totalSeg').text('/' + SCRIPT_AUTO_DEMO.length);
		$('#segNum').attr('max', SCRIPT_AUTO_DEMO.length);
		//$('#segNum').val('1');  // default start at begin
		demo.setCurrSeg(1);  // default start at begin
		$('#stopSegment').prop('disabled', true);  // when first start up, can only hit play
		
		// rearrange the page a bit so the demo controls fit better and user can see
		// more of the plots on the page, do this by modifying a CSS var
		let tt_cssVar = document.querySelector(':root');
		var cssVar = getComputedStyle(tt_cssVar);
		// get the current val of CSS var and remove the px from end
  		let currCtlsLeft = cssVar.getPropertyValue('--NO_AUTODEMO_LEFT_POS').slice(0,-2);
		let newCtlsLeft = parseInt(currCtlsLeft) + RIGHT_SHIFT_TONE_TRIG;
  		tt_cssVar.style.setProperty('--NO_AUTODEMO_LEFT_POS', newCtlsLeft + 'px');
  		
    });
   
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************

	// User has selected play
    $('#playSegment').on('click', function(){	
    	// in case plots have other stuff on them from other activities, clean it up
    	doToneOnly();
    	// activate pause and disable play
    	$(this).prop('disabled', true);  // disable play once playing
    	$('#stopSegment').prop('disabled', false);  // reactivate pause
    	demo.setCurrSeg(parseInt($('#segNum').val()));

    	demo.startDemo();
    	
    	// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
    });
    
    $('#stopSegment').on('click', function(){	
    	demo.stopThisSegment();
    	// change icons so play is now enabled and stop is disabled
    	$(this).prop('disabled', true);  // disable play once playing
    	$('#playSegment').prop('disabled', false);  // reactivate play
  
      	// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
    });
    
    $('#dismissAutoDemo').on('click', function(){	
    	// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen
    	demo.stopThisSegment();  // may or may not be needed
    	
		$('#startAutoDemo').css('display', 'inline-block');
		$('#autoDemoCtls').css('display', 'none');
		
		// undo the drop of the canvas when we started autodemo
		let tt_cssVar = document.querySelector(':root');
		let cssVar = getComputedStyle(tt_cssVar);
		// get the current val of CSS var and remove the px from end
  		let currCtlsLeft = cssVar.getPropertyValue('--NO_AUTODEMO_LEFT_POS').slice(0,-2);
		let newCtlsLeft = parseInt(currCtlsLeft) - RIGHT_SHIFT_TONE_TRIG;
  		tt_cssVar.style.setProperty('--NO_AUTODEMO_LEFT_POS', newCtlsLeft + 'px');
  		
   		// remove the class so the click here animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
    });
    
    $("#segNum").change(function(){
		let currSeg = parseInt($('#segNum').val());
		demo.setCurrSeg(currSeg);
		
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
	});
	
	

})
