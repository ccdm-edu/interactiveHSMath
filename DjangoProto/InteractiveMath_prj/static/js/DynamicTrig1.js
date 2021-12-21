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
		
	
	//********************************************************
	// Start drawing the "unit circle" with all touch sensitive angle-dots around it
	//********************************************************	
	const HALF_AXIS = CIRC_RAD + AXIS_OVERLAP;
	drawTrigCircle(ctxUnitCircle, HALF_AXIS);
	
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

    const ANGLE_PER_PT_RAD = Math.PI/6;
    for (let pt = 0; pt < 2.0 * Math.PI/ANGLE_PER_PT_RAD; pt++) {
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
	//********************************************************
	let ctxFreqPlot;
	let freqCanvas =  $("#FreqChange_DT1").get(0);  // later on, this will set the "background image" for animation
	// get ready to start drawing on this canvas, first get the context
	if ( $("#FreqChange_DT1").length ) {
    	ctxFreqPlot = $("#FreqChange_DT1").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Sin/Cos unit circle context');
	}	
	// draw sin axis off to right and a little above
	const SIN_Y_ORIGIN = 200;
	const TRIG_X_ORIGIN = 60;
	const TRIG_AXIS = 420; 
	const MAX_AMP_AXIS = CIRC_RAD + 10;  
	ctxFreqPlot.beginPath();
	// make x axis
	ctxFreqPlot.moveTo(TRIG_X_ORIGIN - TRIG_AXIS/8, SIN_Y_ORIGIN);
	ctxFreqPlot.lineTo(TRIG_X_ORIGIN + TRIG_AXIS, SIN_Y_ORIGIN);
	ctxFreqPlot.fillStyle = 'black';
	ctxFreqPlot.font = '15px Arial';
	ctxFreqPlot.fillText("t (sec)", TRIG_X_ORIGIN + TRIG_AXIS - 30 , SIN_Y_ORIGIN + 30);	
	// draw y axis
	ctxFreqPlot.moveTo(TRIG_X_ORIGIN, SIN_Y_ORIGIN + MAX_AMP_AXIS);
	ctxFreqPlot.lineTo(TRIG_X_ORIGIN, SIN_Y_ORIGIN - MAX_AMP_AXIS);
	ctxFreqPlot.fillStyle = 'black';
	ctxFreqPlot.font = '20px Arial';
	ctxFreqPlot.fillText("S=sin(2\u03c0 f t)", 10, SIN_Y_ORIGIN - MAX_AMP_AXIS - 10);
	ctxFreqPlot.stroke();
	ctxFreqPlot.closePath();
	// make arrows for Angle-Sin graph
	leftArrow(ctxFreqPlot, TRIG_X_ORIGIN - TRIG_AXIS/8, SIN_Y_ORIGIN);
	rightArrow(ctxFreqPlot, TRIG_X_ORIGIN + TRIG_AXIS, SIN_Y_ORIGIN);
	upArrow(ctxFreqPlot, TRIG_X_ORIGIN, SIN_Y_ORIGIN - MAX_AMP_AXIS);
	downArrow(ctxFreqPlot, TRIG_X_ORIGIN, SIN_Y_ORIGIN + MAX_AMP_AXIS);  
	
	// draw y axis tick marks for other amplitudes, we will do 0.1 ticks up to 1,
	// graphs to get
	const SHORT_TICK_LEN = 5
	for(var i=1; i<= 10; i++){ 
		ctxFreqPlot.beginPath();
		// y axis sin
		ctxFreqPlot.moveTo(TRIG_X_ORIGIN - SHORT_TICK_LEN, SIN_Y_ORIGIN - 0.1 * i * CIRC_RAD);
		ctxFreqPlot.lineTo(TRIG_X_ORIGIN + SHORT_TICK_LEN, SIN_Y_ORIGIN - 0.1 * i * CIRC_RAD);
		ctxFreqPlot.stroke();
	}
	// label 0.5 and 1.0 on each y sin and y cos axis
	ctxFreqPlot.font = '10px Arial';
	// y sin axis ticks
	ctxFreqPlot.fillText("0.5", TRIG_X_ORIGIN - 20, SIN_Y_ORIGIN - 0.1 * 5 * CIRC_RAD);	
	ctxFreqPlot.fillText("1.0", TRIG_X_ORIGIN - 20, SIN_Y_ORIGIN - 0.1 * 10 * CIRC_RAD);
	
	// x sine axis time ticks
	const PIX_PER_SEC = 17;
	for(var i=1; i<= EXPIRATION_TIME_SEC; i++){ 
		ctxFreqPlot.beginPath();
		// y axis sin
		let xLoc = TRIG_X_ORIGIN + i * PIX_PER_SEC;
		ctxFreqPlot.moveTo(xLoc, SIN_Y_ORIGIN );
		if (i%5 == 0) {
			// major axis tick
			ctxFreqPlot.lineTo(xLoc, SIN_Y_ORIGIN + 2 * SHORT_TICK_LEN);
			ctxFreqPlot.fillText(String(i), xLoc - 2, SIN_Y_ORIGIN + 2 * SHORT_TICK_LEN + 5);
		} else {
			// minor axis tick
			ctxFreqPlot.lineTo(xLoc, SIN_Y_ORIGIN + SHORT_TICK_LEN);
		}			
		ctxFreqPlot.stroke();
	}
	sineAxisBkgd = ctxFreqPlot.getImageData(0, 0, freqCanvas.width, freqCanvas.height);
	

	//********************************************************
	// Update graph to show what user has done
	//********************************************************
	function drawPlots() {
		// go back to bare plots before we redo everything
		ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		// plot all freq the user has produced (up to max num saved)
		for (var plotInd = 0; plotInd < freqMeasured.length; plotInd++) {	
			ctxFreqPlot.beginPath();
			let minColorInd = MAX_FREQ - freqMeasured.length;
			let colorInd = minColorInd + plotInd;		
			ctxFreqPlot.strokeStyle = FREQ_COLORS[colorInd];
			var currFreq = freqMeasured[plotInd];
			let T = 1/currFreq;
			let dashSegPix = Math.round(1 + 2*T/20);
			function calcSine(j) {
				// j is the time in sec
				return Math.round(CIRC_RAD*Math.sin(2* Math.PI * j * currFreq));
			}
			// loop every 1/2 sec
			let timeInc = roundFP((0.5*T/20),3);
			console.log('Freq is ' + currFreq + 'time inc is ' + timeInc + 'dashSegPix is ' + dashSegPix);
			for(var i=0; i<EXPIRATION_TIME_SEC; i+= timeInc){ 
		    	var yLo = calcSine(i); 
		    	var yHi = calcSine(i + dashSegPix/PIX_PER_SEC);
		    	// remember, on bitmap, y increases as you go from top to bottom
		  		ctxFreqPlot.moveTo(TRIG_X_ORIGIN + i* PIX_PER_SEC, SIN_Y_ORIGIN - yLo); 
		  		// make a dash seg and then skip and redo again.  
		    	ctxFreqPlot.lineTo(TRIG_X_ORIGIN + i* PIX_PER_SEC + dashSegPix, SIN_Y_ORIGIN - yHi); 
				ctxFreqPlot.stroke(); 
		  	}

		}
	}
	

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
	const MAX_FREQ = 4;
	// want oldest frequencies to be redish newest to be blueish
	const FREQ_COLORS = ["red", "orange", "green", "blue"];
	const LATEST_FREQ_TEXT = "   <- Most Recent";
	const EARLIEST_FREQ_TEXT = "   <- Least Recent";



	// start the timer and stop it on expiration or if user hits 360 degrees of phase
	function startFreqMeas(){
        timerStarted = true;
        countTime =0;
        $(this).prop('disabled', true);
        $('#UserNotices_DT1').text('');
        startInterval = setInterval(function(){
    		countTime++;
    		$('#timeVal_DT1').text(roundFP(countTime * 0.1, 1)); 
    		$('#theta_DT1').text(String(accumPhase));
    		if (countTime/10 == EXPIRATION_TIME_SEC) {
    			//After EXPIRATION_TIME_SEC sec, end the experiment
        		if (startInterval) clearInterval(startInterval);
        		$('#StartPhaseAccum_DT1').prop('disabled', false);
        		timerStarted = false;
        		accumPhase = 0;
        		lastIndexClicked = 0;
        		$('#theta_DT1').text(String(accumPhase));
        		$('#UserNotices_DT1').text('Time expired for accumulating 360 degrees of phase.  As you click yellow dots going around counter clock wise, dont forget to hit 360 degrees as your last point.');
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
        			$('#UserNotices_DT1').text('Nice work, lets try another one');
        		} else {
        			let perDiff = roundFP((currFreq - lastFreq) * 100 / lastFreq, 1);
        			if (perDiff > 0) {
        				$('#UserNotices_DT1').text('This time your frequency was higher by ' + perDiff + '%');
        			} else {
        				$('#UserNotices_DT1').text('This time your frequency was lower by ' + (-perDiff) + '%');
        			}
        		}
        		lastFreq = currFreq;
        		// do everything else first
        		$('#StartPhaseAccum_DT1').prop('disabled', false);
        		accumPhase = 0;   
        		drawPlots();		
        	}
    	}, 100);	
	}

    $('#StartPhaseAccum_DT1').on('click', function(event) {
        if (!timerStarted) {
			startFreqMeas();
        }
    });

	const ANGLE_PER_PT_DEG = ANGLE_PER_PT_RAD * 180 / Math.PI;
    circleDotsCanvas.addEventListener('click', (e) => {	
    	// now the timer has started, collect phase
    	// need to convert canvas coord into bitmap coord
		var rect = circleDotsCanvas.getBoundingClientRect();
		const pos = {
		  x: e.clientX - rect.left,
		  y: e.clientY - rect.top
		};	
		let ind = 0;
		littleDotCenter.forEach(dot => {
			// not sure yet which dot the user clicked on, must search all
			if (isInside(pos, dot, DOT_RADIUS)) {
				if (ind > lastIndexClicked) {
					accumPhase = roundFP(accumPhase + (ind - lastIndexClicked) * ANGLE_PER_PT_DEG, 1);
					lastIndexClicked = ind;
				} else if (ind == 0 && lastIndexClicked !=0) {
					accumPhase = 360;
					// all done, reset to start again
					lastIndexClicked = 0;
				}
				// we found the dot the user clicked on, if timer not on, turn it on
				if (!timerStarted) {
					startFreqMeas();
        		}	
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
			ind = ind + 1;
		});	
	});
    
	// User can choose a TO DO set for the text box or an explanation, this code is the implementation
	$('#ToDo_or_expln_DT1').on('click', function(event){
		if ("Explain" == $("#ToDo_or_expln_DT1").prop("value")) {
			// currently showing the Try This text.  Move into explanation text
			$("#LongTextBox_DT1").text(dynamicTrig1Expln);
			$("#ToDo_or_expln_DT1").prop("value", "Try This");
		} else {
			// currently showing the Explanation text, move into TO DO  text
			$("#LongTextBox_DT1").text(dynamicTrig1ToDo);
			$("#ToDo_or_expln_DT1").prop("value", "Explain");
		}
    });   

})