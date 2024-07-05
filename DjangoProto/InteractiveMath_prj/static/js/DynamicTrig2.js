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
	} else if (newbieMode && (newbieMode.toLowerCase() === 'false')) {
		// remind user what to do 
		$('#FirstHelp_DT2').css("visibility", "visible");
	}
	
	let ctxUnitCircle;
	const EXPANDED_TIME = 2;  // max time on lower graph, shows 2 > freq >0.5
	const MAX_TIME_SEC = 10;  // 1Hz is min freq, max time on upper graph
	const MAX_FREQ_ALLPT = 1; // max frequency where all points are shown on upper graph (else it looks cluttered)
	const PIX_PER_MINOR_TICK = 17;
	const MAX_AMP_AXIS = CIRC_RAD + 10;
	const PERIOD_COLOR = 'DarkOrchid';
	const SINE_COLOR = "blue";
	const RADIUS_VECTOR_COLOR = "black"; 
	const SINE_OUTLINE_COLOR = "PaleTurquoise";
	const ANGLE_COLOR = 'green';
	
	const ANGLE_PER_PT_RAD = Math.PI/6;
	const TOTAL_NUM_DOTS = 12.0;
	const GO_BUTTON_TEXT = "Start";
	const PAUSE_BUTTON_TEXT = "Pause"
	
	//NOTE:  we keep the rate around the circle less than 2 Hz because at about 3 Hz, can trigger epliptic attack
	//https://epilepsysociety.org.uk/about-epilepsy/epileptic-seizures/seizure-triggers/photosensitive-epilepsy#:~:text=Photosensitive%20epilepsy%20is%20when%20seizures,feel%20disorientated%2C%20uncomfortable%20or%20unwell.
	// between 3-30 Hz can trigger seizures.  Above 3 Hz sampling looks like flashing and the eye can't see 
	// sampling occur so educational value is lost.  We have time to use all 12 samples shown, no need to skip

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

    // Lets keep track of exact values of each sample in radians, brought over from StaticTrig.js, just need num/denom for display
    // angleRadCCW draws the theta angle which we need CCW but is drawn CW--so value looks strange
    let thetaSamp = [];
    const EPSILON = 15;  // value used to put the labels close but not on the angle dot
    //thetaRad is in LaTeX or MathJax
 	thetaSamp[0] = {num: 0, thetaInRad: "(2" + PI + ")" + MULT_DOT + "0/12",angleRadCCW: 0,moveX:EPSILON, moveY: -EPSILON};  // 0 deg
	thetaSamp[1] = {num:1, thetaInRad: "(2" + PI + ")" + MULT_DOT + "1/12",angleRadCCW: 11*Math.PI/6, moveX:EPSILON, moveY: 0};  // pi/6 ang};   30 deg
	thetaSamp[2] = {num:2, thetaInRad: "(2" + PI + ")" + MULT_DOT + "2/12",angleRadCCW: 5*Math.PI/3, moveX:EPSILON, moveY: 0};  // pi/3, 60 deg
	thetaSamp[3] = {num: 3, thetaInRad: "(2" + PI + ")" + MULT_DOT + "3/12",angleRadCCW:3*Math.PI/2, moveX:EPSILON, moveY: -EPSILON};  // pi/2, 90 deg
	thetaSamp[4] = {num: 4, thetaInRad: "(2" + PI + ")" + MULT_DOT + "4/12",angleRadCCW: (4/3) * Math.PI, moveX:-3*EPSILON, moveY: -EPSILON };  // pi/2 + pi/6, 120 deg
	thetaSamp[5] = {num: 5, thetaInRad: "(2" + PI + ")" + MULT_DOT + "5/12",angleRadCCW: 7*Math.PI/6, moveX:-4*EPSILON, moveY: -EPSILON };  // pi/2 + pi/3, 150 deg
	thetaSamp[6] = {num: 6, thetaInRad: "(2" + PI + ")" + MULT_DOT + "6/12",angleRadCCW:  Math.PI, moveX:-4*EPSILON, moveY: -EPSILON};  // pi, 180 deg
	thetaSamp[7] = {num: 7, thetaInRad: "(2" + PI + ")" + MULT_DOT + "7/12",angleRadCCW: 5*Math.PI/6 , moveX:-5*EPSILON, moveY: 0};  // pi + pi/6, 210 deg
	thetaSamp[8] = {num: 8, thetaInRad: "(2" + PI + ")" + MULT_DOT + "8/12",angleRadCCW:  2*Math.PI/3, moveX:-5*EPSILON, moveY: 0};  // pi + pi/3, 240 deg
	thetaSamp[9] = {num: 9, thetaInRad: "(2" + PI + ")" + MULT_DOT + "9/12",angleRadCCW:  Math.PI/2, moveX:-4.5*EPSILON, moveY: 1.5*EPSILON};  // 3pi/2 , 270 deg
	thetaSamp[10] = {num: 10, thetaInRad: "(2" + PI + ")" + MULT_DOT + "10/12",angleRadCCW:  Math.PI/3, moveX:EPSILON, moveY: EPSILON};  // 3pi/2 + pi/6 = 5pi/3, 300 deg
	thetaSamp[11] = {num: 11, thetaInRad: "(2" + PI + ")" + MULT_DOT + "11/12",angleRadCCW: Math.PI/6, moveX:EPSILON, moveY: EPSILON};  //  3pi/2 + pi/3 = 11pi/6, 330 deg
     	
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
    //*** angle in radians, draw small circles that will be sample points for all sample rates
    for (let pt = 0; pt < TOTAL_NUM_DOTS; pt++) {
    	let curr_angle = pt * ANGLE_PER_PT_RAD;
    	let x = CIRC_X0 + Math.round(CIRC_RAD*Math.cos(curr_angle));
		let y = CIRC_Y0 - Math.round(CIRC_RAD*Math.sin(curr_angle));
		sample.push({x: x, y: y});
    	ctxUnitCircle.beginPath();
		// create dots for phase accumulation
		ctxUnitCircle.arc(x, y, DOT_RADIUS, 0, 2 * Math.PI, true);
		ctxUnitCircle.fillStyle = "yellow";
		ctxUnitCircle.fill();
		ctxUnitCircle.stroke();
		ctxUnitCircle.closePath();
		ctxUnitCircle.font = "15px Georgia";
		ctxUnitCircle.fillStyle = ANGLE_COLOR;
		ctxUnitCircle.fillText(thetaSamp[pt].thetaInRad, x+thetaSamp[pt].moveX,y+thetaSamp[pt].moveY);
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
	// start up value on freq slider
	$(".currFreqVal_DT2").text($("#FreqSlider_DT2").val() + " Hz");
	let $currFreq = $("#FreqSlider_DT2");
	let currFreq = $currFreq.val();
	// update labels on graphs to show current freq at default
	$("#sinEqtnLabelHI_DT2").text("S=sin(2" + MULT_DOT + PI + MULT_DOT + "f" + MULT_DOT + "t)=sin(2" + MULT_DOT + PI + MULT_DOT + currFreq + MULT_DOT + "t)");
	$("#sinEqtnLabelLO_DT2").text("S=sin(2" + MULT_DOT + PI + MULT_DOT + "f" + MULT_DOT + "t)=sin(2" + MULT_DOT + PI + MULT_DOT + currFreq + MULT_DOT + "t)");	

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
		ctxFreqPlot.strokeStyle = SINE_OUTLINE_COLOR;
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
	//*************************************************
	// Reset the page to the defaults
	//************************************************* 
	let DEFAULT_FREQ = 0.1; // as set in html for element
	function resetToDefaults(){
		// set the freq to lowest 
		$("#FreqSlider_DT2").prop("value", DEFAULT_FREQ);
		$currFreq = $("#FreqSlider_DT2");  // get slider value
	    // and put it on the label as string
		$(".currFreqVal_DT2").text($currFreq.val() + " Hz");
		// update global var
		currFreq = $currFreq.val();
		// turn off the sampler, first turn off timer
		if (startInterval) clearInterval(startInterval);
    	clockIsRunning = false;
		// set up button to go again
		$('#GoFreq_DT2').prop('value', GO_BUTTON_TEXT);
		$('#GoFreq_DT2').css('background-color', currentGreen);
		// clear out the unit circle and graphs now that timer is stopped
		ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
		ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		
		// restart the table values
		startOverValues();
		//clock is not running, need to manually clean up the table values
		$('.timeVal_DT2').text("0 sec");
		$('.ThetaUC_eqtn').html(thetaSamp[0].thetaInRad);  //look at vertical_fract in utils
		$('#observeAnswer').text("2" + PI + "(0 + "+ thetaSamp[0].num + "/12)");
		$("#expectAnswer").text("2" + PI + "(0 + 0/12)");
		$('.N_eqtn').text("0");
		
		// get rid of any possible user notifications about the graphs, which are now irrelevant
		$('#UserNotices_DT2').text("");
		$('#SubSampleNotice_DT2').text('');
	}
	//*************************************************
	//*** update unit circle to dynamically show freq
	//*************************************************
	let startInterval;
	const TWO_PI_RAD = 2.0 * Math.PI;
	const SUBSCRIPT_U = '\u1d64';  //subscript u is "theta on the unit circle"
	//these need to be available for resuming after a pause, initialize for first run
	let countTic=0;
	let phaseInRad=0;
	let numCycles=0;  //num times around circle
	let ind=0; // num points processed
	function startOverValues(){
		countTic = 0;
		phaseInRad = 0;
		numCycles = 0;
		ind =  0;
	}
	function startFreqSample(startOver=true){
		if (startOver) {
			startOverValues();
		}
		// 20 ticks per top or bottom expanded axis
		const TICKS_PER_MAX_TIME = 20/MAX_TIME_SEC; 
		const TICKS_PER_EXP_TIME = 20/EXPANDED_TIME;
		// this value can NEVER go below 10 ms or browser will change it to 10 ms but in pracice, 
		// it should not go below 40 ms or browser can't keep up
		let timeIntMs = roundFP(1000/(currFreq*TOTAL_NUM_DOTS), 1);		
        startInterval = setInterval(function(){
    		let currPeriod = 1/currFreq;
			// adding timeIntMs but simplifying to avoid round-off error
			let timeInS = roundFP(countTic/(currFreq * TOTAL_NUM_DOTS), 3);
			ind = ind % TOTAL_NUM_DOTS;
			// update the user experience
			$('.timeVal_DT2').text(roundFP(timeInS,1) + " sec");
			$('.ThetaUC_eqtn').html(thetaSamp[ind].thetaInRad);  //look at vertical_fract in utils

			$('#observeAnswer').text("2" + PI + "(" + numCycles + " + "+ thetaSamp[ind].num + "/12)");
			//handle the right side of the equation, final line, need to turn the decimal value into fraction with same denom as left side
			let calcVal = currFreq * timeInS;
			let intCalcVal = Math.floor(calcVal);
			let fracNum = Math.round( (calcVal - intCalcVal) * 12);
			$("#expectAnswer").text("2" + PI + "(" + intCalcVal + " + " + fracNum + "/12)");
			
			phaseInRad +=  ANGLE_PER_PT_RAD;
			if ( (countTic % TOTAL_NUM_DOTS ) == 0) {
				numCycles = countTic/TOTAL_NUM_DOTS;
				$('.N_eqtn').text(numCycles);
			}

			if (countTic == TOTAL_NUM_DOTS){
				// first cycle has completed, update labels and circle around T on appropriate graph only once
				phaseInRad = phaseInRad % TWO_PI_RAD;
				$('#period_DT2').text(roundFP(currPeriod, 3));
				$('#UserNotices_DT2').text('Period T = 1/f = 1/(' + currFreq + 'Hz) = ' + roundFP(currPeriod,1) + ' sec as shown in purple on graphs to right');
				if (currFreq >= MAX_FREQ_ALLPT) {
					$('#SubSampleNotice_DT2').text('Samples removed from above plot to improve clarity');
				} else {
					$('#SubSampleNotice_DT2').text('');
				}
				// draw a circle on the period T on the graph to right
				if (currPeriod > EXPANDED_TIME){
					// draw on upper graph, its a low freq signal, there are 20 minor tics on this axis
					let xcoord = Math.round(UPPER_X_ORIGIN + currPeriod * PIX_PER_MINOR_TICK * TICKS_PER_MAX_TIME);
					ctxFreqPlot.beginPath();
					ctxFreqPlot.lineWidth = 2.0
					ctxFreqPlot.strokeStyle = PERIOD_COLOR;
					ctxFreqPlot.arc(xcoord, UPPER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
					ctxFreqPlot.stroke();
				} else {
					// draw on lower graph, its a high freq signal, there are 20 minor tics on this axis
					let xcoord = Math.round(LOWER_X_ORIGIN  + currPeriod * PIX_PER_MINOR_TICK * TICKS_PER_EXP_TIME);
					ctxFreqPlot.beginPath();
					ctxFreqPlot.lineWidth = 2.0
					ctxFreqPlot.strokeStyle = PERIOD_COLOR;
					ctxFreqPlot.arc(xcoord, LOWER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
					ctxFreqPlot.stroke();
				}			
			}
			
			// draw line from axis to sine sample on both graphs to the right
			let sampY = calcSine(timeInS);
			let countPoint = countTic%12;  // counts which sample of unit circle you are on and resets 0,1,2,3,4,...12,0,1,2,...
			if (timeInS <= MAX_TIME_SEC) {
				if ( (currFreq < MAX_FREQ_ALLPT) || ( (currFreq >= MAX_FREQ_ALLPT) && (countPoint%3 == 0)) )
				{
					//basically, if the freq is too fast, only plot every 3rd point on upper graph else too cluttered 
					//if freq is low enough, plot all points
					// draw sample points on upper graph
					let xcoord = Math.round(UPPER_X_ORIGIN + (timeInS/MAX_TIME_SEC)*20*PIX_PER_MINOR_TICK);
					ctxFreqPlot.beginPath();
					ctxFreqPlot.lineWidth = 3.0;
					ctxFreqPlot.strokeStyle = SINE_COLOR;
					// draw the line from y=0 to y sine position
					ctxFreqPlot.moveTo(xcoord, UPPER_Y_ORIGIN);
					ctxFreqPlot.lineTo(xcoord, Math.round(UPPER_Y_ORIGIN - sampY ));
					ctxFreqPlot.stroke();
					ctxFreqPlot.closePath();
					// draw a tiny dot for the sample on the curve, which fits above the previous line			
				    ctxFreqPlot.beginPath();
					ctxFreqPlot.arc(xcoord,  Math.round(UPPER_Y_ORIGIN - sampY ), 3, 0, 2 * Math.PI, true);
					ctxFreqPlot.fillStyle = SINE_COLOR;
					ctxFreqPlot.fill();
					ctxFreqPlot.stroke();
					ctxFreqPlot.closePath();
				}
			}
			if (timeInS <= EXPANDED_TIME) {
				// draw sample points on lower graph
				let xcoord = Math.round(LOWER_X_ORIGIN + (timeInS/EXPANDED_TIME)*20*PIX_PER_MINOR_TICK);
				ctxFreqPlot.beginPath();
				ctxFreqPlot.lineWidth = 3.0;
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
			ctxUnitCircle.beginPath();
			ctxUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
			ctxUnitCircle.lineTo(sample[ind].x, sample[ind].y);
			ctxUnitCircle.strokeStyle = RADIUS_VECTOR_COLOR;
			ctxUnitCircle.lineWidth = 1.0;
			ctxUnitCircle.stroke();
			ctxUnitCircle.closePath();

			// draw the vertical sine portion on the unit circle
			ctxUnitCircle.beginPath();
			ctxUnitCircle.moveTo(sample[ind].x, sample[ind].y);
			ctxUnitCircle.lineTo(sample[ind].x, CIRC_Y0);
			ctxUnitCircle.strokeStyle = SINE_COLOR;
			ctxUnitCircle.lineWidth = 3.0;
			ctxUnitCircle.stroke();
			ctxUnitCircle.closePath();
			
			// create angle indicator
			ctxUnitCircle.beginPath();
			ctxUnitCircle.arc(CIRC_X0, CIRC_Y0, 2*ANGLE_IND, 0, thetaSamp[ind].angleRadCCW, true); 	
			ctxUnitCircle.lineWidth = 1.0;
			ctxUnitCircle.strokeStyle = ANGLE_COLOR; 
			ctxUnitCircle.fillStyle = ANGLE_COLOR;
			ctxUnitCircle.font = '20px Arial';
			ctxUnitCircle.fillText(THETA + SUBSCRIPT_U, CIRC_X0 + 2* ANGLE_IND, CIRC_Y0 - ANGLE_IND/2);	
			ctxUnitCircle.stroke();
			ctxUnitCircle.closePath();

			// done now, increment time to next value
			ind += 1;
			countTic++;

    	}, timeIntMs);	
    }
    	
    		
	//***********************************
	//*** User interaction
	//***********************************
    //*** user clicks the Go button, thereby implementing the freq chosen on slider
    let clockIsRunning = false;
    $('#GoFreq_DT2').on('click', function() {
		$('#FirstHelp_DT2').css("visibility", "hidden");  //user doesn't need help anymore
		//This will keep going until user hits stop
		if (GO_BUTTON_TEXT == $('#GoFreq_DT2').prop("value")) {
			// plot new freq sin graphs
			drawOneSineSet(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, MAX_TIME_SEC);
			drawOneSineSet(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPANDED_TIME);
			// allow user to stop, change color of button to pale red
			$('#GoFreq_DT2').prop('value', PAUSE_BUTTON_TEXT);
			$('#GoFreq_DT2').css('background-color', 'hsl(0,100%,80%)');
			//do the sampling and update time/phase plots
			clockIsRunning = true;
			// start the sampling and updating of values, keep leftover values to restart later
			startFreqSample(false);
		} else {
			// user is asking to stop
		    if (startInterval) clearInterval(startInterval);
    		clockIsRunning = false;
			// allow user to adjust freq and go again
			$('#GoFreq_DT2').prop('value', GO_BUTTON_TEXT);
			$('#GoFreq_DT2').css('background-color', currentGreen);
		}
    });
    
    // User clicks the clear button indicating desire to start over with clean slate--this does not start activity or stop it
    $('#Clear_DT2').on('click', function() {
		// go back to bare plots before we redo everything
		ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		// plot new freq sin graphs
		drawOneSineSet(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, MAX_TIME_SEC);
		drawOneSineSet(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPANDED_TIME);
		// put unit circle back to "clean" initial state
		ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
		//clean up the table of values back to zero
		startOverValues();
		if (!clockIsRunning){
			//clock is not running, need to manually clean up the table values
			$('.timeVal_DT2').text("0 sec");
			$('.ThetaUC_eqtn').html(thetaSamp[0].thetaInRad);  //look at vertical_fract in utils
			$('#observeAnswer').text("2" + PI + "(0 + "+ thetaSamp[0].num + "/12)");
			$("#expectAnswer").text("2" + PI + "(0 + 0/12)");
			$('.N_eqtn').text("0");
		}
		// get rid of any possible user notifications about the graphs, which are now irrelevant
		$('#UserNotices_DT2').text("");
		$('#SubSampleNotice_DT2').text('');
    });
    
    // make a nice blinky green to attract attention on the go button and a red background when its stop
    const PALE_GREEN = 'hsl(120, 100%, 80%)';
    const FULL_GREEN = 'hsl(120, 100%, 50%)';
    let currentGreen = FULL_GREEN;
    // initialize GO button to green shade
    $('#GoFreq_DT2').css('background-color', currentGreen);
    setInterval(function(){
    	if (!clockIsRunning) {
    		// do a blinky light between two different green shades on GO button
    		$('#GoFreq_DT2').css('background-color', currentGreen);
    		currentGreen = (currentGreen == PALE_GREEN) ? FULL_GREEN : PALE_GREEN;
    	}
    }, 700);  // 1/700 ms is 1.4Hz
    
    //***********************************
    //*** Change label on freq slider and adjust the tone as appropriate
	$('#FreqSlider_DT2').on('change', function(){
		$currFreq = $("#FreqSlider_DT2");  // get slider value
	    // and put it on the label as string
		$(".currFreqVal_DT2").text($("#FreqSlider_DT2").val() + " Hz");
		// update global var
		currFreq = $currFreq.val();
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
	{ segmentName: "Observed Theta",
	  headStartForAudioMillisec: 115000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'DynamicTrig2Seg0'}
			},

			// now hit go button to execute
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
	  ]
	},
	{ segmentName: "Calculate theta",
	  headStartForAudioMillisec: 55000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'DynamicTrig2Seg1'}
			},

			// now hit go button to execute
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'GoFreq_DT2',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'GoFreq_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 21000} 
			},
			//Pause and calculate values to verify
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'GoFreq_DT2',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'GoFreq_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 3000} 
			},
	  ]},
	  { segmentName: "Increase frequency",
	  headStartForAudioMillisec: 1000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'DynamicTrig2Seg2'}
			},

			// now hit go button to execute
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'GoFreq_DT2',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			},
			// remove cursor on go/stop button
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'GoFreq_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 13000} 
			},
			//increase frequency to 0.5 Hz
			// click on freq slider to change freq to 1 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 value: "0.5",
			 	  offset: {x: 25, y: 10},  
			 	waitTimeMillisec: 4000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 29000} 
			},
			//increase frequency to 1.5 Hz
			// click on freq slider to change freq to 1 hz,  offset is approx guess, user can change
			// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
			{segmentActivity: "CHANGE_ELEMENT_VALUE",
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 value: "1.5",
			 	  offset: {x: -30, y: 10},  
			 	waitTimeMillisec: 4000}  // this is wait before you go on to next item
			 },		
			// remove cursor on freq slider 
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'FreqSlider_DT2',
			 	 action: "nothing",
			 	waitTimeMillisec: 12000} 
			},
	  ]}
	];
	// read the config file and find the actual filenames and put in true values.  First call 'may' have to read
	// from file, all succeeding calls will be faster since read from local memory
	getActualFilename(SCRIPT_AUTO_DEMO[0].segmentActivities[0].segmentParams.filenameURL)
   		.done(resp1 => {
			  	SCRIPT_AUTO_DEMO[0].segmentActivities[0].segmentParams.filenameURL = resp1;
			  	// these should be fast, in case previous one had to open file all this is now cached
			  	getActualFilename(SCRIPT_AUTO_DEMO[1].segmentActivities[0].segmentParams.filenameURL)
			  	.done(resp2 => SCRIPT_AUTO_DEMO[1].segmentActivities[0].segmentParams.filenameURL = resp2);
			  	getActualFilename(SCRIPT_AUTO_DEMO[2].segmentActivities[0].segmentParams.filenameURL)
			  	.done(resp3 => SCRIPT_AUTO_DEMO[2].segmentActivities[0].segmentParams.filenameURL = resp3)
			  	});

    //****************************************************************************
    // User initiates autoDemo activity
    //****************************************************************************   
	//*** user clicks the start demo image, iniitalize everything
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO);  // give the demo the full script
    $('#startAutoDemo').on('click', function() {
		demo.prepDemoControls();
		// move down the table/canvas/controls to make room for autodemo
		demo.moveDownForAutoDemo($('.EqtnTable_DT2'));
  		demo.moveDownForAutoDemo($('#CircleValues_DT2'));
  		demo.moveDownForAutoDemo($('#UnitCircleAndGraphCanvas_DT2'));		
    });
   
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************
	let currSeg = parseInt($('#segNum').val());
	// User has selected play
    $('#playSegment').on('click', function(){	
		// bring everything back to defaults
		resetToDefaults();
    	// activate pause and disable play
    	demo.startDemo();

    });
    
    $('#stopSegment').on('click', function(){	
		// go back to the way it was before autodemo
		resetToDefaults();		
    	demo.stopThisSegment(false);  //we don't want to destroy controls box
    });
    
    $('#dismissAutoDemo').on('click', function(){	
		// go back to the way it was before autodemo
		resetToDefaults();
    	// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen
    	demo.stopThisSegment();  // may or may not be needed
    	demo.moveBackUpForAutoDemo($('.EqtnTable_DT2'));
  		demo.moveBackUpForAutoDemo($('#CircleValues_DT2'));
  		demo.moveBackUpForAutoDemo($('#UnitCircleAndGraphCanvas_DT2'));
    });
    
    $("#segNum").change(function(){
		currSeg = parseInt($('#segNum').val());
		demo.setCurrSeg(currSeg);
		
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
	});
 
})