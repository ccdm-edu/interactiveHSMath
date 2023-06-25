'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	// turn on help in upper left corner
	$('#startAutoDemo').css('display', 'inline-block');
	
	//if Next  button hit (in base template), set it up to go to intro page
	$("#GoToNextPage").wrap('<a href="../ToneTrig"></a>');
	
	// user can only pick expert/newbie mode on the first home page
	let newbieMode = sessionStorage.getItem('UserIsNew');
	if (newbieMode && (newbieMode.toLowerCase() === "true")) {
		// emphasize the auto demo as first place
		$("#startAutoDemo").addClass('newbieMode');
	} 
	
	// set up frequency slider
	let $currFreq = $("#FreqSlider_DT2");
	let currFreq = $currFreq.val();
	let ind;
	let inc;
	let phaseOffsetInRad = 0; // changes with every sample freq, it is phase offset on samples
	
	let ctxUnitCircle;
	const EXPANDED_TIME = 0.2;  // max time on lower graph, shows 10 > freq >5
	const MAX_TIME_SEC = 1.0  // 1Hz is min freq, max time on upper graph
	const PIX_PER_MINOR_TICK = 17;
	const MAX_AMP_AXIS = CIRC_RAD + 10;
	const PERIOD_COLOR = 'DarkOrchid';
	const SINE_COLOR = "blue";
	const RADIUS_VECTOR_COLOR = "PaleTurquoise"
	
	const ANGLE_PER_PT_RAD = Math.PI/6;
	const TOTAL_NUM_DOTS = 2.0 * Math.PI/ANGLE_PER_PT_RAD;
	const ANGLE_PER_PT = 360/TOTAL_NUM_DOTS;
	
	function findSampToSkip(freqStr) {
		// want to keep sample period greater than 40 ms
		let index = 0;
		let numIncrement = 1;
		let freq = Number(freqStr)
		// lower freq use lower sample rate, higher freq, use Nyquist 2*fmax sample rate
		if (freq <= 2) {
			numIncrement = 1;
		} else if ((freq > 2) && (freq <= 4)) {
			numIncrement = 2;
		} else if ((freq > 4) && (freq <= 5)) {
			numIncrement = 3;
		} else if ((freq > 5) && (freq <= 8)) {
			numIncrement = 4;
		} else {
			// its at max we can allow, go as fast as we can
			numIncrement = 6;
			index = 2;  // need to offset sample at max rate
		}
		return [index, numIncrement, (index * ANGLE_PER_PT_RAD)];
	};
	// start up value
	$("#currFreqVal_DT2").text($("#FreqSlider_DT2").val() + " Hz");
	[ind, inc, phaseOffsetInRad] = findSampToSkip(currFreq);

	
	//*******************************************************
	//**** Draw the unit circle with black dots and the axis off to right side for the plots
	//*******************************************************
	let circleDotsCanvas =  $("#AmpSinCosCircle_DT2").get(0);  // later on, this will set the "background image" for animation
	// get ready to start drawing on this canvas, first get the context
	if ( $("#AmpSinCosCircle_DT2").length ) {
    	ctxUnitCircle = $("#AmpSinCosCircle_DT2").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Sin/Cos unit circle context');
	}
	let sineAxisBkgd;
	
	// *** Start drawing the "unit circle" 
	const HALF_AXIS = CIRC_RAD + AXIS_OVERLAP;
	const CIRC_X0 = 210;
	const CIRC_Y0 = 330;   // use this to raise and lower the whole circle, remember y increases going down the page
	drawTrigCircle(ctxUnitCircle, CIRC_X0, CIRC_Y0, HALF_AXIS);
	
	//*** Draw the big unit circle
	// need to ensure the points here can never be negative, else they get clipped
	ctxUnitCircle.beginPath();
	// draw main circle
	ctxUnitCircle.lineWidth = 1.0
	ctxUnitCircle.strokeStyle = "black";
    ctxUnitCircle.arc(CIRC_X0, CIRC_Y0, CIRC_RAD, 0, Math.PI * 2, true); 
    ctxUnitCircle.stroke();
    	
	let sample = []; // the dots will be samples
    //*** angle in rad, draw small circles that will be sample points
    for (let pt = 0; pt < TOTAL_NUM_DOTS; pt++) {
    	let curr_angle = pt * ANGLE_PER_PT_RAD;
    	let x = CIRC_X0 + Math.round(CIRC_RAD*Math.cos(curr_angle));
		let y = CIRC_Y0 - Math.round(CIRC_RAD*Math.sin(curr_angle));
		sample.push({x: x, y: y});
    	ctxUnitCircle.beginPath();
		// create dots for user clickable phase accumulation
		ctxUnitCircle.arc(x, y, DOT_RADIUS, 0, 2 * Math.PI, true);
		ctxUnitCircle.fillStyle = SINE_COLOR;
		ctxUnitCircle.fill();
		ctxUnitCircle.stroke();
		ctxUnitCircle.closePath();
     }
     
     // keep a snapshot of drawing before user interation, need to go back to it on change
     let backgroundPlot; // used when user selects a new yellow dot to clear out the values of the old dot selected
	 backgroundPlot = ctxUnitCircle.getImageData(0, 0, circleDotsCanvas.width, circleDotsCanvas.height);

	//********************************************************
	// Start drawing the graph to show the changes in freq and sine plots with respect to time
	// Upper plot is longer view of time and good for low freq, Lower plot is shorter view of time
	// and good for higher freq
	//********************************************************
	let ctxFreqPlot;
	let freqCanvas =  $("#FreqChange_DT2").get(0);  // later on, this will set the "background image" for animation
	// get ready to start drawing on this canvas, first get the context
	if ( $("#FreqChange_DT2").length ) {
    	ctxFreqPlot = $("#FreqChange_DT2").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Sin/Cos unit circle context');
	}	

	// draw sin axis off to right and a little above
	const UPPER_Y_ORIGIN = 180;
	const UPPER_X_ORIGIN = 60;
	const LOWER_Y_ORIGIN = 500;
	const LOWER_X_ORIGIN = 60;
	// 4 is number of major axis wanted on graph
	drawSineAxis(ctxFreqPlot, UPPER_X_ORIGIN, UPPER_Y_ORIGIN, MAX_TIME_SEC, PIX_PER_MINOR_TICK, 4);
	drawSineAxis(ctxFreqPlot, LOWER_X_ORIGIN, LOWER_Y_ORIGIN, MAX_TIME_SEC/5,PIX_PER_MINOR_TICK, 4);
	// add labels above the graph S=sin(2*pi*f*t)
	$("#sinEqtnLabelHI_DT2").text("S=sin(2" + MULT_DOT + PI + MULT_DOT + "f" + MULT_DOT + "t)");
	$("#sinEqtnLabelLO_DT2").text("S=sin(2" + MULT_DOT + PI + MULT_DOT + "f" + MULT_DOT + "t)");
	//*****************
	// draw lines inbetween plots to show lower plot is expanded time of upper plot

	let startPt = {start:[UPPER_X_ORIGIN,UPPER_Y_ORIGIN], stop:[LOWER_X_ORIGIN, LOWER_Y_ORIGIN - MAX_AMP_AXIS - 10]};
	let endPt = {start:[UPPER_X_ORIGIN + 4*PIX_PER_MINOR_TICK, UPPER_Y_ORIGIN], stop: [LOWER_X_ORIGIN  + 20*PIX_PER_MINOR_TICK, LOWER_Y_ORIGIN]};
	drawExpansionLines(ctxFreqPlot, startPt, endPt,EXPANDED_TIME + " sec expanded");
		
	//*** Get the background before plots put up
	sineAxisBkgd = ctxFreqPlot.getImageData(0, 0, freqCanvas.width, freqCanvas.height);

	//*****************
	sineAxisBkgd = ctxFreqPlot.getImageData(0, 0, freqCanvas.width, freqCanvas.height);
		 
	//********************************************************
	// Update graph to show what user has done in both lower and upper plot
	//********************************************************
	function calcSine(j, phaseInRad = 0) {
		// j is the time in sec
		return Math.round(CIRC_RAD*Math.sin(2* Math.PI * j * currFreq + phaseInRad));
	}
	function drawOneSineSet(x_orig, y_orig, maxTimePlot){
		ctxFreqPlot.strokeStyle = RADIUS_VECTOR_COLOR;
		let T = 1/currFreq;
		const TOT_PIX_X_AXIS = PIX_PER_MINOR_TICK * 20; // we do 20 minor ticks regardless of plot
		let numPts = 40 + 10*maxTimePlot/T;  // higher freq gets more points on plot
		let pixPerPt = TOT_PIX_X_AXIS/numPts;
		let timeInc = maxTimePlot/numPts;  // each point covers this much time
		for (let i = 0; i<numPts; i++){
			let currTime = (i/numPts) * maxTimePlot;
			// plot from currTime to next increment
			let yLo = calcSine(currTime);
			let yHi = calcSine(currTime + timeInc);
			ctxFreqPlot.beginPath();
			ctxFreqPlot.moveTo(x_orig + i*pixPerPt, Math.round(y_orig - yLo));
			ctxFreqPlot.lineTo(x_orig + i*pixPerPt + pixPerPt, Math.round(y_orig - yHi));
			ctxFreqPlot.stroke();
		}
	}
	
	//*** update unit circle to dynamically show freq
	let startInterval;
	const TWO_PI_RAD = 2.0 * Math.PI;
	function startFreqSample(){
		let countTic=0;
		let countFracSec = 0;
		let phaseInRad = phaseOffsetInRad;
		let numCycles = 0;
		const EXP_AXIS = 20/EXPANDED_TIME;  // 20 ticks per top or bottom expanded axis
		let samplesPerPeriod = TOTAL_NUM_DOTS/inc;
		// this value can NEVER go below 10 ms or browser will change it to 10 ms but in pracice, 
		// it should not go below 40 ms or browser can't keep up
		let timeIntMs = roundFP(1000/(currFreq*samplesPerPeriod), 1);		
		//console.log(" sample time in ms is " + timeIntMs + " samples per period is " + samplesPerPeriod);
		const TIC_IN_HALF_SEC = Math.round(500/timeIntMs);
		if (currFreq >= 0.8) {
			// else freq is too low and you can't see the purple circle for period
			$('#UserNotices_DT2').html('T matches purple circle on graphs to right');
			$('#UserNotices_DT2').css('color', PERIOD_COLOR);
		}
		$('#SampPerPeriod_DT2').html(samplesPerPeriod); // inc is fixed per sine freq
        startInterval = setInterval(function(){
    		let currPeriod = 1/currFreq;
    		if (0 == countTic % TIC_IN_HALF_SEC) {
    			// only update every portion of sec
    			countFracSec = countFracSec + 0.5;
    			$('#timeVal_DT2').text(countFracSec); 
			}
			phaseInRad +=  inc * ANGLE_PER_PT_RAD;
			if (phaseInRad >= TWO_PI_RAD) {
				// a cycle has completed, update labels and circle around T on appropriate graph
				phaseInRad = phaseInRad % TWO_PI_RAD;
				numCycles++;
				// update the two numeric values, number of cycles and period
				$('#cycles_DT2').text(numCycles);
				$('#period_DT2').text(roundFP(currPeriod, 3));
				// draw a circle on the period T on the graph to right
				if (currPeriod > EXPANDED_TIME){
					// draw on upper graph, its a low freq signal, there are 20 minor tics on this axis
					let xcoord = Math.round(UPPER_X_ORIGIN + 20*currPeriod*PIX_PER_MINOR_TICK);
					ctxFreqPlot.beginPath();
					ctxFreqPlot.lineWidth = 2.0
					ctxFreqPlot.strokeStyle = PERIOD_COLOR;
					let point_y = UPPER_Y_ORIGIN;
					ctxFreqPlot.arc(xcoord, UPPER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
					ctxFreqPlot.stroke();
				} else {
					// draw on lower graph, its a high freq signal, there are 20 minor tics on this axis
					let xcoord = Math.round(LOWER_X_ORIGIN  + EXP_AXIS*currPeriod*PIX_PER_MINOR_TICK);
					ctxFreqPlot.beginPath();
					ctxFreqPlot.lineWidth = 2.0
					ctxFreqPlot.strokeStyle = PERIOD_COLOR;
					let point_y = LOWER_Y_ORIGIN
					ctxFreqPlot.arc(xcoord, LOWER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
					ctxFreqPlot.stroke();
				}			
			}
			
			// draw line from axis to sine sample on both graphs to the right, on higher sample rates, we put a 
			// phase offset in there for initial point but we can't show t=0 with phase offset else
			// period T in green won't match value calculate and nonengineers will get confused.  This
			// simplifies things even if its slightly inaccurate.
			let initPhaseTimeOffset = (phaseOffsetInRad/TWO_PI_RAD) * (1/currFreq);
			let timeInS = roundFP(countTic * timeIntMs/1000,3) + initPhaseTimeOffset;
			let sampY = calcSine(timeInS, phaseOffsetInRad);
			//console.log(" time is " + timeInS + " samp= " + sampY + " inc = " + inc + " phaseOffset = " + phaseOffsetInRad);
			if (timeInS <= MAX_TIME_SEC) {
				// draw sample points on upper graph
				let xcoord = Math.round(UPPER_X_ORIGIN + timeInS*20*PIX_PER_MINOR_TICK);
				ctxFreqPlot.beginPath();
				ctxFreqPlot.lineWidth = 1.0
				ctxFreqPlot.strokeStyle = SINE_COLOR;
				let point_y = UPPER_Y_ORIGIN;
				ctxFreqPlot.moveTo(xcoord, UPPER_Y_ORIGIN);
				ctxFreqPlot.lineTo(xcoord, Math.round(UPPER_Y_ORIGIN - sampY ));
				ctxFreqPlot.stroke();
				ctxFreqPlot.closePath();
				// draw a tiny dot for the sample on the curve
			    ctxFreqPlot.beginPath();
				ctxFreqPlot.arc(xcoord,  Math.round(UPPER_Y_ORIGIN - sampY ), 3, 0, 2 * Math.PI, true);
				ctxFreqPlot.fillStyle = SINE_COLOR;
				ctxFreqPlot.fill();
				ctxFreqPlot.stroke();
				ctxFreqPlot.closePath();
			}
			if (timeInS <= EXPANDED_TIME) {
				// draw sample points on lower graph
				let xcoord = Math.round(LOWER_X_ORIGIN + (timeInS/EXPANDED_TIME)*20*PIX_PER_MINOR_TICK);
				ctxFreqPlot.beginPath();
				ctxFreqPlot.lineWidth = 1.0
				ctxFreqPlot.strokeStyle = SINE_COLOR;
				let point_y = UPPER_Y_ORIGIN;
				ctxFreqPlot.moveTo(xcoord, LOWER_Y_ORIGIN);
				ctxFreqPlot.lineTo(xcoord, Math.round(LOWER_Y_ORIGIN - sampY));
				ctxFreqPlot.stroke();
				ctxFreqPlot.closePath();
				// draw a tiny dot for the sample on the curve
			    ctxFreqPlot.beginPath();
				ctxFreqPlot.arc(xcoord,  Math.round(LOWER_Y_ORIGIN - sampY ), 3, 0, 2 * Math.PI, true);
				ctxFreqPlot.fillStyle = SINE_COLOR;
				ctxFreqPlot.fill();
				ctxFreqPlot.stroke();
				ctxFreqPlot.closePath();
			}


			// every time sample, put unit circle back to "clean" initial state
			ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
			// draw line from center of unit circle to sample point on circle
			ind = (ind + inc) % TOTAL_NUM_DOTS;
			ctxUnitCircle.beginPath();
			ctxUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
			ctxUnitCircle.lineTo(sample[ind].x, sample[ind].y);
			ctxUnitCircle.strokeStyle = RADIUS_VECTOR_COLOR;
			ctxUnitCircle.lineWidth = 3.0
			ctxUnitCircle.stroke();
			ctxUnitCircle.closePath();

			// draw the vertical sine portion on the unit circle
			ctxUnitCircle.beginPath();
			ctxUnitCircle.moveTo(sample[ind].x, sample[ind].y);
			ctxUnitCircle.lineTo(sample[ind].x, CIRC_Y0);
			ctxUnitCircle.strokeStyle = SINE_COLOR;
			ctxUnitCircle.lineWidth = 1.0
			ctxUnitCircle.stroke();
			ctxUnitCircle.closePath();
			
			// done now, increment time to next value
			countTic++;
    	}, timeIntMs);	
    }
    	
    		
	//***********************************
	//*** User interaction
	//***********************************
    //*** user clicks the Go button, thereby implementing the freq chosen on slider
    let clockIsRunning = false;
    $('#GoFreq_DT2').on('click', function(event) {
		//This will keep going until user hits stop
		if ("GO" == $('#GoFreq_DT2').prop("value")) {
			// user is asking to Go, set up sampling/freq plots
			// go back to bare plots before we redo everything
			ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
			// plot new freq sin graphs
			drawOneSineSet(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, MAX_TIME_SEC);
			drawOneSineSet(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPANDED_TIME);
			// allow user to stop, change color of button to pale red
			$('#GoFreq_DT2').prop('value', 'Stop');
			$('#GoFreq_DT2').css('background-color', 'hsl(0,100%,80%)');
			//do the sampling and update time/phase plots
			clockIsRunning = true;
			// reset sampling index to original values
			[ind, inc, phaseOffsetInRad] = findSampToSkip(currFreq);
			// start the sampling and updating of values
			startFreqSample();
		} else {
			// user is asking to stop
		    if (startInterval) clearInterval(startInterval);
    		clockIsRunning = false;
			// allow user to adjust freq and go again
			$('#GoFreq_DT2').prop('value', 'GO');
			$('#GoFreq_DT2').css('background-color', currentGreen);
		}
    });
    
    // make a nice blinky green to attract attention on the go button and a red background when its stop
    let blinkyInterval;
    const PALE_GREEN = 'hsl(120, 100%, 80%)';
    const FULL_GREEN = 'hsl(120, 100%, 50%)';
    let currentGreen = FULL_GREEN;
    // initialize GO button to green shade
    $('#GoFreq_DT2').css('background-color', currentGreen);
    blinkyInterval = setInterval(function(){
    	if (!clockIsRunning) {
    		// do a blinky light between two different green shades on GO button
    		$('#GoFreq_DT2').css('background-color', currentGreen);
    		currentGreen = (currentGreen == PALE_GREEN) ? FULL_GREEN : PALE_GREEN;
    	}
    }, 500);
    
    //***********************************
    //*** Change label on freq slider and adjust the tone as appropriate
	$('#FreqSlider_DT2').on('change', function(){
		console.log(" WE MADE IT to change on slider");
		$currFreq = $("#FreqSlider_DT2");  // get slider value
	    // and put it on the label as string
		$("#currFreqVal_DT2").text($("#FreqSlider_DT2").val() + " Hz");
		// update global var
		currFreq = $currFreq.val();
		// choose num samples/period and offset as function of chosen period
		[ind, inc, phaseOffsetInRad] = findSampToSkip(currFreq);
		// update plots off to the right
		ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		// plot new freq sin graphs
		drawOneSineSet(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, MAX_TIME_SEC);
		drawOneSineSet(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPANDED_TIME);
		// update labels to show current freq
		$("#sinEqtnLabelHI_DT2").text("S=sin(2" + MULT_DOT + PI + MULT_DOT + "f" + MULT_DOT + "t)=sin(2" + MULT_DOT + PI + MULT_DOT + currFreq + MULT_DOT + "t)");
		$("#sinEqtnLabelLO_DT2").text("S=sin(2" + MULT_DOT + PI + MULT_DOT + "f" + MULT_DOT + "t)=sin(2" + MULT_DOT + PI + MULT_DOT + currFreq + MULT_DOT + "t)");	
		// if an old freq is running, stop and start it again
		if (startInterval) clearInterval(startInterval);
		if (clockIsRunning) {
			startFreqSample();
		}
	});

    //****************************************************************************
    // Autodemo script for dynamic trig 2
    //**************************************************************************** 
	const SCRIPT_AUTO_DEMO = [
	{ segmentName: "First frequency",
	  headStartForAudioMillisec: 19000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: '../../static/static_binaries/AudioExpln/DynamicTrig2_Seg0.mp3'}
			},
			// click on go button to start sampling at 0.5 Hz
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'GoFreq_DT2',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 8000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'GoFreq_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 5000} 
			},
			// click on freq slider to change freq to 2 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 value: "2.0",
			 	  offset: {x: 25, y: 10},  // in the 2Hz location
			 	waitTimeMillisec: 9000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 2000} 
			},
			// click on freq slider to change freq to 4 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 value: "4.0",
			 	  offset: {x: 0, y: 10},  // in the 2Hz location
			 	waitTimeMillisec: 8000}  // this is wait before you go on to next item
			 },	
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 2000} 
			},
			// click on freq slider to change freq to 8 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 value: "8.0",
			 	  offset: {x: -40, y: 10},  // in the 2Hz location
			 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
			 },	
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 2000} 
			},
			// click on freq slider to change freq to 10 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 value: "10.0",
			 	  offset: {x: -65, y: 10},  // in the 2Hz location
			 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
			 },	
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 2000} 
			},
	  ]
	}];

    //****************************************************************************
    // User initiates autoDemo activity
    //****************************************************************************   
	//*** user clicks the start demo image, iniitalize everything
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO);  // give the demo the full script
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
		// more of the plots on the page
		//let dt_cssVar = document.querySelector(':root');
		//var cssVar = getComputedStyle(dt_cssVar);
		// get the current val of CSS var and remove the px from end
  		//let currCanvasTop = cssVar.getPropertyValue('--CANVAS_TOP').slice(0,-2);
		///let newCanvasTop = parseInt(currCanvasTop) + CANVAS_DROP_AUTODEMO;
  		//dt_cssVar.style.setProperty('--CANVAS_TOP', newCanvasTop + 'px');
  		// mover header out of controls area
  		//$('#HeaderTrig_DT1').css('left', '400px');
    });
   
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************

	// User has selected play
    $('#playSegment').on('click', function(){	
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
		//let dt_cssVar = document.querySelector(':root');
		//var cssVar = getComputedStyle(dt_cssVar);
		// get the current val of CSS var and remove the px from end
  		//let currCanvasTop = cssVar.getPropertyValue('--CANVAS_TOP').slice(0,-2);
		//let newCanvasTop = parseInt(currCanvasTop) - CANVAS_DROP_AUTODEMO;
  		//dt_cssVar.style.setProperty('--CANVAS_TOP', newCanvasTop + 'px');
  		// move header back where it was
  		//$('#HeaderTrig_DT1').css('left', '300px');
  		
  		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
    });
    
    $("#segNum").change(function(){
		let currSeg = parseInt($('#segNum').val());
		demo.setCurrSeg(currSeg);
		
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
	});
 
})