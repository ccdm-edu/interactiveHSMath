'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	// turn off advice on frequency created
	$('#ExplnFreqMark').css("visibility", "hidden");
	
	//if Next  button hit (in base template), set it up to go to intro page
	$("#GoToNextPage").wrap('<a href="../DynamicTrig2"></a>');
	$("#GoToPreviousPage").wrap('<a href="../StaticTrig"></a>');
	
	// user can only pick expert/newbie mode on the first home page
	let newbieMode = sessionStorage.getItem('UserIsNew');
	if (newbieMode && (newbieMode.toLowerCase() === "true")) {
		// emphasize the auto demo as first place
		$("#startAutoDemo").addClass('newbieMode');
		$("#FirstHelp_DT1").addClass('newbieMode');
	} else if (newbieMode && (newbieMode.toLowerCase() === 'false')) {
		// remind user what to do 
		$("#FirstHelp_DT1").addClass('expertMode');
	} else {
		// user somehow got here without going through landing page or deleted sessionStorage, put in newbie mode
		$("#startAutoDemo").addClass('newbieMode');
		$("#FirstHelp_DT1").addClass('newbieMode');
	}
	
	let ctxUnitCircle;
	let circleDotsCanvas =  $("#AmpSinCosCircle_DT1").get(0);  // later on, this will set the "background image" for animation
	// get ready to start drawing on this canvas, first get the context
	if ( $("#AmpSinCosCircle_DT1").length ) {
    	ctxUnitCircle = $("#AmpSinCosCircle_DT1").get(0).getContext('2d');
	} else {
    	console.error('Cannot obtain Sin/Cos unit circle context, DynamicTrig1.js ctxUnitCircle');
	}
	let sineAxisBkgd;
	
	const FIRST_USER_BOX_POP_HELP = "1. Click the yellow dot with red arrow labeled Start Here.  Then follow the red arrows as they appear. GO FAST!";
	const SECOND_USER_BOX_POP_HELP = "2. Do it again, but this time skip half the dots.  The red arrows will lead you.  GO FAST!";	
	const THIRD_USER_BOX_POP_HELP = "3. Another try, but this time skip most of the dots.  The red arrows will lead you.  GO FAST!";
	const FOURTH_USER_BOX_POP_HELP = "4. Final try.  The red arrows will lead you.  GO FAST!";
	const FIFTH_USER_BOX_POP_HELP = "5. On your own.  Click start and at least one other point before end point";
	
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
    	console.error('Cannot obtain Sin/Cos unit circle context, ctxFreqPlot in DynamicTrig1.js');
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
	const BEGIN_END_TEXT = "Start/End";
	const END_TEXT = "End Here";
	const TIMER_LOC_X = 110;
	const TIMER_LOC_Y = 20;
	function showUserPeriod(latestPeriod){
		ctxUnitCircle.beginPath();
		ctxUnitCircle.lineWidth = 2.0
		ctxUnitCircle.strokeStyle = SHOW_FREQ_COLOR;
		// put circle up at numeric count down timer
	    ctxUnitCircle.arc(TIMER_LOC_X, TIMER_LOC_Y, 18, 0, Math.PI * 2, true); 
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
	
    function updateContextSensHelp(numFreq) {
		if ((numFreq == 0) && (ptsClickedOnCircle == 0)) {
			// user is wandering around aimlessly trying to figure out how to get started.  Start them
			// generating the slowest frequency, clicking on all dots
			// Once they start clicking on yellow dots, they dont need this help anymore
			$('#FirstHelp_DT1').text(FIRST_USER_BOX_POP_HELP);
			$('#FirstHelp_DT1').css("visibility", "visible");
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
		}
		else if ((numFreq == 1) && (ptsClickedOnCircle == 0)) {
			// user has done 1st slow freq.  Show them it can be done faster.
			// Once they start clicking on yellow dots, they dont need this help anymore
			$('#FirstHelp_DT1').text(SECOND_USER_BOX_POP_HELP);
			$('#FirstHelp_DT1').css("visibility", "visible");
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
		}
		else if ((numFreq == 2) && (ptsClickedOnCircle == 0)) {
			// user has done two freq.  Show them it can be done faster.
			// Once they start clicking on yellow dots, they dont need this help anymore
			$("#FirstHelp_DT1").text(THIRD_USER_BOX_POP_HELP);
			$('#FirstHelp_DT1').css("visibility", "visible");
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
		}
		else if ((numFreq == 3) && (ptsClickedOnCircle == 0)) {
			// user has done three freq.  Show them it can be done faster.
			// Once they start clicking on yellow dots, they dont need this help anymore
			$("#FirstHelp_DT1").text(FOURTH_USER_BOX_POP_HELP);
			$('#FirstHelp_DT1').css("visibility", "visible");
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_TEXT, 2).draw();
		}
		else if ((numFreq == 4) && (ptsClickedOnCircle == 0)) {
			// user has done four freq.  Show them it can be done faster.
			// Once they start clicking on yellow dots, they dont need this help anymore
			$("#FirstHelp_DT1").text(FIFTH_USER_BOX_POP_HELP);
			$('#FirstHelp_DT1').css("visibility", "visible");
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_END_TEXT, 2).draw();
		}
		else {
			$('#FirstHelp_DT1').css("visibility", "hidden");
		}
		if (numFreq > 4) {
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_END_TEXT, 2).draw();
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
	// newest freq are navy (000080) and cornflower blue (6495ED) fading to pale blue for older frequencies
	//const FREQ_COLORS = ["#89CFF0", "#6495ED", "#000080"];
	const FREQ_COLORS = ["#B0E0E6", "#6495ED", "#000080"];
	Object.freeze(FREQ_COLORS);
	const LATEST_FREQ_TEXT = "   <- Most Recent";
	const EARLIEST_FREQ_TEXT = "   <- Least Recent";
	
	//********************************************************
	//*** start the timer and stop it on expiration or if user hits 360 degrees of phase
	let stopTimerNow = false;  // a request
	function startFreqMeas(){
        timerStarted = true;  // a state
        countTime =0;
        $('#UserNotices_DT1').text('');
        startInterval = setInterval(function(){
			$('#ClearOldFreq_DT1').prop('disabled', true);
    		countTime++;
    		$('#timeVal_DT1').text(roundFP(countTime * 0.1, 1)); 
    		if (accumPhase == 360) {
				$('#theta_DT1').text("0\u00B0 or 360\u00B0" ); // add degree symbol	
			}
			else {
				$('#theta_DT1').text(String(accumPhase) + '\u00B0'); // add degree symbol
			}
    		if ( (countTime/10 == EXPIRATION_TIME_SEC) || (stopTimerNow) ) {
    			//After EXPIRATION_TIME_SEC sec, end the experiment, first clear eventLoop
        		if (startInterval) clearInterval(startInterval);
        		timerStarted = false;
        		accumPhase = 0;
        		lastIndexClicked = 0;
        		$('#ClearOldFreq_DT1').prop('disabled', false);
        		if (accumPhase == 360) {
					$('#theta_DT1').text("0\u00B0 or 360\u00B0" ); // add degree symbol	
				}
				else {
					$('#theta_DT1').text(String(accumPhase) + '\u00B0'); // add degree symbol
				}
    			// get rid of time value 
    			$('#timeVal_DT1').text('0');
    			prepHelpForUser(numFreqGenSoFar);  // this needs to be before stopTimeNow set to false
        		stopTimerNow = false;  // Time's up or user stopped timer, either way, reset for next use
        		if (countTime/10 == EXPIRATION_TIME_SEC) {
					// Get users attention and explain situation so they can fix it next time out       		
		        	$('#expiremodal').find('.item').first().addClass('active');
				    $('#expiremodal').modal({
				    	backdrop: 'static',
			    		keyboard: false
				    });	 
			    }
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
        		$('#ExplnFreqMark').css("visibility", "visible");
        		if (lastFreq == 0) {
        			$('#UserNotices_DT1').text('Nice work, lets try another one');
        		} else {
        			let hzDiff = roundFP((currFreq - lastFreq), 3);
        			if (hzDiff > 0) {
        				$('#UserNotices_DT1').text('This time your frequency was higher by ' + hzDiff + ' Hertz (Hz)');
        			} else {
        				$('#UserNotices_DT1').text('This time your frequency was lower by ' + (-hzDiff) + ' Hertz (Hz)');
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
	const RADIUS_VECTOR_COLOR = "green"  // needs to not be black so it shows up against axis
    circleDotsCanvas.addEventListener('click', (e) => {	
    	//user is active, get rid of help until they are done
    	$('#FirstHelp_DT1').css("visibility", "hidden");
    	// now the timer has started, collect phase
    	// need to convert canvas coord into bitmap coord
		let rect = circleDotsCanvas.getBoundingClientRect();
		let pos;
		if (e instanceof CustomEvent) {
			// user is running automated demo
			pos = {
				x: e.detail.xVal,
				y: e.detail.yVal
			}
		}
		else if (e instanceof PointerEvent) {
			// user clicked on the circle
			pos = {
			  x: e.clientX - rect.left,
			  y: e.clientY - rect.top
			};	
		} 
		else if (e instanceof MouseEvent) {
			// DELETE THIS CODE when Safari and Firefox fix their bug (over 2 yrs old) referred to here
			// https://stackoverflow.com/questions/70626381/why-chrome-emits-pointerevents-and-firefox-mouseevents-and-which-type-definition
			pos = {
			  x: e.clientX - rect.left,
			  y: e.clientY - rect.top
			};			
		} else { console.error('ERROR:  unexpected event: ' + e);}
		Object.freeze(pos);
		let ind = 0;
		littleDotCenter.forEach(dot => {
			// not sure yet which dot the user clicked on, must search all
			if (isInside(pos, dot, DOT_RADIUS)) {
				if (timerStarted) { // force user to hit the 0 phase point first to start accumulation of phase
					// we found the dot the user clicked on, 
					if (ind > lastIndexClicked){
						// either we are incrementing CCW from last point clicked
						accumPhase = roundFP(accumPhase + (ind - lastIndexClicked) * ANGLE_PER_PT_DEG, 1);
						lastIndexClicked = ind;
								
						//clear any old drawings before we put up the new stuff, take it back to the background image
						ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
				  		// create line from center to dot (only done on selection)
				  		ctxUnitCircle.beginPath();
						ctxUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
						ctxUnitCircle.lineTo(dot.x, dot.y);
						ctxUnitCircle.strokeStyle = RADIUS_VECTOR_COLOR;
						ctxUnitCircle.fillStyle = RADIUS_VECTOR_COLOR;
						ctxUnitCircle.lineWidth = 3.0; // needs to show up against the axis
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
						} else if (numFreqGenSoFar == 3) {
							// point user to click on every fourth yellow dot
							if (4*ptsClickedOnCircle >= TOTAL_NUM_DOTS) {
								// should never get to be more than TOTAL_NUM_DOTS...
								new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,END_TEXT, 2).draw();
							} else {
								new Arrow(ctxUnitCircle, ARROW_HELPERS[4*ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
							}						
						} else {
							// user is just clicking at least two samples/cycle and needs to know where to end
							new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_END_TEXT, 2).draw();
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
						ctxUnitCircle.strokeStyle = RADIUS_VECTOR_COLOR;
						ctxUnitCircle.fillStyle = RADIUS_VECTOR_COLOR;
						ctxUnitCircle.lineWidth = 3.0;  // needs to show up against the axis
						ctxUnitCircle.stroke();
						ctxUnitCircle.closePath();
						updateContextSensHelp(numFreqGenSoFar);  // update context sensitive help for user
					
					}
				} else {
					if (0 == ind) {
						// User has hit 0 phase start point.  Start the timer and the user help arrows
						if (!timerStarted) {
							startFreqMeas();
	        			}
	        			accumPhase = 0; // user just started
						lastIndexClicked = ind;
								
						//clear any old drawings before we put up the new stuff, take it back to the background image
						ctxUnitCircle.putImageData(backgroundPlot, 0, 0);

						// update the user help for the first two tries to generate a freq
						ptsClickedOnCircle++;
						if (numFreqGenSoFar == 0){
							// user might mess up, give them the opportunity to start over
							$('#StartOver_DT1').css("visibility", "visible");
							// point user to click on every yellow dot
							new Arrow(ctxUnitCircle, ARROW_HELPERS[ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
						} else if (numFreqGenSoFar == 1) {
							// point user to click on every other yellow dot
							new Arrow(ctxUnitCircle, ARROW_HELPERS[2*ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();				
						} else if (numFreqGenSoFar == 2) {
							// point user to click on every third yellow dot
							new Arrow(ctxUnitCircle, ARROW_HELPERS[3*ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();		
						} else if (numFreqGenSoFar == 3) {
							// point user to click on every fourth yellow dot
							new Arrow(ctxUnitCircle, ARROW_HELPERS[4*ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();					
						} else {
							// user is just clicking at least two samples/cycle and needs to know where to end
							new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR,BEGIN_END_TEXT, 2).draw();
						}	
        			}
        		}		
			}
			ind = ind + 1;
		});	
	});
		
	//********************************************************
	// this function used when user hits clear or start over
	function clearPage(wipeGraphs = true) {
		// if the clock is running, stop it
		// go back to bare plots 
		ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		if (wipeGraphs) {
			// wipe out all old freq from graphs
			freqMeasured = [];
			$('#LastFrequencies_DT1').text('');
		} else {
			// redraw the old freq for the demo mode
			drawPlots();
		}
		ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
		$('#timeVal_DT1').text('0');
		$('#theta_DT1').text('0' + '\u00B0');
		$('#UserNotices_DT1').text('');
		// initial condition
		new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_TEXT, 2).draw();
		if (timerStarted) stopTimerNow = true;  // in case timer is running, stop it
	}
	
	//********************************************************
    //*** user clicks the Clear button
    $('#ClearOldFreq_DT1').on('click', function(event) {
		clearPage();
    });

	//********************************************************    
    //*** user wants to start over with the handholding help that first directs them to hit 
    // every dot (getting a lower freq) then every other dot (getting a higher freq) then do it your
    // way and max out freq.
    // This method is called if user hits clear, start over buttons or if the demo is running and hits stop midsegment.
    // in the latter case, this could get called more than once if the timer is running and needs to be stopped.
    function prepHelpForUser(segment = 0) {
    	if (0 == segment) {
    		// user is starting over from very beginning
        	$('#StartOver_DT1').css("visibility", "hidden");
        	clearPage();
        	lastFreq = 0;  // used for user messages on performance, forget all frequencies generated before
        } else {
        	// we are in the middle of a demo and we want to go back to specific context sens help and 
        	// keep graphs off to right
        	clearPage(false);
        }
    	numFreqGenSoFar = segment;  // segment in demo is how many freq one has generated
		ptsClickedOnCircle = 0;
		// chances are first help is obsolete now.. get rid of old and update with new value
		$('#FirstHelp_DT1').css("visibility", "hidden");
		updateContextSensHelp(segment);
    }

    $('#StartOver_DT1').on('click', function(event) {
		prepHelpForUser(); // always start over from 0 for user button
    }); 
    
    
    //********************************************************
	// create a "script" for the auto-demo tutorial, by now, all variables should be set
	//********************************************************	
	const SCRIPT_AUTO_DEMO = [
	{ segmentName: "First frequency",
	  headStartForAudioMillisec: 16000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'DynamicTrig1Seg0'}
			},
			// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
			{segmentActivity: "ANNOTATION",
			 segmentParams: 
			 	{circleCenter: {x: TIMER_LOC_X, y: TIMER_LOC_Y, radius: 22}, 
			 	 color: "red",
			 	 waitTimeMillisec: 20000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[0], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[1], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[2], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[3], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[4], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[5], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[6], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[7], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[8], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[9], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[10], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[11], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[0], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
	  ]
	},
	{ segmentName: "Double the speed",
	  headStartForAudioMillisec: 20000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'DynamicTrig1Seg1'}
			},
			// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[0], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[2], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[4], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[6], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[8], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[10], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[0], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},

	  ]
	},
	  { segmentName: "Faster still",
	  headStartForAudioMillisec: 16000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'DynamicTrig1Seg2'}
			},
			// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[0], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[3], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[6], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[9], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[0], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},

	  ]
	},
	  { segmentName: "Fastest Of All",
	  headStartForAudioMillisec: 10000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'DynamicTrig1Seg3'}
			},
			// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[0], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[4], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[8], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: littleDotCenter[0], 
			 	 canvas: circleDotsCanvas,
			 	 waitTimeMillisec: 1000}
			},

	  ]
	}
	];
	

    //****************************************************************************
    // User initiates autoDemo activity
    //****************************************************************************   
	//*** user clicks the start demo image, iniitalize everything
	let demo = new AutoDemoWithCanvas(SCRIPT_AUTO_DEMO, 'funTutorial_DT1');  // give the demo the full script
    $('#startAutoDemo').on('click', function(event) {
		// clear out any previous user activity
		prepHelpForUser();
		// prep the controls for user to interact with auto demo 
		demo.prepDemoControls();
  		// mover header out of controls area
  		demo.moveToRightForAutoDemo($('#headerAndCtl_DT1')); 
  		demo.moveDownForAutoDemo($('#CircleValues_DT1'));
  		demo.moveDownForAutoDemo($('#UnitCircleAndGraphCanvas'));
  		demo.moveDownForAutoDemo($('#FirstHelp_DT1'));
    });
   
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************

	// User has selected play
    $('#playSegment').on('click', function(){	
    	// user may have chosen a segment out of order
    	prepHelpForUser(demo.getCurrSeg()); 
    	demo.startDemo();

    });
    
    $('#stopSegment').on('click', function(){	
    	demo.stopThisSegment(false);  //we don't want to destroy controls box
    	// stop the timer request
    	stopTimerNow = true;
    	// need to get the help set up for correct segment we think we are on
    	prepHelpForUser(demo.getCurrSeg()); 
    	
    });
    
    $('#dismissAutoDemo').on('click', function(){	
    	// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen
    	demo.stopThisSegment();  // may or may not be needed
    	// stop the timer request
    	stopTimerNow = true;		
  		// move header and canvas back where it was
  		demo.moveToLeftForAutoDemo($('#headerAndCtl_DT1'));
  		demo.moveBackUpForAutoDemo($('#CircleValues_DT1'));
  		demo.moveBackUpForAutoDemo($('#UnitCircleAndGraphCanvas'));
  		demo.moveBackUpForAutoDemo($('#FirstHelp_DT1'));

    });
    
 	$("#segNum").change(function(){
		let currSeg = parseInt($('#segNum').val());
		demo.setCurrSeg(currSeg);
		
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay');
	});
})