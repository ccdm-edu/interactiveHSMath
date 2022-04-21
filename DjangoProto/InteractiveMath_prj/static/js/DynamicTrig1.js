'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	let ctxUnitCircle;
	let circleDotsCanvas =  $("#AmpSinCosCircle_DT1").get(0);  // later on, this will set the "background image" for animation
	// get ready to start drawing on this canvas, first get the context
	if ( $("#AmpSinCosCircle_DT1").length ) {
    	ctxUnitCircle = $("#AmpSinCosCircle_DT1").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Sin/Cos unit circle context');
	}
	let sineAxisBkgd;
	
	const STATIC_FILE_LOC = "../../static/json/";
	const urlInitValJson = STATIC_FILE_LOC + "DynamicTrig1Config.json";
	let dynamicTrig1Expln;
	let dynamicTrig1ToDo;
	
	const EXPIRATION_TIME_SEC = 20
	// When user first enters page, they need to know what dots to hit to create desired
	// effect, slow frequency that increases through these arrows that prompt the user
	// Each set represents one of the dots, starting at 0/360 phase, next set is 30 degrees, etc
	// the elements of the set tell the arrow drawing function where to put the lines
	const ARROW_HELPERS = [
	// 0:  0 degrees
	{	tip1: [345, 338],
		tip2: [338, 345],
		point: [338,338],
		end: [350,350]
	},
	// 1:  30 degrees
	{	tip1: [328, 264],
		tip2: [322, 258],
		point: [322,264],
		end: [335,255]
	},
	// 2:  60 degrees
	{	tip1: [282, 216],
		tip2: [276, 210],
		point: [276,216],
		end: [285,205]
	},
	// 3:  90 degrees
	{	tip1: [225,202],
		tip2: [218,195],
		point: [219,201],
		end: [228,192]
	},
	// 4:  120 degrees
	{	tip1: [136,218],
		tip2: [145,209],
		point: [144,217],
		end: [134,204]
	},
	// 5:  150 degrees
	{	tip1: [87,266],
		tip2: [92,255],
		point: [97,263],
		end: [81,253]
	},
	// 6:  180 degrees
	{	tip1: [84,315],
		tip2: [78,321],
		point: [84,322],
		end: [72,310]
	},
	// 7:  210 degrees
	{	tip1: [90,391],
		tip2: [95,401],
		point: [98,394],
		end: [84,403]
	},
	// 8:  240 degrees
	{	tip1: [137,440],
		tip2: [146,449],
		point: [145,441],
		end: [135,452]
	},
	// 9:  270 degrees
	{	tip1: [197,455],
		tip2: [203,461],
		point: [202,455],
		end: [193,467]
	},
	// 10:  300 degrees
	{	tip1: [272,449],
		tip2: [283,442],
		point: [276,441],
		end: [287,453]
	},	
	// 11:  330 degrees
	{	tip1: [323,403],
		tip2: [328,389],
		point: [322,394],
		end: [336,403]
	},	
	 ];
	let numFreqGenSoFar = 0;
	const ANGLE_PER_PT_RAD = Math.PI/6;
	const TOTAL_NUM_DOTS = 2.0 * Math.PI/ANGLE_PER_PT_RAD;
	let ptsClickedOnCircle = 0;
			
	//********************************************************
	// Start drawing the "unit circle" with all touch sensitive angle-dots around it
	//********************************************************	
	const HALF_AXIS = CIRC_RAD + AXIS_OVERLAP;
	const CIRC_X0 = 210;
	const CIRC_Y0 = 330;   // use this to raise and lower the whole circle, remember y increases going down the page
	drawTrigCircle(ctxUnitCircle, CIRC_X0, CIRC_Y0, HALF_AXIS);
	
	//Draw the big unit circle which could be expanded/contracted based on user input
	// need to ensure the points here can never be negative, else they get clipped
	ctxUnitCircle.beginPath();
	// draw main circle
	ctxUnitCircle.lineWidth = 1.0
	ctxUnitCircle.strokeStyle = "black";
    ctxUnitCircle.arc(CIRC_X0, CIRC_Y0, CIRC_RAD, 0, Math.PI * 2, true); 
    ctxUnitCircle.stroke();
    
    // angle in rad, draw small yellow circles that user can click on to accumulate phase
    let littleDotCenter = [];
    for (let pt = 0; pt < TOTAL_NUM_DOTS; pt++) {
    	let curr_angle = pt * ANGLE_PER_PT_RAD;
    	let x = CIRC_X0 + Math.round(CIRC_RAD*Math.cos(curr_angle));
		let y = CIRC_Y0 - Math.round(CIRC_RAD*Math.sin(curr_angle));
		littleDotCenter.push({x: x, y: y});
    	ctxUnitCircle.beginPath();
		// create dots for user clickable phase accumulation
		ctxUnitCircle.arc(x, y, DOT_RADIUS, 0, 2 * Math.PI, true);
		ctxUnitCircle.fillStyle = 'yellow';
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
	let freqCanvas =  $("#FreqChange_DT1").get(0);  // later on, this will set the "background image" for animation
	// get ready to start drawing on this canvas, first get the context
	if ( $("#FreqChange_DT1").length ) {
    	ctxFreqPlot = $("#FreqChange_DT1").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Sin/Cos unit circle context');
	}	
	const PIX_PER_MINOR_TICK = 17;
	const MAX_AMP_AXIS = CIRC_RAD + 10;
	function drawSineAxis(xOrigin, yOrigin, maxTime) {
		const TRIG_AXIS = 420;   
		ctxFreqPlot.beginPath();
		// make x axis
		ctxFreqPlot.moveTo(xOrigin - TRIG_AXIS/8, yOrigin);
		ctxFreqPlot.lineTo(xOrigin + TRIG_AXIS, yOrigin);
		ctxFreqPlot.fillStyle = 'black';
		ctxFreqPlot.font = '15px Arial';
		ctxFreqPlot.fillText("t (sec)", xOrigin + TRIG_AXIS - 30 , yOrigin + 30);
		ctxFreqPlot.stroke()	
		// draw y axis
		ctxFreqPlot.beginPath();
		ctxFreqPlot.moveTo(xOrigin, yOrigin + MAX_AMP_AXIS);
		ctxFreqPlot.lineTo(xOrigin, yOrigin - MAX_AMP_AXIS);
		ctxFreqPlot.fillStyle = 'black';
		ctxFreqPlot.font = '20px Arial';
		ctxFreqPlot.fillText("S=sin(2\u03c0 f t)", 10, yOrigin - MAX_AMP_AXIS - 10);
		ctxFreqPlot.stroke();
		// make arrows for Angle-Sin graph
		leftArrow(ctxFreqPlot, xOrigin - TRIG_AXIS/8, yOrigin);
		rightArrow(ctxFreqPlot, xOrigin + TRIG_AXIS, yOrigin);
		upArrow(ctxFreqPlot, xOrigin, yOrigin - MAX_AMP_AXIS);
		downArrow(ctxFreqPlot, xOrigin, yOrigin + MAX_AMP_AXIS);  
		
		// draw y axis tick marks for other amplitudes, we will do 0.1 ticks up to 1,
		const SHORT_TICK_LEN = 5
		for(let i=1; i<= 10; i++){ 
			ctxFreqPlot.beginPath();
			// y axis sin
			ctxFreqPlot.moveTo(xOrigin - SHORT_TICK_LEN, yOrigin - 0.1 * i * CIRC_RAD);
			ctxFreqPlot.lineTo(xOrigin + SHORT_TICK_LEN, yOrigin - 0.1 * i * CIRC_RAD);
			ctxFreqPlot.stroke();
		}
		// label 0.5 and 1.0 on each y sin and y cos axis
		ctxFreqPlot.font = '10px Arial';
		// y sin axis ticks
		ctxFreqPlot.fillText("0.5", xOrigin - 20, yOrigin - 0.1 * 5 * CIRC_RAD);	
		ctxFreqPlot.fillText("1.0", xOrigin - 20, yOrigin - 0.1 * 10 * CIRC_RAD);
		
		// x sine axis time ticks
		for(let i=1; i<= 20; i++){ 
			ctxFreqPlot.beginPath();
			// y axis sin
			let xLoc = xOrigin + i * PIX_PER_MINOR_TICK;
			ctxFreqPlot.moveTo(xLoc, yOrigin );
			if (i%5 == 0) {
				// major axis tick
				ctxFreqPlot.lineTo(xLoc, yOrigin + 2 * SHORT_TICK_LEN);
				// time is now i*maxTime/20
				ctxFreqPlot.fillText(String(i*maxTime/20), xLoc - 2, yOrigin + 2 * SHORT_TICK_LEN + 5);
			} else {
				// minor axis tick
				ctxFreqPlot.lineTo(xLoc, yOrigin + SHORT_TICK_LEN);
			}			
			ctxFreqPlot.stroke();
		}
	}
	// draw sin axis off to right and a little above
	const UPPER_Y_ORIGIN = 180;
	const UPPER_X_ORIGIN = 60;
	const LOWER_Y_ORIGIN = 500;
	const LOWER_X_ORIGIN = 60;
	drawSineAxis(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, EXPIRATION_TIME_SEC);
	drawSineAxis(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPIRATION_TIME_SEC/10);
	//*****************
	// draw lines inbetween plots to show lower plot is expanded time of upper plot
	ctxFreqPlot.beginPath();
	ctxFreqPlot.moveTo(UPPER_X_ORIGIN, UPPER_Y_ORIGIN);
	ctxFreqPlot.lineTo(LOWER_X_ORIGIN, LOWER_Y_ORIGIN - MAX_AMP_AXIS - 10);
	ctxFreqPlot.setLineDash([5, 10])
	ctxFreqPlot.strokeStyle = 'red';
	ctxFreqPlot.fillStyle = 'red';
	ctxFreqPlot.font = '15px Arial';
	ctxFreqPlot.fillText("2 sec expanded", UPPER_X_ORIGIN + 10, UPPER_Y_ORIGIN + MAX_AMP_AXIS + 20);
	ctxFreqPlot.stroke();
	ctxFreqPlot.beginPath();
	ctxFreqPlot.moveTo(UPPER_X_ORIGIN + 2*PIX_PER_MINOR_TICK, UPPER_Y_ORIGIN);
	ctxFreqPlot.lineTo(LOWER_X_ORIGIN  + 20*PIX_PER_MINOR_TICK, LOWER_Y_ORIGIN);
	ctxFreqPlot.stroke();
	// go back to background color
	ctxFreqPlot.strokeStyle = 'black';
	ctxFreqPlot.fillStyle = 'black';
	ctxFreqPlot.setLineDash([])
	//*****************
	sineAxisBkgd = ctxFreqPlot.getImageData(0, 0, freqCanvas.width, freqCanvas.height);
	
	//********************************************************
	// Update graph to show what user has done in both lower and upper plot
	//********************************************************
	function drawOnePlot(x_orig, y_orig, maxTimePlot){
		for (let plotInd = 0; plotInd < freqMeasured.length; plotInd++) {	
			let minColorInd = MAX_FREQ - freqMeasured.length;
			let colorInd = minColorInd + plotInd;		
			ctxFreqPlot.strokeStyle = FREQ_COLORS[colorInd];
			let currFreq = freqMeasured[plotInd];
			let T = 1/currFreq;
			
			function calcSine(j) {
				// j is the time in sec
				return Math.round(CIRC_RAD*Math.sin(2* Math.PI * j * currFreq));
			}
			
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
	}
	function drawPlots() {
		// go back to bare plots before we redo everything
		ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		drawOnePlot(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, EXPIRATION_TIME_SEC);
		drawOnePlot(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPIRATION_TIME_SEC/10);
	}
	//********************************************************
	// Add temporary circles and verbiage to show user their new period/freq
	//********************************************************
	function showUserPeriod(latestPeriod){
		ctxUnitCircle.beginPath();
		ctxUnitCircle.lineWidth = 2.0
		ctxUnitCircle.strokeStyle = "lime";
	    ctxUnitCircle.arc(110, 20, 18, 0, Math.PI * 2, true); 
	    ctxUnitCircle.stroke();
	    
		// decide whether to put arrow on upper or lower plot
		if (latestPeriod > EXPIRATION_TIME_SEC/10){
			// draw on upper graph, its a low freq signal
			let xcoord = Math.round(UPPER_X_ORIGIN + latestPeriod*PIX_PER_MINOR_TICK);
			ctxFreqPlot.beginPath();
			ctxFreqPlot.lineWidth = 2.0
			ctxFreqPlot.strokeStyle = "lime";
			ctxFreqPlot.arc(xcoord, UPPER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
			ctxFreqPlot.stroke();
		} else {
			// draw on lower graph, its a high freq signal
			let xcoord = Math.round(LOWER_X_ORIGIN  + 10*latestPeriod*PIX_PER_MINOR_TICK);
			ctxFreqPlot.beginPath();
			ctxFreqPlot.lineWidth = 2.0
			ctxFreqPlot.strokeStyle = "lime";
			ctxFreqPlot.arc(xcoord, LOWER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
			ctxFreqPlot.stroke();
		}
		// go back to defaults
		ctxUnitCircle.strokeStyle = "black";
		ctxFreqPlot.strokeStyle = "black";
	}
    //********************************************************
	// Initial User Assistance: First direct user to create slow frequency and 
	// later direct them to create second faster frequency. After that, they are on their own.
	//********************************************************
    circleDotsCanvas.addEventListener("mousemove", (e) => {
		if ((numFreqGenSoFar == 0) && (ptsClickedOnCircle == 0)) {
			// user is wandering around aimlessly trying to figure out how to get started.  Start them
			// generating the slowest frequency, clicking on all dots
			// Once they start clicking on yellow dots, they dont need this help anymore
			$('#FirstHelp_DT1').css("visibility", "visible");
			arbArrow(ctxUnitCircle, ARROW_HELPERS[0], "Start here");
		}
		else if ((numFreqGenSoFar == 1) && (ptsClickedOnCircle == 0)) {
			// user has done 1st slow freq.  Show them it can be done faster.
			// Once they start clicking on yellow dots, they dont need this help anymore
			$('#FirstHelp_DT1').css("visibility", "visible");
			arbArrow(ctxUnitCircle, ARROW_HELPERS[0], "Start here");
		}
		else {
			$('#FirstHelp_DT1').css("visibility", "hidden");
		}
		
	});

    //********************************************************
	// User Interaction:  Start counting time and collecting phase
	//********************************************************
	let countTime;
	let lastFreq = 0;  // used for user messages on performance
	let timerStarted = false;
	let startInterval;
	let lastIndexClicked = 0;
	let accumPhase = 0;
	// keep track of the last MAX_FREQ frequencies produce by the user
	let freqMeasured = [];
	const MAX_FREQ = 3;
	// newest freq are dark blue and fading to pale blue for older frequencies
	const FREQ_COLORS = ["#89CFF0", "#6495ED", "#000080"];
	Object.freeze(FREQ_COLORS);
	const LATEST_FREQ_TEXT = "   <- Most Recent";
	const EARLIEST_FREQ_TEXT = "   <- Least Recent";
	const GREEN_CIRCLE_EXPLN = "<p id='ExplnFreqMark'>Look at the two green circles.  They both reflect the time it took you to <br>accumulate 360 degrees of phase.  This is the period (T) of the waveform.  <br>The frequency of the waveform is 1/T.  Pull out your calculator and confirm!</p>";
	// start the timer and stop it on expiration or if user hits 360 degrees of phase
	function startFreqMeas(){
        timerStarted = true;
        countTime =0;
        $('#UserNotices_DT1').text('');
        startInterval = setInterval(function(){
			$('#ClearOldFreq_DT1').prop('disabled', true);
    		countTime++;
    		$('#timeVal_DT1').text(roundFP(countTime * 0.1, 1)); 
    		$('#theta_DT1').text(String(accumPhase));
    		if (countTime/10 == EXPIRATION_TIME_SEC) {
    			//After EXPIRATION_TIME_SEC sec, end the experiment
        		if (startInterval) clearInterval(startInterval);
        		timerStarted = false;
        		accumPhase = 0;
        		lastIndexClicked = 0;
        		$('#ClearOldFreq_DT1').prop('disabled', false);
        		$('#theta_DT1').text(String(accumPhase));
        		$('#UserNotices_DT1').html('Time expired for accumulating 360 degrees of phase.  <br>As you click yellow dots going around counter clock wise, <br>dont forget to hit 360 degrees as your last point.');
        	}
        	if (accumPhase >= 360) {
        		// then this frequency sampling is done, show results to user
        		if (startInterval) clearInterval(startInterval);
        		timerStarted = false;
        		// minColorInd keeps track of where we start in freq color range
        		let minColorInd = 0;
        		if (freqMeasured.length == MAX_FREQ){
        			// kill first element
        			freqMeasured.shift();
        		} 
        		// add new element
        		let currFreq = 10/countTime;
        		freqMeasured.push(roundFP(currFreq, 4));
        		minColorInd = MAX_FREQ - freqMeasured.length;
        		//print out all freq with oldest as light color, latest as dark color
        		let freqText = '';
        		for (let frInd = 0; frInd < freqMeasured.length; frInd++) {
        			let colorInd = minColorInd + frInd;
	       			if ((frInd == 0) && (freqMeasured.length > 1)) {
	        				freqText = freqText.concat('<font color="' + FREQ_COLORS[colorInd] + '">' + freqMeasured[frInd] + EARLIEST_FREQ_TEXT + '<br>' +'</font>');
	        		} else if (frInd == freqMeasured.length - 1) {
        				freqText = freqText.concat('<font color="' + FREQ_COLORS[colorInd] + '">' + freqMeasured[frInd] + LATEST_FREQ_TEXT + '<br>' +'</font>');
        			} else {
        				freqText = freqText.concat('<font color="' + FREQ_COLORS[colorInd] + '">' + freqMeasured[frInd] + '<br>' +'</font>');
        			}	        			
        		}
        		$('#LastFrequencies_DT1').html(freqText);
        		// give user feedback on their performance
        		if (lastFreq == 0) {
        			$('#UserNotices_DT1').html('Nice work, lets try another one' + GREEN_CIRCLE_EXPLN);
        		} else {
        			let perDiff = roundFP((currFreq - lastFreq) * 100 / lastFreq, 1);
        			if (perDiff > 0) {
        				$('#UserNotices_DT1').html('This time your frequency was higher by ' + perDiff + '%' + GREEN_CIRCLE_EXPLN);
        			} else {
        				$('#UserNotices_DT1').html('This time your frequency was lower by ' + (-perDiff) + '%' + GREEN_CIRCLE_EXPLN);
        			}
        		}
        		lastFreq = currFreq;
        		// do everything else first
        		$('#ClearOldFreq_DT1').prop('disabled', false);
        		accumPhase = 0;   
        		drawPlots();
        		showUserPeriod(countTime/10);		// puts up indicators at time/graph and explanation
        	}
    	}, 100);	
	}
    
    $('#ClearOldFreq_DT1').on('click', function(event) {
		// go back to bare plots and no freq
		ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
		freqMeasured = [];
		$('#LastFrequencies_DT1').text('');
		$('#UserNotices_DT1').text('');
    });

	const ANGLE_PER_PT_DEG = ANGLE_PER_PT_RAD * 180 / Math.PI;
    circleDotsCanvas.addEventListener('click', (e) => {	
    	// now the timer has started, collect phase
    	// need to convert canvas coord into bitmap coord
		let rect = circleDotsCanvas.getBoundingClientRect();
		const pos = {
		  x: e.clientX - rect.left,
		  y: e.clientY - rect.top
		};	
		Object.freeze(pos);
		let ind = 0;
		littleDotCenter.forEach(dot => {
			// not sure yet which dot the user clicked on, must search all
			if (isInside(pos, dot, DOT_RADIUS)) {
				// we found the dot the user clicked on, 
				if ( (ind > lastIndexClicked) || ((ind == 0) && (lastIndexClicked == 0)) ){
					// either we are incrementing CCW from last point clicked or we are on 1st pt
					accumPhase = roundFP(accumPhase + (ind - lastIndexClicked) * ANGLE_PER_PT_DEG, 1);
					lastIndexClicked = ind;
							
					//clear any old drawings before we put up the new stuff, take it back to the background image
					ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
			  		// create line from center to dot (only done on selection)
			  		ctxUnitCircle.beginPath();
					ctxUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
					ctxUnitCircle.lineTo(dot.x, dot.y);
					ctxUnitCircle.strokeStyle = 'green';
					ctxUnitCircle.fillStyle = 'green';
					ctxUnitCircle.lineWidth = 3.0
					ctxUnitCircle.stroke();
					ctxUnitCircle.closePath();
					// update the user help for the first two tries to generate a freq
					ptsClickedOnCircle++;
					if (numFreqGenSoFar == 0){
						// point user to click on every yellow dot
						if (ptsClickedOnCircle >= TOTAL_NUM_DOTS) {
							// should never get to be more than TOTAL_NUM_DOTS...
							arbArrow(ctxUnitCircle, ARROW_HELPERS[0], "End here");
						} else {
							arbArrow(ctxUnitCircle, ARROW_HELPERS[ptsClickedOnCircle], "");
						}
					} else if (numFreqGenSoFar == 1) {
						// point user to click on every other yellow dot
						if (2*ptsClickedOnCircle >= TOTAL_NUM_DOTS) {
							// should never get to be more than TOTAL_NUM_DOTS...
							arbArrow(ctxUnitCircle, ARROW_HELPERS[0], "End here");
						} else {
							arbArrow(ctxUnitCircle, ARROW_HELPERS[2*ptsClickedOnCircle], "");
						}
					}		
				
				} else if (ind == 0 && lastIndexClicked !=0) {
					// we are on last point used to generate this freq.  User is done with this frequency
					// do clean up and prep for next freq
					accumPhase = 360;
					// all done, reset to start again
					lastIndexClicked = 0;
					numFreqGenSoFar++;
					ptsClickedOnCircle = 0;  // start over for next frequency set
					
					//clear any old drawings before we put up the new stuff, take it back to the background image
					ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
			  		// create line from center to dot (only done on selection)
			  		ctxUnitCircle.beginPath();
					ctxUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
					ctxUnitCircle.lineTo(dot.x, dot.y);
					ctxUnitCircle.strokeStyle = 'green';
					ctxUnitCircle.fillStyle = 'green';
					ctxUnitCircle.lineWidth = 3.0
					ctxUnitCircle.stroke();
					ctxUnitCircle.closePath();
				
				}		
				// if timer not on, turn it on
				if (!timerStarted) {
					startFreqMeas();
        		}	
			}
			ind = ind + 1;
		});	
	});
    
	// User can choose a TO DO set for the text box or an explanation, this code is the implementation
	$('#ToDo_or_expln_DT1').on('click', function(event){
		if ("Explain" == $("#ToDo_or_expln_DT1").prop("value")) {
			// currently showing the Try This text.  Move into explanation text
			$("#LongTextBox_DT1").text(dynamicTrig1Expln_text);
			$("#ToDo_or_expln_DT1").prop("value", "Try This");
		} else {
			// currently showing the Explanation text, move into TO DO  text
			$("#LongTextBox_DT1").text(dynamicTrig1ToDo_text);
			$("#ToDo_or_expln_DT1").prop("value", "Explain");
		}
    }); 
    //***********************************
	//initialize text TO DO and explanation sections of this page
	//***********************************	
    // dont want this text to just plop up on page, will use as needed
    $('#TryThis_help').css("visibility", "hidden");  
    let dynamicTrig1ToDo_text = $("#TryThis_help").text();
    $("#LongTextBox_DT1").text(dynamicTrig1ToDo_text);
    $("#Explain_help").css("visibility", "hidden");
    let dynamicTrig1Expln_text = $("#Explain_help").text();
    
    


})