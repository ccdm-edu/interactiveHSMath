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
	const CIRC_X0 = 220;
	const CIRC_Y0 = 220;
	const CIRC_RAD = 150;
	const AXIS_OVERLAP = 40;
	const HALF_AXIS = (MAX_AMP * CIRC_RAD) + AXIS_OVERLAP;
	const angleDotRadius = 5;
	const schoolAngles = [
		// remember, the pixel axis starts at (0,0) in the upper left corner and grows in y downward and in x to right
		{
			// 0 degrees
			x: CIRC_X0 + (amp * CIRC_RAD),
			y: CIRC_Y0,
			xcos: (amp * CIRC_RAD),
			ysin: 0,
		},
		{
			// 30 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/6)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/6)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/6)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/6)),
		},
		{
			// 45 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/4)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/4)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/4)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/4)),
		},
		{
			// 60 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/3)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/3)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(Math.PI/3)), 
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(Math.PI/3)),
		},
		{
			// 90 degrees
			x: CIRC_X0,
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)),
			xcos: 0,
			ysin: Math.round((amp * CIRC_RAD)),
		},
		{
			// 120 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos((2/3) * Math.PI)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin((2/3) * Math.PI)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos((2/3) * Math.PI)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin((2/3) * Math.PI))
		},
		{
			// 135 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(3*Math.PI/4)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(3*Math.PI/4)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(3*Math.PI/4)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(3*Math.PI/4)),
		},
		{
			// 150 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/6)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/6)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/6)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/6)),
		},
		{
			// 180 degrees
			x: CIRC_X0 - Math.round((amp * CIRC_RAD)),
			y: CIRC_Y0,
			xcos:  Math.round((amp * CIRC_RAD)),
			ysin:  0
		},
		{
			// 210 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(7*Math.PI/6)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(7*Math.PI/6)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(7*Math.PI/6)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(7*Math.PI/6)),
		},
		{
			// 225 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/4)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/4)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/4)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/4)),
		},
		{
			// 240 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(4*Math.PI/3)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(4*Math.PI/3)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(4*Math.PI/3)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(4*Math.PI/3)),
		},
		{
			// 270 degrees
			x: CIRC_X0,
			y: CIRC_Y0 + Math.round((amp * CIRC_RAD)),
			xcos: 0,
			ysin: Math.round((amp * CIRC_RAD)),
		},
		{
			// 300 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/3)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/3)),
			xcos:  Math.round((amp * CIRC_RAD)*Math.cos(5*Math.PI/3)),
			ysin:  Math.round((amp * CIRC_RAD)*Math.sin(5*Math.PI/3)),
		},	
		{
			// 315 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(7*Math.PI/4)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(7*Math.PI/4)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(7*Math.PI/4)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(7*Math.PI/4)),
		},
		{
			// 330 degrees
			x: CIRC_X0 + Math.round((amp * CIRC_RAD)*Math.cos(11*Math.PI/6)),
			y: CIRC_Y0 - Math.round((amp * CIRC_RAD)*Math.sin(11*Math.PI/6)),
			xcos: Math.round((amp * CIRC_RAD)*Math.cos(11*Math.PI/6)),
			ysin: Math.round((amp * CIRC_RAD)*Math.sin(11*Math.PI/6)),
		}
	];
	// need to ensure the points here can never be negative, else they get clipped
	ctxExpandableUnitCircle.beginPath();
	// draw main circle
    ctxExpandableUnitCircle.arc(CIRC_X0, CIRC_Y0, amp*CIRC_RAD, 0, Math.PI * 2, true); 
    ctxExpandableUnitCircle.stroke();

	// draw x axis
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.moveTo(CIRC_X0, CIRC_Y0 - HALF_AXIS);
	ctxExpandableUnitCircle.lineTo(CIRC_X0, CIRC_Y0 + HALF_AXIS);
	// draw y axis
	ctxExpandableUnitCircle.moveTo(CIRC_X0 - HALF_AXIS, CIRC_Y0);
	ctxExpandableUnitCircle.lineTo(CIRC_X0 + HALF_AXIS, CIRC_Y0);
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();
	
	schoolAngles.forEach(dot => {
		  ctxExpandableUnitCircle.beginPath();
		  // create dots for user clickable dots
		  ctxExpandableUnitCircle.arc(dot.x, dot.y, angleDotRadius, 0, 2 * Math.PI, true);
		  ctxExpandableUnitCircle.fillStyle = 'rgb(255,255,0)';
		  ctxExpandableUnitCircle.fill();
		  ctxExpandableUnitCircle.stroke();
		  ctxExpandableUnitCircle.closePath();
		  
	});
	
	let circleDotsCanvas =  $("#AmpSinCosCircle").get(0);
	// NOW we have the background image done.  As users click on a point and new stuff happens, we always come back to 
	// this point, so we save it to go back to it when we want to start over
	let backgroundPlot = ctxExpandableUnitCircle.getImageData(0, 0, circleDotsCanvas.width, circleDotsCanvas.height);

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
			let result = (isInside(pos, dot, angleDotRadius));
			cntr = cntr + 1;
			if (isInside(pos, dot, angleDotRadius)) {
				// we found the dot the user clicked on
		  		//clear any old drawings before we put up the new stuff, take it back to the background image
				ctxExpandableUnitCircle.putImageData(backgroundPlot, 0, 0);
		  		// create line from center to dot (only done on selection)
		  		ctxExpandableUnitCircle.beginPath();
				ctxExpandableUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
				ctxExpandableUnitCircle.lineTo(dot.x, dot.y);
				ctxExpandableUnitCircle.strokeStyle = 'black';
				ctxExpandableUnitCircle.stroke();
				ctxExpandableUnitCircle.closePath();
				
				// create line for cos portions (only done on selection)
				ctxExpandableUnitCircle.beginPath();
				ctxExpandableUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
				ctxExpandableUnitCircle.lineTo(dot.x, CIRC_Y0);
				ctxExpandableUnitCircle.lineWidth = 3.0;
				ctxExpandableUnitCircle.strokeStyle = 'red'; //red
				ctxExpandableUnitCircle.stroke();
				ctxExpandableUnitCircle.closePath();
				
				// create line for sin portions (only done on selection)
				ctxExpandableUnitCircle.beginPath();
				ctxExpandableUnitCircle.moveTo(dot.x, CIRC_Y0);
				ctxExpandableUnitCircle.lineTo(dot.x, dot.y);
				ctxExpandableUnitCircle.lineWidth = 3.0;
				ctxExpandableUnitCircle.strokeStyle = 'blue'; //blue
				ctxExpandableUnitCircle.stroke();
				ctxExpandableUnitCircle.closePath();
		    }
		});
	});

		  

	
})