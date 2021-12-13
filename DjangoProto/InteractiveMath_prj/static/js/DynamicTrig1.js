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

    let ANGLE_PER_PT = Math.PI/6;
    for (let pt = 0; pt < 2.0 * Math.PI/ANGLE_PER_PT; pt++) {
    	let curr_angle = pt * ANGLE_PER_PT;
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
    //********************************************************
	// User Interaction:  Start counting time and collecting phase
	//********************************************************
	let countTime;
	let timerStarted = false;
	let startInterval;
	let totalPhase;

    $('#StartPhaseAccum_DT1').on('click', function(event) {
        if (!timerStarted) {
            timerStarted = true;
            countTime =0;
            totalPhase = 0;
            $(this).prop('disabled', true);
            $('#UserNotices_DT1').text('');
            startInterval = setInterval(function(){
	    		countTime++;
	    		$('#timeVal_DT1').text(roundFP(countTime * 0.1, 1)); 
	    		if (countTime == 100) {
	    			//After 10 sec, end the experiment
	        		if (startInterval) clearInterval(startInterval);
	        		$('#StartPhaseAccum_DT1').prop('disabled', false);
	        		timerStarted = false;
	        		$('#UserNotices_DT1').text('Time expired for accumulating 360 degrees of phase.  Try again');
	        	}
	        	if (totalPhase >= 360) {
	        		if (startInterval) clearInterval(startInterval);
	        		timerStarted = false;
	        		$('#UserNotices_DT1').text('');
	        		// do everything else first
	        		$('#StartPhaseAccum_DT1').prop('disabled', false);
	        	}
	    	}           
            , 100);
        }

    });
    console.log(littleDotCenter);
    circleDotsCanvas.addEventListener('click', (e) => {
    	// need to convert canvas coord into bitmap coord
		var rect = circleDotsCanvas.getBoundingClientRect();
		const pos = {
		  x: e.clientX - rect.left,
		  y: e.clientY - rect.top
		};	
		console.log(' clicked at point (' + pos.x + ',' + pos.y + ')');
		let ind = 0;
		littleDotCenter.forEach(dot => {
			// not sure yet which dot the user clicked on, must search all\
			ind = ind + 1;
			console.log('checking the ' + ind + ' point');
			if (isInside(pos, dot, DOT_RADIUS)) {
				console.log(' you clicked the ' + ind + ' point');
			}
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