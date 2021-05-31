'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {

	// implement the Tone sounding and chart tools
	var $currFreq = $("#in-range-freq");
	var $currAmp = $("#in-range-amp");
	var $currPhase = $("#in-range-phase")
	
	var ToneIsOnNow = false;
	var osc = new Tone.Oscillator(); 
	
	var timeMsLo = [];
	var ampLo = [];
	var timeMsHi = [];
	var ampHi = [];
	
	function fillInArrays(){
		const NUM_PTS_PLOT = 200;
		const NUM_PTS_PLOT_LO = 1000;
		const DURATION_LO_PLOT_MS = 10;
		const DURATION_HI_PLOT_MS = 1;
		//sample period in sec
		var samplePeriodLo = DURATION_LO_PLOT_MS/(1000 * NUM_PTS_PLOT_LO);
		var samplePeriodHi = DURATION_HI_PLOT_MS/(1000 * NUM_PTS_PLOT);
		var i;
		for (i=0; i<=NUM_PTS_PLOT_LO; i++) {
			ampLo[i] = $currAmp.val() * Math.sin(2 * Math.PI * ($currFreq.val() * i * samplePeriodLo + $currPhase.val() / 360.0) );
			timeMsLo[i] = roundFP(i * samplePeriodLo * 1000, 2);
		}
		for (i=0; i<=NUM_PTS_PLOT; i++) {
			ampHi[i] = $currAmp.val() * Math.sin(2 * Math.PI * ($currFreq.val() * i * samplePeriodHi + $currPhase.val() / 360.0) );
			timeMsHi[i] = roundFP(i * samplePeriodHi * 1000, 2);
		}	
	};
	
	function drawTone()
	{
		fillInArrays();
		// CHART js hint:  update time, need to add the new and THEN remove the old.  X axis doesn't like to be empty...
		
	    // update tone, remove old (although for now, just one data set), add new
	    sine_plot_100_1k.data.datasets.forEach((dataset) => {
	        dataset.data.pop();
	    });
	    sine_plot_100_1k.data.datasets.forEach((dataset) => {
	        dataset.data.push(ampLo);
	    });	   
	    // update title to match new parameters
	    // http://www.javascripter.net/faq/greekletters.htm added pi in as greek letter
	    var currTitleText = 'y = ' + $currAmp.val() + ' * sin{ 2 * \u03C0 * (' + $currFreq.val() + ' * t + ' + $currPhase.val() + '/360) }';
	    sine_plot_100_1k.options.title.text = currTitleText;
	    // make all these changes happen
	    sine_plot_100_1k.update();
	    
	    // update tone, remove old (although for now, just one data set), add new
	    sine_plot_1k_10k.data.datasets.forEach((dataset) => {
	        dataset.data.pop();
	    });
	    sine_plot_1k_10k.data.datasets.forEach((dataset) => {
	        dataset.data.push(ampHi);
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
		// LATER:  look to improve the pop up from alert to something better looking
		switch (parseInt($currPhase.val())) {
			case 180:
				alert('Hey Look!  phase = 180 is a negative sine wave! \nsin(a+180) = sin(a)cos(180) + cos(a)sin(180)\n                  = sin(a) * -1       + cos(a) * 0 \n                  = -sin(a)');
				break;
			case 270:
				alert('Hey Look!  phase = 270 is a negative cosine wave! \nsin(a+270) = sin(a)cos(270) + cos(a)sin(270)\n                  = sin(a) * 0       + cos(a) * -1 \n                  = -cos(a)');
				break;
			case 360:
				alert('Hey Look!  phase = 360 = 0 is a sine wave! \nWhy?  Because 360 degrees = 2 pi takes you back to the beginning at zero');
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
	
	//***********************************
	//  Immediate execution here
	//***********************************

	var ctxLo, ctxHi, ctxExpandTime;
    if ( $("#sine_plotsLo").length ) {
    	ctxLo = $("#sine_plotsLo").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain sin_plotsLo context');
	};
    if ( $("#sine_plotsHi").length ) {
    	ctxHi = $("#sine_plotsHi").get(0).getContext('2d');
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
	
	var currTitle = {display: true, text: 'y = ' + $currAmp.val() + ' * sin{ 2 * pi * (' + $currFreq.val() + ' * t + ' + $currPhase.val() + '/360) }'};
	
	const TOP_CHART = {...CHART_OPTIONS, title: currTitle };
	var sine_plot_100_1k = new Chart(ctxLo, {
	    type: 'line',
	    data: {
	    	labels: timeMsLo,
	        datasets: [{
	            label: 'Tone Graph',
	            data: ampLo,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',
	            }]
	    },
	    options: TOP_CHART
	});
	
	// if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	var sine_plot_1k_10k = new Chart(ctxHi, {
	    type: 'line',
	    data: {
	    	labels: timeMsHi,
	        datasets: [{
	            label: 'Tone Graph',
	            data: ampHi,
	            fill: false,
	            borderColor: 'rgb(75, 192, 192)',
	            }]
	    },
	    options: CHART_OPTIONS
	});
	
	// CONSTANTS FOR DRAWING LINES BETWEEN GRAPHS
	const ZERO = 20;  // about where the zero axis ends up on the canvas
	const ONE_MS = 48;
	const CNV_W = ctxExpandTime.canvas.scrollWidth; //ctxExpandTime.canvas.clientWidth;
	const CNV_H = ctxExpandTime.canvas.scrollHeight; //ctxExpandTime.canvas.clientHeight;
	// I have no idea why I need this crazy fudge factor on  width of canvas, but it works
	// I think javascript and css treat sizes differently
	const END = CNV_W /2.69;
	const ARW = 5; 
	console.log("between graph canvas is sized " + "(" + CNV_W + " , " + CNV_H + ")");
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
	
});
