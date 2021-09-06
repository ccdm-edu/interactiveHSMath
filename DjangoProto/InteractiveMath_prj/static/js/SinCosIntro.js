'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	let ctxExpandableUnitCircle;
	// draw explanatory lines between the charts
	//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
	if ( $("#AmpSinCosCircle").length ) {
    	ctxExpandableUnitCircle = $("#AmpSinCosCircle").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Sin/Cos unit circle context');
	}
	
	let amp = 1.1;
	const MAX_AMP = 1.1;
	const CIRC_X0 = 210;
	const CIRC_Y0 = 210;
	const CIRC_RAD = 120;
	const AXIS_OVERLAP = 40;
	const HALF_AXIS = (MAX_AMP * CIRC_RAD) + AXIS_OVERLAP;
	const DOT_RADIUS = 5;
	const ANGLE_IND = 30;
	const ARROW_LEN = 10;
	const schoolAngles = [
		// Remember, the pixel axis starts at (0,0) in the upper left corner and grows in y downward and in x to right.
		// Going counter clockwise, angles are still measured as though from x axis going clockwise, so angleRad looks strange
		{
			// 0 degrees
			x: CIRC_X0 + (amp * CIRC_RAD),
			y: CIRC_Y0,
			xcos: (amp * CIRC_RAD),
			ysin: 0,
			angleRad: 0, 
		},
		{
			// 30 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/6)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/6)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/6)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/6)),
			angleRad: 11*Math.PI/6,
		},
		{
			// 45 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/4)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/4)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/4)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/4)),
			angleRad: 7*Math.PI/4,
		},
		{
			// 60 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/3)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/3)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/3)), 
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/3)),
			angleRad: 5*Math.PI/3,
		},
		{
			// 90 degrees
			x: CIRC_X0,
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)),
			xcos: 0,
			ysin: Math.round((amp * CIRC_RAD)),
			angleRad: 3*Math.PI/2,
		},
		{
			// 120 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos((2/3) * Math.PI)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin((2/3) * Math.PI)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos((2/3) * Math.PI)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin((2/3) * Math.PI)),
			angleRad: (4/3) * Math.PI,
		},
		{
			// 135 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(3*Math.PI/4)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(3*Math.PI/4)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(3*Math.PI/4)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(3*Math.PI/4)),
			angleRad: 5*Math.PI/4,
		},
		{
			// 150 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/6)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/6)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/6)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/6)),
			angleRad: 7*Math.PI/6,
		},
		{
			// 180 degrees
			x: CIRC_X0 - Math.round((amp * CIRC_RAD)),
			y: CIRC_Y0,
			xcos:  Math.round((amp * CIRC_RAD)),
			ysin:  0,
			angleRad: Math.PI,
		},
		{
			// 210 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(7*Math.PI/6)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(7*Math.PI/6)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(7*Math.PI/6)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(7*Math.PI/6)),
			angleRad: 5*Math.PI/6,
		},
		{
			// 225 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/4)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/4)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/4)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/4)),
			angleRad: 3*Math.PI/4,
		},
		{
			// 240 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(4*Math.PI/3)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(4*Math.PI/3)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(4*Math.PI/3)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(4*Math.PI/3)),
			angleRad: 2*Math.PI/3,
		},
		{
			// 270 degrees
			x: CIRC_X0,
			y: CIRC_Y0 + Math.round((amp * CIRC_RAD)),
			xcos: 0,
			ysin: Math.round((amp * CIRC_RAD)),
			angleRad: Math.PI/2,
		},
		{
			// 300 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/3)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/3)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/3)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/3)),
			angleRad: Math.PI/3,
		},	
		{
			// 315 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(7*Math.PI/4)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(7*Math.PI/4)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(7*Math.PI/4)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(7*Math.PI/4)),
			angleRad: Math.PI/4,
		},
		{
			// 330 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(11*Math.PI/6)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(11*Math.PI/6)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(11*Math.PI/6)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(11*Math.PI/6)),
			angleRad: Math.PI/6, 
		}
	];
	// need to ensure the points here can never be negative, else they get clipped
	ctxExpandableUnitCircle.beginPath();
	// draw main circle
    ctxExpandableUnitCircle.arc(CIRC_X0, CIRC_Y0, amp*CIRC_RAD, 0, Math.PI * 2, true); 
    ctxExpandableUnitCircle.stroke();

	// draw y axis for circle/angle
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.moveTo(CIRC_X0, CIRC_Y0 - HALF_AXIS);
	ctxExpandableUnitCircle.lineTo(CIRC_X0, CIRC_Y0 + HALF_AXIS);
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("y", CIRC_X0 + 5, CIRC_Y0 - HALF_AXIS + 5);	
	
	// draw x axis for circle/angle
	ctxExpandableUnitCircle.moveTo(CIRC_X0 - HALF_AXIS, CIRC_Y0);
	ctxExpandableUnitCircle.lineTo(CIRC_X0 + HALF_AXIS, CIRC_Y0);
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("x", CIRC_X0 + HALF_AXIS + 5, CIRC_Y0 + 5);	
				
				
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();
	
	schoolAngles.forEach(dot => {
		  ctxExpandableUnitCircle.beginPath();
		  // create dots for user clickable dots
		  ctxExpandableUnitCircle.arc(dot.x, dot.y, DOT_RADIUS, 0, 2 * Math.PI, true);
		  ctxExpandableUnitCircle.fillStyle = 'yellow';
		  ctxExpandableUnitCircle.fill();
		  ctxExpandableUnitCircle.stroke();
		  ctxExpandableUnitCircle.closePath();
		  
	});
	function leftArrow(x, y) {
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.moveTo(x, y);
		ctxExpandableUnitCircle.lineTo(x + ARROW_LEN, y - ARROW_LEN);
		ctxExpandableUnitCircle.moveTo(x, y);
		ctxExpandableUnitCircle.lineTo(x + ARROW_LEN, y + ARROW_LEN);
		ctxExpandableUnitCircle.stroke();
		ctxExpandableUnitCircle.closePath();
	};
	function rightArrow(x, y) {
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.moveTo(x, y);
		ctxExpandableUnitCircle.lineTo(x - ARROW_LEN, y + ARROW_LEN);
		ctxExpandableUnitCircle.moveTo(x, y);
		ctxExpandableUnitCircle.lineTo(x - ARROW_LEN, y - ARROW_LEN);
		ctxExpandableUnitCircle.stroke();
		ctxExpandableUnitCircle.closePath();
	};
	function upArrow(x, y) {
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.moveTo(x, y);	
		ctxExpandableUnitCircle.lineTo(x + ARROW_LEN, y + ARROW_LEN);
		ctxExpandableUnitCircle.moveTo(x, y);
		ctxExpandableUnitCircle.lineTo(x - ARROW_LEN, y + ARROW_LEN);
		ctxExpandableUnitCircle.stroke();
		ctxExpandableUnitCircle.closePath();
	};
	function downArrow(x, y) {
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.moveTo(x, y);	
		ctxExpandableUnitCircle.lineTo(x + ARROW_LEN, y - ARROW_LEN);
		ctxExpandableUnitCircle.moveTo(x, y);
		ctxExpandableUnitCircle.lineTo(x - ARROW_LEN, y - ARROW_LEN);
		ctxExpandableUnitCircle.stroke();
		ctxExpandableUnitCircle.closePath();
	};	
	
	// make arrows for XY axis 
	leftArrow(CIRC_X0 - HALF_AXIS, CIRC_Y0);
	rightArrow(CIRC_X0 + HALF_AXIS, CIRC_Y0);
	upArrow(CIRC_X0, CIRC_Y0 - HALF_AXIS);
	downArrow(CIRC_X0, CIRC_Y0 + HALF_AXIS);

	//****
	// NOW draw the two sin/cos axis off to the right of circle
	//****

	const SIN_Y_CENTER = 175;
	const TRIG_X_CENTER = 550;
	const COS_Y_CENTER = 480;
	const TRIG_AXIS = 350; 
	const MAX_AMP_AXIS = MAX_AMP * CIRC_RAD + 10;  // needs to be at least MAX_AMP*CIRC_RAD to match the circle values
	// draw sin axis off to right and a little above
	// draw x axis
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.moveTo(TRIG_X_CENTER - TRIG_AXIS/8, SIN_Y_CENTER);
	ctxExpandableUnitCircle.lineTo(TRIG_X_CENTER + TRIG_AXIS, SIN_Y_CENTER);
	ctxExpandableUnitCircle.fillStyle = 'black';
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("\u03b8", TRIG_X_CENTER + TRIG_AXIS, SIN_Y_CENTER);	
	// draw y axis
	ctxExpandableUnitCircle.moveTo(TRIG_X_CENTER, SIN_Y_CENTER + MAX_AMP_AXIS);
	ctxExpandableUnitCircle.lineTo(TRIG_X_CENTER, SIN_Y_CENTER - MAX_AMP_AXIS);
	ctxExpandableUnitCircle.fillStyle = 'black';
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("Rsin\u03b8", TRIG_X_CENTER, SIN_Y_CENTER - MAX_AMP_AXIS);
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();
	// make arrows for Angle-Sin graph
	leftArrow(TRIG_X_CENTER - TRIG_AXIS/8, SIN_Y_CENTER);
	rightArrow(TRIG_X_CENTER + TRIG_AXIS, SIN_Y_CENTER);
	upArrow(TRIG_X_CENTER, SIN_Y_CENTER - MAX_AMP_AXIS);
	downArrow(TRIG_X_CENTER, SIN_Y_CENTER + MAX_AMP_AXIS);  
	
	// draw dashed amplitude bar at current point
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.strokeStyle = "blue";
	const FULL_THETA_PIX = TRIG_AXIS - 50;
	const DASH_SEG_PIX = 3;
	function calcSine(j) {
		return Math.round((amp * CIRC_RAD)*Math.sin(2* Math.PI * j/FULL_THETA_PIX));
	}
	for(var i=0; i<FULL_THETA_PIX; i=i+2*DASH_SEG_PIX){ // Loop from left side to create dashed sin curve
    	var yLo = calcSine(i); 
    	var yHi = calcSine(i+DASH_SEG_PIX);
    	// remember, on bitmap, y increases as you go from top to bottom
  		ctxExpandableUnitCircle.moveTo(TRIG_X_CENTER + i, SIN_Y_CENTER - yLo); 
  		// make a dash seg and then skip and redo again.  
    	ctxExpandableUnitCircle.lineTo(TRIG_X_CENTER + i + DASH_SEG_PIX, SIN_Y_CENTER - yHi); 
  	}
	ctxExpandableUnitCircle.stroke(); 

	// draw cos axis off to right and below
	// draw x axis
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.moveTo(TRIG_X_CENTER - TRIG_AXIS/8, COS_Y_CENTER);
	ctxExpandableUnitCircle.lineTo(TRIG_X_CENTER + TRIG_AXIS, COS_Y_CENTER);
	ctxExpandableUnitCircle.fillStyle = 'black';
	ctxExpandableUnitCircle.strokeStyle = "black";
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("\u03b8", TRIG_X_CENTER + TRIG_AXIS, COS_Y_CENTER);	
	// draw y axis
	ctxExpandableUnitCircle.moveTo(TRIG_X_CENTER, COS_Y_CENTER + MAX_AMP_AXIS);
	ctxExpandableUnitCircle.lineTo(TRIG_X_CENTER, COS_Y_CENTER - MAX_AMP_AXIS);
	ctxExpandableUnitCircle.fillStyle = 'black';
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("Rcos\u03b8", TRIG_X_CENTER, COS_Y_CENTER - MAX_AMP_AXIS);	
	
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();	
	
	// make arrows for Angle-Cos graph
	leftArrow(TRIG_X_CENTER - TRIG_AXIS/8, COS_Y_CENTER);
	rightArrow(TRIG_X_CENTER + TRIG_AXIS, COS_Y_CENTER);
	upArrow(TRIG_X_CENTER, COS_Y_CENTER - MAX_AMP_AXIS);
	downArrow(TRIG_X_CENTER, COS_Y_CENTER + MAX_AMP_AXIS); 
	
	// draw dashed amplitude bar at current point
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.strokeStyle = "red";
	function calcCos(j) {
		return Math.round((amp * CIRC_RAD)*Math.cos(2* Math.PI * j/FULL_THETA_PIX));
	}
	for(var i=0; i<FULL_THETA_PIX; i=i+2*DASH_SEG_PIX){ // Loop from left side to create dashed cos curve
    	var yLo = calcCos(i); 
    	var yHi = calcCos(i+DASH_SEG_PIX);
    	// remember, on bitmap, y increases as you go from top to bottom
  		ctxExpandableUnitCircle.moveTo(TRIG_X_CENTER + i, COS_Y_CENTER - yLo); 
  		// make a dash seg and then skip and redo again.  
    	ctxExpandableUnitCircle.lineTo(TRIG_X_CENTER + i + DASH_SEG_PIX, COS_Y_CENTER - yHi); 
  	}
	ctxExpandableUnitCircle.stroke(); 
	
	let circleDotsCanvas =  $("#AmpSinCosCircle").get(0);
	// NOW we have the background image done.  As users click on a point and new stuff happens, we always come back to 
	// this point, so we save it to go back to it when we want to start over
	let backgroundPlot = ctxExpandableUnitCircle.getImageData(0, 0, circleDotsCanvas.width, circleDotsCanvas.height);
	//********************** background is done ***************


	// for grins, bound the canvas
	ctxExpandableUnitCircle.beginPath();
	// can't go into negative bitmap and don't know how to get rid of left margin
	ctxExpandableUnitCircle.rect(0,0, circleDotsCanvas.width, circleDotsCanvas.height);
	ctxExpandableUnitCircle.stroke();
	console.log(" width is " + circleDotsCanvas.width + " height is " + circleDotsCanvas.height);
	
	
	
	function isInside(point, circle, radius) {
		return ((point.x-circle.x) ** 2 + (point.y - circle.y) ** 2) <= (radius) ** 2;
	};

	circleDotsCanvas.addEventListener('click', (e) => {
	
		// need to convert canvas coord into bitmap coord
		var rect = circleDotsCanvas.getBoundingClientRect();
		const pos = {
		  x: e.clientX - rect.left,
		  y: e.clientY - rect.top
		};
		

		let cntr = 0;
		schoolAngles.forEach(dot => {
			// not sure yet which dot the user clicked on, must search all
			let result = (isInside(pos, dot, DOT_RADIUS));
			cntr = cntr + 1;
			if (isInside(pos, dot, DOT_RADIUS)) {
				// we found the dot the user clicked on
		  		//clear any old drawings before we put up the new stuff, take it back to the background image
				ctxExpandableUnitCircle.putImageData(backgroundPlot, 0, 0);
		  		// create line from center to dot (only done on selection)
		  		ctxExpandableUnitCircle.beginPath();
				ctxExpandableUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
				ctxExpandableUnitCircle.lineTo(dot.x, dot.y);
				ctxExpandableUnitCircle.strokeStyle = 'black';
				ctxExpandableUnitCircle.fillStyle = 'black';
				ctxExpandableUnitCircle.font = '20px Arial';
				ctxExpandableUnitCircle.fillText("R", CIRC_X0 + (dot.x - CIRC_X0)/2 - 10, CIRC_Y0 + (dot.y - CIRC_Y0)/2);	
				ctxExpandableUnitCircle.stroke();
				ctxExpandableUnitCircle.closePath();
				
				// create line for cos portions (only done on selection)
				ctxExpandableUnitCircle.beginPath();
				ctxExpandableUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
				ctxExpandableUnitCircle.lineTo(dot.x, CIRC_Y0);
				ctxExpandableUnitCircle.lineWidth = 3.0;
				ctxExpandableUnitCircle.strokeStyle = 'red'; 
				ctxExpandableUnitCircle.fillStyle = 'red';
				ctxExpandableUnitCircle.font = '20px Arial';
				ctxExpandableUnitCircle.fillText("C", CIRC_X0 + (dot.x - CIRC_X0)/2, CIRC_Y0 + 15);	
				ctxExpandableUnitCircle.stroke();
				ctxExpandableUnitCircle.closePath();
				
				// create line for sin portions (only done on selection)
				ctxExpandableUnitCircle.beginPath();
				ctxExpandableUnitCircle.moveTo(dot.x, CIRC_Y0);
				ctxExpandableUnitCircle.lineTo(dot.x, dot.y);
				ctxExpandableUnitCircle.lineWidth = 3.0;
				ctxExpandableUnitCircle.strokeStyle = 'blue';
				ctxExpandableUnitCircle.fillStyle = 'blue';
				ctxExpandableUnitCircle.font = '20px Arial';
				ctxExpandableUnitCircle.fillText("S", dot.x + 3, dot.y + (CIRC_Y0 - dot.y)/2);	
				ctxExpandableUnitCircle.stroke();
				ctxExpandableUnitCircle.closePath();
				
				// create angle indicator
				ctxExpandableUnitCircle.beginPath();
				ctxExpandableUnitCircle.arc(CIRC_X0, CIRC_Y0, ANGLE_IND, 0, dot.angleRad, true); 	
				ctxExpandableUnitCircle.lineWidth = 1.0;
				ctxExpandableUnitCircle.strokeStyle = 'green'; 
				ctxExpandableUnitCircle.fillStyle = 'green';
				ctxExpandableUnitCircle.font = '20px Arial';
				ctxExpandableUnitCircle.fillText("\u03b8", CIRC_X0 + ANGLE_IND, CIRC_Y0 - ANGLE_IND/4);	
				ctxExpandableUnitCircle.stroke();
				ctxExpandableUnitCircle.closePath();	
		    }
		});
	});

  

	
})