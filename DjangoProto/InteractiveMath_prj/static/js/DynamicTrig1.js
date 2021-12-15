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
	
	const STATIC_FILE_LOC = "../../static/json/";
	const urlInitValJson = STATIC_FILE_LOC + "DynamicTrig1Config.json";
	let dynamicTrig1Expln;
	let dynamicTrig1ToDo;
		
	
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
	// User Interaction:  Start counting time and collecting phase
	//********************************************************
	let countTime;
	let lastFreq = 0;  // used for user messages on performance
	let timerStarted = false;
	let startInterval;
	const EXPIRATION_TIME_SEC = 20
	// keep track of the last MAX_FREQ frequencies produce by the user
	let freqMeasured = [];
	const MAX_FREQ = 4;
	// want oldest frequencies to be redish newest to be blueish
	const FREQ_COLORS = ["red", "orange", "green", "blue"];
	const LATEST_FREQ_TEXT = "   <- Latest";


    $('#StartPhaseAccum_DT1').on('click', function(event) {
        if (!timerStarted) {
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
	        		$('#UserNotices_DT1').text('Time expired for accumulating 360 degrees of phase.  As you click yellow dots going around counter clock wise, dont forget to hit 360 degrees as your last point.');
	        	}
	        	if (accumPhase >= 360) {
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
	        			if (frInd == freqMeasured.length - 1) {
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
	        				$('#UserNotices_DT1').text('This time you had a higher freq by ' + perDiff + '%');
	        			} else {
	        				$('#UserNotices_DT1').text('This time you had a lower freq by ' + (-perDiff) + '%');
	        			}
	        		}
	        		lastFreq = currFreq;
	        		// do everything else first
	        		$('#StartPhaseAccum_DT1').prop('disabled', false);
	        		accumPhase = 0;        		
	        	}
	    	}           
            , 100);
        }
    });

	let lastIndexClicked = 0;
	let accumPhase = 0;
	const ANGLE_PER_PT_DEG = ANGLE_PER_PT_RAD * 180 / Math.PI;
    circleDotsCanvas.addEventListener('click', (e) => {
    	// collecting phase doesn't "count" till timer is counting
    	if (timerStarted) {
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
				// we found the dot the user clicked on
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
		}
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