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
	
	const FIRST_USER_BOX_POP_HELP = "Click the yellow dot with red arrow labeled Start Here.  Then follow the red arrows as they appear. GO FAST!";
	const SECOND_USER_BOX_POP_HELP = "Do it again, but this time skip half the dots.  The red arrows will lead you.  GO FAST!";	
	const THIRD_USER_BOX_POP_HELP = "Another try, but this time skip most of the dots.  The red arrows will lead you.  GO FAST!";
	const FOURTH_USER_BOX_POP_HELP = "Start at any dot OTHER THAN end point, move counter clockwise, skip as many as you want, end at red arrow";
	
	const EXPIRATION_TIME_SEC = 30
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
	const POINT_TO_TIME = 
	{	tip1: [101, 47],
		tip2: [115, 47],
		point: [110,39],
		end: [101,95]
	};
	let numFreqGenSoFar = 0;
	const ANGLE_PER_PT_RAD = Math.PI/6;
	const TOTAL_NUM_DOTS = 2.0 * Math.PI/ANGLE_PER_PT_RAD;
	let ptsClickedOnCircle = 0;  // when user starts clicking, help changes
			
	//********************************************************
	// Start drawing the "unit circle" with all touch sensitive angle-dots around it
	//********************************************************	
	const HALF_AXIS = CIRC_RAD + AXIS_OVERLAP;
	const CIRC_X0 = 210;
	const CIRC_Y0 = 330;   // use this to raise and lower the whole circle, remember y increases going down the page
	drawTrigCircle(ctxUnitCircle, CIRC_X0, CIRC_Y0, HALF_AXIS);
	
	//*** Draw the big unit circle which is fixed radius
	// need to ensure the points here can never be negative, else they get clipped
	ctxUnitCircle.beginPath();
	// draw main circle
	ctxUnitCircle.lineWidth = 1.0
	ctxUnitCircle.strokeStyle = "black";
    ctxUnitCircle.arc(CIRC_X0, CIRC_Y0, CIRC_RAD, 0, Math.PI * 2, true); 
    ctxUnitCircle.stroke();
    
    //*** angle in rad, draw small yellow circles that user can click on to accumulate phase
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
	const PIX_PER_MINOR_TICK = 13;
	const MAX_AMP_AXIS = CIRC_RAD + 10;

	// draw sin axis off to right and a little above
	const UPPER_Y_ORIGIN = 180;
	const UPPER_X_ORIGIN = 60;
	const LOWER_Y_ORIGIN = 500;
	const LOWER_X_ORIGIN = 60;
	const NUM_MAJOR_TICK = EXPIRATION_TIME_SEC/5; // Its hardcoded in IntMathUtils 5 minor ticks per major tick
	drawSineAxis(ctxFreqPlot, UPPER_X_ORIGIN, UPPER_Y_ORIGIN, EXPIRATION_TIME_SEC, PIX_PER_MINOR_TICK, NUM_MAJOR_TICK);
	drawSineAxis(ctxFreqPlot, LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPIRATION_TIME_SEC/10, PIX_PER_MINOR_TICK, NUM_MAJOR_TICK);
	//*****************
	// draw lines inbetween plots to show lower plot is expanded time of upper plot
	let startPt = {start:[UPPER_X_ORIGIN,UPPER_Y_ORIGIN], stop:[LOWER_X_ORIGIN, LOWER_Y_ORIGIN - MAX_AMP_AXIS - 10]};
	const NUM_MINOR_TICKS = EXPIRATION_TIME_SEC/10;  // lower plot is 1/10 of upper plot duration
	let endPt = {start:[UPPER_X_ORIGIN + NUM_MINOR_TICKS*PIX_PER_MINOR_TICK, UPPER_Y_ORIGIN], stop: [LOWER_X_ORIGIN  + EXPIRATION_TIME_SEC*PIX_PER_MINOR_TICK, LOWER_Y_ORIGIN]};
	drawExpansionLines(ctxFreqPlot, startPt, endPt,NUM_MINOR_TICKS.toString() + " sec expanded");
	
	//*** Now it looks good, snapshot this so we can go back after drawing temporary things on it
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
			
			// a minor tick represents 1 sec
			const TOT_PIX_X_AXIS = PIX_PER_MINOR_TICK * EXPIRATION_TIME_SEC;
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
	const SHOW_FREQ_COLOR = "DarkOrchid";
	const NEXT_PT_COLOR = "red";
	const NEXT_PT_TXT = "Click Here";
	const BEGIN_TEXT = "Start Here";
	const END_TEXT = "End Here";
	function showUserPeriod(latestPeriod){
		ctxUnitCircle.beginPath();
		ctxUnitCircle.lineWidth = 2.0
		ctxUnitCircle.strokeStyle = SHOW_FREQ_COLOR;
		// put circle up at numeric count down timer
	    ctxUnitCircle.arc(110, 20, 18, 0, Math.PI * 2, true); 
	    ctxUnitCircle.stroke();
	    new Arrow(ctxUnitCircle, POINT_TO_TIME, SHOW_FREQ_COLOR,"", 2).draw();
	    
		let arrow_to_graph_time;
		// decide whether to put circle on upper or lower plot
		if (latestPeriod > EXPIRATION_TIME_SEC/10){
			// draw on upper graph, its a low freq signal
			let xcoord = Math.round(UPPER_X_ORIGIN + latestPeriod*PIX_PER_MINOR_TICK);
			ctxFreqPlot.beginPath();
			ctxFreqPlot.lineWidth = 2.0
			ctxFreqPlot.strokeStyle = SHOW_FREQ_COLOR;
			let point_y = UPPER_Y_ORIGIN;
			ctxFreqPlot.arc(xcoord, UPPER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
			ctxFreqPlot.stroke();
			arrow_to_graph_time = {
				tip1: [xcoord - 20, point_y + 5],
				tip2: [xcoord - 20, point_y + 25],
				point: [xcoord - 15, point_y + 15],
				end: [8,221]
			}
		} else {
			// draw on lower graph, its a high freq signal
			let xcoord = Math.round(LOWER_X_ORIGIN  + 10*latestPeriod*PIX_PER_MINOR_TICK);
			ctxFreqPlot.beginPath();
			ctxFreqPlot.lineWidth = 2.0
			ctxFreqPlot.strokeStyle = SHOW_FREQ_COLOR;
			let point_y = LOWER_Y_ORIGIN
			ctxFreqPlot.arc(xcoord, LOWER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
			ctxFreqPlot.stroke();
			arrow_to_graph_time = {
				tip1: [xcoord - 15, point_y - 25],
				tip2: [xcoord - 23, point_y - 12],
				point: [xcoord - 15, point_y - 15],
				end: [8,221]
			}
		}
		// plot arrow to the place on x axis that is period
		new Arrow(ctxFreqPlot, arrow_to_graph_time, SHOW_FREQ_COLOR,"", 2).draw();
		
		// go back to defaults
		ctxUnitCircle.strokeStyle = "black";
		ctxFreqPlot.strokeStyle = "black";
	}
    //********************************************************
	// Initial User Assistance: First direct user to create slow frequency and 
	// later direct them to create second faster frequency. After that, they are on their own.
	// Cant use "mousemove"/hover as that concept is lost on tablets
	//********************************************************
	// initial condition
	new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
	$('#FirstHelp_DT1').text(FIRST_USER_BOX_POP_HELP);
	
    function updateContextSensHelp() {
    console.log("numFreq = " + numFreqGenSoFar + "ptsClickedOnCircle = " +ptsClickedOnCircle);
		if ((numFreqGenSoFar == 0) && (ptsClickedOnCircle == 0)) {
			// user is wandering around aimlessly trying to figure out how to get started.  Start them
			// generating the slowest frequency, clicking on all dots
			// Once they start clicking on yellow dots, they dont need this help anymore
			$('#FirstHelp_DT1').text(FIRST_USER_BOX_POP_HELP);
			$('#FirstHelp_DT1').css("visibility", "visible");
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
		}
		else if ((numFreqGenSoFar == 1) && (ptsClickedOnCircle == 0)) {
			// user has done 1st slow freq.  Show them it can be done faster.
			// Once they start clicking on yellow dots, they dont need this help anymore
			$('#FirstHelp_DT1').text(SECOND_USER_BOX_POP_HELP);
			$('#FirstHelp_DT1').css("visibility", "visible");
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
		}
		else if ((numFreqGenSoFar == 2) && (ptsClickedOnCircle == 0)) {
			// user has done two freq.  Show them it can be done faster.
			// Once they start clicking on yellow dots, they dont need this help anymore
			$("#FirstHelp_DT1").text(THIRD_USER_BOX_POP_HELP);
			$('#FirstHelp_DT1').css("visibility", "visible");
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
		}
		else if ((numFreqGenSoFar == 3) && (ptsClickedOnCircle == 0)) {
			// user has done three freq.  Show them it can be done faster.
			// Once they start clicking on yellow dots, they dont need this help anymore
			$('#FirstHelp_DT1').css("visibility", "visible");
			$("#FirstHelp_DT1").text(FOURTH_USER_BOX_POP_HELP);
		}
		else {
			$('#FirstHelp_DT1').css("visibility", "hidden");
		}
		if (numFreqGenSoFar >= 3) {
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,END_TEXT, 2).draw();
		}
	};

    //********************************************************
	// User Interaction clicking yellow dots:  Start counting time and collecting phase
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
	const FREQ_CIRCLE_EXPLN = "<p id='ExplnFreqMark' style='color:" + SHOW_FREQ_COLOR + "'>Look at the two circles.  They both reflect the time it took you to <br>accumulate 360 degrees of phase.  This is the period (T) of the waveform.  <br>The frequency of the waveform is 1/T.  Pull out your calculator and confirm!</p>";
	
	//********************************************************
	//*** start the timer and stop it on expiration or if user hits 360 degrees of phase
	let stopTimerNow = false;
	function startFreqMeas(){
        timerStarted = true;
        countTime =0;
        $('#UserNotices_DT1').text('');
        startInterval = setInterval(function(){
			$('#ClearOldFreq_DT1').prop('disabled', true);
    		countTime++;
    		$('#timeVal_DT1').text(roundFP(countTime * 0.1, 1)); 
    		$('#theta_DT1').text(String(accumPhase));
    		if ( (countTime/10 == EXPIRATION_TIME_SEC) || (stopTimerNow) ) {
    			//After EXPIRATION_TIME_SEC sec, end the experiment
        		if (startInterval) clearInterval(startInterval);
        		timerStarted = false;
        		accumPhase = 0;
        		lastIndexClicked = 0;
        		$('#ClearOldFreq_DT1').prop('disabled', false);
        		$('#theta_DT1').text(String(accumPhase));
    			// get rid of time value 
    			$('#timeVal_DT1').text('');
    			startOverContextSensHelp();  // this needs to be before stopTimeNow set to false
        		stopTimerNow = false;  // Time's up or user stopped timer, either way, reset for next use
        		//******************
				// Get users attention and explain situation so they can fix it next time out       		
	        	$('#expiremodal').find('.item').first().addClass('active');
			    $('#expiremodal').modal({
			    	backdrop: 'static',
		    		keyboard: false
			    });	 
        	}
        	if (accumPhase >= 360) {
        		// then this frequency sampling is done, show results to user
        		if (startInterval) clearInterval(startInterval);
        		timerStarted = false;
        		// minColorInd keeps track of where we start in freq color range
        		let minColorInd = 0;
        		// Only save so many old freq, if hit the max, delete the oldest to add the newest
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
        			$('#UserNotices_DT1').html('Nice work, lets try another one' + FREQ_CIRCLE_EXPLN);
        		} else {
        			let hzDiff = roundFP((currFreq - lastFreq), 3);
        			if (hzDiff > 0) {
        				$('#UserNotices_DT1').html('This time your frequency was higher by ' + hzDiff + ' Hertz (Hz)' + FREQ_CIRCLE_EXPLN);
        			} else {
        				$('#UserNotices_DT1').html('This time your frequency was lower by ' + (-hzDiff) + ' Hertz (Hz)' + FREQ_CIRCLE_EXPLN);
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
    
    //********************************************************
	//*** user clicks a yellow dot
	const ANGLE_PER_PT_DEG = ANGLE_PER_PT_RAD * 180 / Math.PI;
    circleDotsCanvas.addEventListener('click', (e) => {	
    	//user is active, get rid of help until they are done
    	$('#FirstHelp_DT1').css("visibility", "hidden");
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
						// user might mess up, give them the opportunity to start over
						$('#StartOver_DT1').css("visibility", "visible");
						// point user to click on every yellow dot
						if (ptsClickedOnCircle >= TOTAL_NUM_DOTS) {
							// should never get to be more than TOTAL_NUM_DOTS...
							new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,END_TEXT, 2).draw();
						} else {
							new Arrow(ctxUnitCircle, ARROW_HELPERS[ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
						}
					} else if (numFreqGenSoFar == 1) {
						// point user to click on every other yellow dot
						if (2*ptsClickedOnCircle >= TOTAL_NUM_DOTS) {
							// should never get to be more than TOTAL_NUM_DOTS...
							new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,END_TEXT, 2).draw();
						} else {
							new Arrow(ctxUnitCircle, ARROW_HELPERS[2*ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
						}
					} else if (numFreqGenSoFar == 2) {
						// point user to click on every third yellow dot
						if (3*ptsClickedOnCircle >= TOTAL_NUM_DOTS) {
							// should never get to be more than TOTAL_NUM_DOTS...
							new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,END_TEXT, 2).draw();
						} else {
							new Arrow(ctxUnitCircle, ARROW_HELPERS[3*ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
						}
					} else {
						// user is just clicking at least two samples/cycle and needs to know where to end
						new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,END_TEXT, 2).draw();
					}
										
				} else if (ind == 0 && lastIndexClicked !=0) {
					// user clicked last point used to generate this freq.  User is done with this frequency
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
					updateContextSensHelp();  // update context sensitive help for user
				
				}		
				// if timer not on, turn it on
				if (!timerStarted) {
					startFreqMeas();
        		}	
			}
			ind = ind + 1;
		});	
	});
		
	//********************************************************
	// this function used when user hits clear or start over
	function clearPage() {
		// if the clock is running, stop it
		// go back to bare plots and no freq
		ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
		freqMeasured = [];
		$('#LastFrequencies_DT1').text('');
		$('#UserNotices_DT1').text('');
		stopTimerNow = true;  // in case timer is running, stop it
	}
	
	//********************************************************
    //*** user clicks the Clear button
    $('#ClearOldFreq_DT1').on('click', function(event) {
		clearPage();
    });

	//********************************************************    
    //*** user wants to start over with the handholding help that first directs them to hit 
    // every dot (getting a lower freq) then every other dot (getting a higher freq) then do it your
    // way and max out freq
    function startOverContextSensHelp() {
        $('#StartOver_DT1').css("visibility", "hidden");
    	clearPage();
    	numFreqGenSoFar = 0;
		ptsClickedOnCircle = 0;
		// chances are first help is obsolete now.. start over
		$('#FirstHelp_DT1').css("visibility", "hidden");
		// initial condition
		new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
		updateContextSensHelp();
    }
    $('#StartOver_DT1').on('click', function(event) {
		startOverContextSensHelp();
    }); 
    
    //********************************************************
	//*** User can choose a TO DO set for the text box or an explanation, this code is the implementation
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
    $('#TryThis_help_DT1').css("visibility", "hidden");  
    let dynamicTrig1ToDo_text = $("#TryThis_help_DT1").text();
    $("#LongTextBox_DT1").text(dynamicTrig1ToDo_text);
    $("#Explain_help_DT1").css("visibility", "hidden");
    let dynamicTrig1Expln_text = $("#Explain_help_DT1").text();
    
 	//***********************************
 	// Javascript for advanced popup window that is draggable and has expln/todo stuff
 	
    $("#AdvancedTopics").draggable();  // allows any part of window to be dragged
	$(".tabs").click(function(){
	    
	    $(".tabs").removeClass("active");
	    $(".tabs h6").removeClass("font-weight-bold");    
	    $(".tabs h6").addClass("text-muted");    
	    $(this).children("h6").removeClass("text-muted");
	    $(this).children("h6").addClass("font-weight-bold");
	    $(this).addClass("active");
	
	    let current_fs = $(".active");
		// create ID number of new fieldset
	    let next_fs = $(this).attr('id');
	    next_fs = "#" + next_fs + "1";
		// unshow all fieldsets and show the new one
	    $("fieldset").removeClass("show");
	    $(next_fs).addClass("show");
    
	});   
 

})