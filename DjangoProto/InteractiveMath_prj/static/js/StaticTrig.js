'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	let ctxExpandableUnitCircle;
	let circleDotsCanvas =  $("#AmpSinCosCircle").get(0);;  // later on, this will set the "background image" for animation
	// get ready to start drawing on this canvas, first get the context
	if ( $("#AmpSinCosCircle").length ) {
    	ctxExpandableUnitCircle = $("#AmpSinCosCircle").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Sin/Cos unit circle context');
	}
	
	const STATIC_FILE_LOC = "../../static/json/";
	const urlInitValJson = STATIC_FILE_LOC + "StaticTrigConfig.json";
	let staticTrigExpln;
	let staticTrigToDo;
	
	// When user changes a parameter or a animation is running, need to be able to go back to an intermediate canvas picture to 
	// clear out the "old values" to allow writing new values selected by user or animation
	let axisOnly;  // will be the screen with just axis and no circle or sine/cos dashed lines.  Used when user changes amplitude
	let backgroundPlot; // used when user selects a new yellow dot to clear out the values of the old dot selected
	let preAnimatePlot;  // used in animation to clear out the intermediate steps in the circle sin/cos values moving to the angle graphs
	
	//********************************************************
	// Start drawing the "unit circle" with all static trig stuff around it
	//********************************************************	
	// schoolAngles are the "special" angles that kids learn on the unit circle.  
	//The params will be defined every time user changes amplitude of circle
	let schoolAngles;  	
	let amp = 1.0;
	const MAX_AMP = 1.1;   // this is set to keep circle and sin/cos graphs from getting too big
	const MIN_AMP = 0.8;  //this is set so that the graphics are still readable
	const CIRC_X0 = 210;
	const CIRC_Y0 = 410;
	const CIRC_RAD = 120;
	const AXIS_OVERLAP = 40;
	const HALF_AXIS = (MAX_AMP * CIRC_RAD) + AXIS_OVERLAP;
	const DOT_RADIUS = 5;
	const ANGLE_IND = 30;

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
	
	// draw x and y axis tick marks for other amplitudes, we will do 0.1 ticks up to 1.1, 1.1 is as big as I want sin/cos
	// graphs to get
	for(var i=1; i<= 11; i++){ 
		ctxExpandableUnitCircle.beginPath();
		// y axis
		ctxExpandableUnitCircle.moveTo(CIRC_X0 - 5, CIRC_Y0 - 0.1 * i * CIRC_RAD);
		ctxExpandableUnitCircle.lineTo(CIRC_X0 + 5, CIRC_Y0 - 0.1 * i * CIRC_RAD);
		// x axis
		ctxExpandableUnitCircle.moveTo(CIRC_X0 + 0.1 * i * CIRC_RAD, CIRC_Y0 + 5);
		ctxExpandableUnitCircle.lineTo(CIRC_X0 + 0.1 * i * CIRC_RAD, CIRC_Y0 - 5);
		ctxExpandableUnitCircle.stroke();
	}
	// label 0.5 and 1.0 on each x and y axis
	ctxExpandableUnitCircle.font = '10px Arial';
	// y axis ticks
	ctxExpandableUnitCircle.fillText("0.5", CIRC_X0 + 5, CIRC_Y0 - 0.1 * 5 * CIRC_RAD + 3);	
	ctxExpandableUnitCircle.fillText("1.0", CIRC_X0 + 5, CIRC_Y0 - 0.1 * 10 * CIRC_RAD + 3);
	// x axis ticks
	ctxExpandableUnitCircle.fillText("0.5", CIRC_X0  + 0.1 * 5 * CIRC_RAD - 8, CIRC_Y0 + 13);	
	ctxExpandableUnitCircle.fillText("1.0", CIRC_X0  + 0.1 * 10 * CIRC_RAD - 8, CIRC_Y0 + 13);
					
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();
	
	// *****
	// make arrows for XY axis 
	leftArrow(ctxExpandableUnitCircle, CIRC_X0 - HALF_AXIS, CIRC_Y0);
	rightArrow(ctxExpandableUnitCircle, CIRC_X0 + HALF_AXIS, CIRC_Y0);
	upArrow(ctxExpandableUnitCircle, CIRC_X0, CIRC_Y0 - HALF_AXIS);
	downArrow(ctxExpandableUnitCircle, CIRC_X0, CIRC_Y0 + HALF_AXIS);

	//****
	// NOW draw the two sin/cos axis off to the right of circle, which will stay fixed forever.  Don't draw the sine/cos curve
	// which will change as user changes amplitude
	//****

	const SIN_Y_ORIGIN = 175;
	const TRIG_X_ORIGIN = 600;
	const COS_Y_ORIGIN = 480;
	const TRIG_AXIS = 420; 
	const MAX_AMP_AXIS = MAX_AMP * CIRC_RAD + 10;  // needs to be at least MAX_AMP*CIRC_RAD to match the circle values
	// full theta pix is the number of pixels between 0 and 2pi for both graphs
	const FULL_THETA_PIX = TRIG_AXIS - 50;
	// draw sin axis off to right and a little above
	// draw x axis
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN - TRIG_AXIS/8, SIN_Y_ORIGIN);
	ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN + TRIG_AXIS, SIN_Y_ORIGIN);
	ctxExpandableUnitCircle.fillStyle = 'black';
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("\u03b8", TRIG_X_ORIGIN + TRIG_AXIS, SIN_Y_ORIGIN);	
	// draw y axis
	ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN, SIN_Y_ORIGIN + MAX_AMP_AXIS);
	ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN, SIN_Y_ORIGIN - MAX_AMP_AXIS);
	ctxExpandableUnitCircle.fillStyle = 'black';
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("S=Rsin\u03b8", TRIG_X_ORIGIN, SIN_Y_ORIGIN - MAX_AMP_AXIS);
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();
	// make arrows for Angle-Sin graph
	leftArrow(ctxExpandableUnitCircle, TRIG_X_ORIGIN - TRIG_AXIS/8, SIN_Y_ORIGIN);
	rightArrow(ctxExpandableUnitCircle, TRIG_X_ORIGIN + TRIG_AXIS, SIN_Y_ORIGIN);
	upArrow(ctxExpandableUnitCircle, TRIG_X_ORIGIN, SIN_Y_ORIGIN - MAX_AMP_AXIS);
	downArrow(ctxExpandableUnitCircle, TRIG_X_ORIGIN, SIN_Y_ORIGIN + MAX_AMP_AXIS);  
	
	// draw y axis tick marks for other amplitudes, we will do 0.1 ticks up to 1.1, 1.1 is as big as I want sin/cos
	// graphs to get
	for(var i=1; i<= 11; i++){ 
		ctxExpandableUnitCircle.beginPath();
		// y axis sin
		ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN - 5, SIN_Y_ORIGIN - 0.1 * i * CIRC_RAD);
		ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN + 5, SIN_Y_ORIGIN - 0.1 * i * CIRC_RAD);
		// y axis cos
		ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN - 5, COS_Y_ORIGIN - 0.1 * i * CIRC_RAD);
		ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN + 5, COS_Y_ORIGIN - 0.1 * i * CIRC_RAD);
		ctxExpandableUnitCircle.stroke();
	}
	// label 0.5 and 1.0 on each y sin and y cos axis
	ctxExpandableUnitCircle.font = '10px Arial';
	// y sin axis ticks
	ctxExpandableUnitCircle.fillText("0.5", TRIG_X_ORIGIN - 15, SIN_Y_ORIGIN - 0.1 * 5 * CIRC_RAD);	
	ctxExpandableUnitCircle.fillText("1.0", TRIG_X_ORIGIN - 15, SIN_Y_ORIGIN - 0.1 * 10 * CIRC_RAD);
	// y cos axis ticks
	ctxExpandableUnitCircle.fillText("0.5", TRIG_X_ORIGIN - 15, COS_Y_ORIGIN - 0.1 * 5 * CIRC_RAD);	
	ctxExpandableUnitCircle.fillText("1.0", TRIG_X_ORIGIN - 15, COS_Y_ORIGIN - 0.1 * 10 * CIRC_RAD);

	// draw cos axis off to right and below
	// draw x axis
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN - TRIG_AXIS/8, COS_Y_ORIGIN);
	ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN + TRIG_AXIS, COS_Y_ORIGIN);
	ctxExpandableUnitCircle.fillStyle = 'black';
	ctxExpandableUnitCircle.strokeStyle = "black";
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("\u03b8", TRIG_X_ORIGIN + TRIG_AXIS, COS_Y_ORIGIN);	
	// draw y axis
	ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN, COS_Y_ORIGIN + MAX_AMP_AXIS);
	ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN, COS_Y_ORIGIN - MAX_AMP_AXIS);
	ctxExpandableUnitCircle.fillStyle = 'black';
	ctxExpandableUnitCircle.font = '20px Arial';
	ctxExpandableUnitCircle.fillText("C=Rcos\u03b8", TRIG_X_ORIGIN, COS_Y_ORIGIN - MAX_AMP_AXIS);	
	
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();	
	
	// make arrows for Angle-Cos graph
	leftArrow(ctxExpandableUnitCircle, TRIG_X_ORIGIN - TRIG_AXIS/8, COS_Y_ORIGIN);
	rightArrow(ctxExpandableUnitCircle, TRIG_X_ORIGIN + TRIG_AXIS, COS_Y_ORIGIN);
	upArrow(ctxExpandableUnitCircle, TRIG_X_ORIGIN, COS_Y_ORIGIN - MAX_AMP_AXIS);
	downArrow(ctxExpandableUnitCircle, TRIG_X_ORIGIN, COS_Y_ORIGIN + MAX_AMP_AXIS); 

	
	//put ticks on the sin/cos axis.  FULL_THETA_PIX is the number of pixels in 0 to 2pi (full scale)
	// thetaGraph is indexed by the yellow dots on the circle (16 in total) and represents the angle on a sine/cos graph
	// in pixels from the origin
	let thetaGraph = [];
	let pi = "\u03c0"
	thetaGraph[0] = {pix: 0, num: "", den: ""};
	thetaGraph[1] = {pix: FULL_THETA_PIX/12, num:pi, den: "6"};  // pi/6 angle
	thetaGraph[2] = {pix: FULL_THETA_PIX/8, num:pi, den: "4"};   // pi/4
	thetaGraph[3] = {pix: FULL_THETA_PIX/6, num:pi, den: "3"};  // pi/3
	thetaGraph[4] = {pix: FULL_THETA_PIX/4, num: pi, den: "2"};  // pi/2
	thetaGraph[5] = {pix: FULL_THETA_PIX/4 + FULL_THETA_PIX/12, num: "2" + pi, den: "3"};  // pi/2 + pi/6
	thetaGraph[6] = {pix: FULL_THETA_PIX/4 + FULL_THETA_PIX/8, num: "3" + pi, den: "4"};  // pi/2 + pi/4
	thetaGraph[7] = {pix: FULL_THETA_PIX/4 + FULL_THETA_PIX/6, num: "5" + pi, den: "6"};  // pi/2 + pi/3
	thetaGraph[8] = {pix: FULL_THETA_PIX/2, num: pi, den: ""};  // pi
	thetaGraph[9] = {pix: FULL_THETA_PIX/2 + FULL_THETA_PIX/12, num: "7" + pi, den: "6"};  // pi + pi/6
	thetaGraph[10] = {pix: FULL_THETA_PIX/2 + FULL_THETA_PIX/8, num: "5" + pi, den: "4"};  // pi + pi/4
	thetaGraph[11] = {pix: FULL_THETA_PIX/2 + FULL_THETA_PIX/6, num: "4" + pi, den: "3"};  // pi + pi/3
	thetaGraph[12] = {pix: 3*FULL_THETA_PIX/4, num: "3" + pi, den: "2"};  // 3pi/2 
	thetaGraph[13] = {pix: 3*FULL_THETA_PIX/4 + FULL_THETA_PIX/12, num: "5" + pi, den: "3"};  // 3pi/2 + pi/6 = 5pi/3
	thetaGraph[14] = {pix: 3*FULL_THETA_PIX/4 + FULL_THETA_PIX/8, num: "7" + pi, den: "4"};  //  3pi/2 + pi/4 = 7pi/4
	thetaGraph[15] = {pix: 3*FULL_THETA_PIX/4 + FULL_THETA_PIX/6, num: "11" + pi, den: "6"};  //  3pi/2 + pi/3 = 11pi/6
	thetaGraph[16] = {pix: FULL_THETA_PIX, num: "2" + pi, den: ""};  //  2pi

			
	// add tick marks to sin/cos axes, no need to mark 0 degrees
	for (var i = 1; i < thetaGraph.length; i++) {
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.setLineDash([5,25]); // dash the lines to mostly space 
		ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN + thetaGraph[i].pix, SIN_Y_ORIGIN);
		ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN + thetaGraph[i].pix, COS_Y_ORIGIN);
		ctxExpandableUnitCircle.strokeStyle = "green";
		ctxExpandableUnitCircle.stroke();
		// want label under the axis, want pi/N written vertically
		vertical_fract(ctxExpandableUnitCircle, TRIG_X_ORIGIN + thetaGraph[i].pix, COS_Y_ORIGIN + 12, thetaGraph[i].num, thetaGraph[i].den);
		vertical_fract(ctxExpandableUnitCircle, TRIG_X_ORIGIN + thetaGraph[i].pix, SIN_Y_ORIGIN + 12, thetaGraph[i].num, thetaGraph[i].den);
	}
	axisOnly = ctxExpandableUnitCircle.getImageData(0, 0, circleDotsCanvas.width, circleDotsCanvas.height);
	redrawNewAmp();
	
	// *****************************************************************
	// Draw the stuff that can change when user changes amplitude (defaults to 1.0 unit circle)
	// *****************************************************************
	function redrawNewAmp() {	
		schoolAngles = [
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
				xcos:  -Math.round((amp * CIRC_RAD)),
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
				ysin: -Math.round((amp * CIRC_RAD)),
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
			
		// could be changing the amplitude of circle and sin/cos dotted line graphs, clear back to bare axis
		ctxExpandableUnitCircle.putImageData(axisOnly, 0, 0);
		//Draw the big unit circle which could be expanded/contracted based on user input
		// need to ensure the points here can never be negative, else they get clipped
		ctxExpandableUnitCircle.beginPath();
		// draw main circle
		ctxExpandableUnitCircle.lineWidth = 1.0
		ctxExpandableUnitCircle.strokeStyle = "black";
	    ctxExpandableUnitCircle.arc(CIRC_X0, CIRC_Y0, amp*CIRC_RAD, 0, Math.PI * 2, true); 
	    ctxExpandableUnitCircle.stroke();
	    
		// Draw the small yellow circles for angles-of-interest
		schoolAngles.forEach(dot => {
			  ctxExpandableUnitCircle.beginPath();
			  // create dots for user clickable sine/cos/angle graphics
			  ctxExpandableUnitCircle.arc(dot.x, dot.y, DOT_RADIUS, 0, 2 * Math.PI, true);
			  ctxExpandableUnitCircle.fillStyle = 'yellow';
			  ctxExpandableUnitCircle.fill();
			  ctxExpandableUnitCircle.stroke();
			  ctxExpandableUnitCircle.closePath();
			  
		});
		// draw dashed amplitude bar for sine curve, depends on amplitude chosen
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.strokeStyle = "blue";
		const DASH_SEG_PIX = 3;
		function calcSine(j) {
			return Math.round((amp * CIRC_RAD)*Math.sin(2* Math.PI * j/FULL_THETA_PIX));
		}
		for(var i=0; i<FULL_THETA_PIX; i=i+2*DASH_SEG_PIX){ // Loop from left side to create dashed sin curve
	    	var yLo = calcSine(i); 
	    	var yHi = calcSine(i+DASH_SEG_PIX);
	    	// remember, on bitmap, y increases as you go from top to bottom
	  		ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN + i, SIN_Y_ORIGIN - yLo); 
	  		// make a dash seg and then skip and redo again.  
	    	ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN + i + DASH_SEG_PIX, SIN_Y_ORIGIN - yHi); 
	  	}
		ctxExpandableUnitCircle.stroke(); 
		
		// draw dashed amplitude bar for cosine curve, depends on amplitude chosen
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.strokeStyle = "red";
		function calcCos(j) {
			return Math.round((amp * CIRC_RAD)*Math.cos(2* Math.PI * j/FULL_THETA_PIX));
		}
		for(var i=0; i<FULL_THETA_PIX; i=i+2*DASH_SEG_PIX){ // Loop from left side to create dashed cos curve
	    	var yLo = calcCos(i); 
	    	var yHi = calcCos(i+DASH_SEG_PIX);
	    	// remember, on bitmap, y increases as you go from top to bottom
	  		ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN + i, COS_Y_ORIGIN - yLo); 
	  		// make a dash seg and then skip and redo again.  
	    	ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN + i + DASH_SEG_PIX, COS_Y_ORIGIN - yHi); 
	  	}
		ctxExpandableUnitCircle.stroke(); 
		
		// NOW we have the background image done.  As users click on a point and new stuff happens, we always come back to 
		// this point, so we save it to go back to it when we want to start over
		backgroundPlot = ctxExpandableUnitCircle.getImageData(0, 0, circleDotsCanvas.width, circleDotsCanvas.height);
	}
	//********************** background is done, can use this as base for animations ******************************

	//*********************************************************
	// Setup the user buttons
	//*********************************************************
	// User can choose a TO DO set for the text box or an explanation, this code is the implementation
	$('#ToDo_or_expln').on('click', function(event){
		if ("Explain" == $("#ToDo_or_expln").prop("value")) {
			// currently showing the Try This text.  Move into explanation text
			$("#LongTextBox").text(staticTrigExpln);
			$("#ToDo_or_expln").prop("value", "Try This");
		} else {
			// currently showing the Explanation text, move into TO DO  text
			$("#LongTextBox").text(staticTrigToDo);
			$("#ToDo_or_expln").prop("value", "Explain");
		}
    });
    
    // fix the max/min values of amplitude(R) input so HTML matches js code
    $("#ampCirc").attr("max", MAX_AMP.toString());  
    $("#ampCirc").attr("min", MIN_AMP.toString());  
    // allow user to change the size of the unit circle to bring in idea of amplitude/volume to sine-cosine graphs
    $('#ampCirc').on('input', function(){
    	let temp = $("#ampCirc").val();
    	// we allow first decimal place on input amplitude values, test a valid value was input
		if ( Number.isInteger(temp * 10) ) {
			if ( (temp >= MIN_AMP) && (temp <= MAX_AMP) ) {
				console.log(" amp value is in range");
				amp = temp;
				redrawNewAmp();
			} else {
				console.log("Somehow, the user entered in a number outside expected range");
			}
		} else {
			console.log("User entered in a noninteger value which will be ignored");
		}
	});
	
	//console.log(" width is " + circleDotsCanvas.width + " height is " + circleDotsCanvas.height);
	
	//***********************************
	// This sets up the array for the animation.  After user click yellow dot, this is called to fill the array which
	// is used every specified time interval to draw the sin/cos lines from the circle to the appropriate graph
	// after animation is complete, this array is destroyed till needed again
	//***********************************
	const NUM_ANIMATION_SIN_COS = 5;
	let sinLineMovement = [];
	let cosLineMovement = [];
	let line;
	function animate_circ2graph(whichGraph, x1Axis, y1Axis, x1Circ, y1Circ, indx) {
		// find the end place for this line to be used in animation using indx, x2Top = x2Bottom since vert lines
		let x2Axis = TRIG_X_ORIGIN + thetaGraph[indx].pix;
		let x2Graph = x2Axis;
		let y2Axis;
		let y2Graph;
		let makeAPoint = 0;  // if sin/cos is zero, let a tiny point travel to the graph, else this does nothing
		if (whichGraph ==="sin") {
			 //we know x axis origin of sin graph is at SIN_Y_ORIGIN
			y2Axis = SIN_Y_ORIGIN;
			// remember, Y grows downward (yeah, counterintuitive
			y2Graph = y2Axis - schoolAngles[indx].ysin;
			if (y1Circ === y1Axis) {
				makeAPoint = 5;	// if sin = 0, want to show a tiny point moving to proper place, else nothing would move	
			}
		} else if (whichGraph == "cos") {
			 //we know x axis origin of cos graph is at COS_Y_ORIGIN
			y2Axis = COS_Y_ORIGIN;
			// remember, Y grows downward (yeah, counterintuitive
			y2Graph = y2Axis - schoolAngles[indx].xcos;
			if (x1Circ === x1Axis) {
				makeAPoint = 5;	// if cos = 0, want to show a tiny point moving to proper place, else nothing would move
				console.log("COS = 0 is activated to give a point");	
			}
		}
				
		let deltaX_Pt = (x2Graph - x1Circ)/NUM_ANIMATION_SIN_COS;
		let deltaX_Ax = (x2Axis - x1Axis)/NUM_ANIMATION_SIN_COS;
		let deltaY_Pt = (y2Graph - y1Circ)/NUM_ANIMATION_SIN_COS;
		let deltaY_Ax = (y2Axis - y1Axis)/NUM_ANIMATION_SIN_COS;
				
		for (var i=1; i <= NUM_ANIMATION_SIN_COS; i++) {
			line = {"begin_x": Math.round(x1Axis + i * deltaX_Ax), 
					"begin_y": Math.round(y1Axis + i * deltaY_Ax), 
					"end_x": Math.round(x1Circ + i * deltaX_Pt), 
					"end_y": Math.round(y1Circ + i * deltaY_Pt + makeAPoint) };
			//console.log(" line is begin_x=" + line.begin_x + " begin_y=" + line.begin_y + " end_x=" + line.end_x + " end_y" + line.end_y);
			if (whichGraph ==="sin") {
				sinLineMovement.push(line);
			} else {
				cosLineMovement.push(line);
			}
		}
	}
	
	//***********************************
	// After user clicks yellow dot, and the arrays sinLineMovement and cosLineMovement are filled in (making doAnimation true), 
	// this code runs every x ms.  When the array is exhausted, the array is destroyed for possible later refilling
	//***********************************
	let doAnimation = false;
	let ind = 0;
	setInterval(function(){
		if (doAnimation) {
			// wont start till both line arrays are ready
			ctxExpandableUnitCircle.putImageData(preAnimatePlot, 0, 0);
			// place the sine line
			ctxExpandableUnitCircle.beginPath();
			ctxExpandableUnitCircle.lineWidth = 3.0;
			ctxExpandableUnitCircle.strokeStyle = 'blue';
			ctxExpandableUnitCircle.moveTo(sinLineMovement[ind].begin_x, sinLineMovement[ind].begin_y);
			ctxExpandableUnitCircle.lineTo(sinLineMovement[ind].end_x, sinLineMovement[ind].end_y);
			ctxExpandableUnitCircle.stroke();
			// place the cosine line
			ctxExpandableUnitCircle.beginPath();
			ctxExpandableUnitCircle.lineWidth = 3.0;
			ctxExpandableUnitCircle.strokeStyle = 'red';
			ctxExpandableUnitCircle.moveTo(cosLineMovement[ind].begin_x, cosLineMovement[ind].begin_y);
			ctxExpandableUnitCircle.lineTo(cosLineMovement[ind].end_x, cosLineMovement[ind].end_y);
			ctxExpandableUnitCircle.stroke();
			ind++;
			if (sinLineMovement.length == ind)  {
				doAnimation = false;
				// we are done with this animation array, empty it and reset counter
				sinLineMovement = [];
				cosLineMovement = [];
				ind = 0;
			}
		}
	
	}, 500); // every 500 ms, move the animation
	
	//***********************************
	// this code is used as user interacts with the yellow dots on main circle
	//***********************************
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
				
				// snap a picture of what we have so we can go back to it during animation
				preAnimatePlot = ctxExpandableUnitCircle.getImageData(0, 0, circleDotsCanvas.width, circleDotsCanvas.height);	
				
				// now animate the sine/cos lines going over to graph, first fill in the array, then turn on animate
				animate_circ2graph("sin", dot.x, CIRC_Y0, dot.x, dot.y, cntr);
				animate_circ2graph("cos", CIRC_X0, CIRC_Y0, dot.x, CIRC_Y0, cntr);
				//console.log("sin length is " + sinLineMovement.length + "cosine len is " + cosLineMovement.length)
				doAnimation = true;
		    }	
		    cntr = cntr + 1;
		});
	});
	
	//***********************************
	//initialize data fields for this page using config json file
	//***********************************	
	$.getJSON(urlInitValJson)
		.done(function(data,status,xhr) {
			//xhr has good stuff like status, responseJSON, statusText, progress
			if (status === 'success') {				
				staticTrigToDo = data.todo;
				staticTrigExpln = data.expln;
				$("#LongTextBox").text(staticTrigToDo);
				$("#ToDo_or_expln").prop("value", "Explain");
			}
			else {
				console.log("config json file request returned with status = " + status);
			}
		})
		.fail(function(data, status, error) {
			console.log("Error in JSON file " + status + error);
			alert("Error in JSON file " + status + error);
		})

})