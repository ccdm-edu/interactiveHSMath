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
		  // create dots for user clickable sine/cos/angle graphics
		  ctxExpandableUnitCircle.arc(dot.x, dot.y, DOT_RADIUS, 0, 2 * Math.PI, true);
		  ctxExpandableUnitCircle.fillStyle = 'yellow';
		  ctxExpandableUnitCircle.fill();
		  ctxExpandableUnitCircle.stroke();
		  ctxExpandableUnitCircle.closePath();
		  
	});
	//*****
	// used to draw arrows on lines
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
	// *****
	// make arrows for XY axis 
	leftArrow(CIRC_X0 - HALF_AXIS, CIRC_Y0);
	rightArrow(CIRC_X0 + HALF_AXIS, CIRC_Y0);
	upArrow(CIRC_X0, CIRC_Y0 - HALF_AXIS);
	downArrow(CIRC_X0, CIRC_Y0 + HALF_AXIS);

	//****
	// NOW draw the two sin/cos axis off to the right of circle
	//****

	const SIN_Y_ORIGIN = 175;
	const TRIG_X_ORIGIN = 500;
	const COS_Y_ORIGIN = 480;
	const TRIG_AXIS = 420; 
	const MAX_AMP_AXIS = MAX_AMP * CIRC_RAD + 10;  // needs to be at least MAX_AMP*CIRC_RAD to match the circle values
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
	ctxExpandableUnitCircle.fillText("Rsin\u03b8", TRIG_X_ORIGIN, SIN_Y_ORIGIN - MAX_AMP_AXIS);
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();
	// make arrows for Angle-Sin graph
	leftArrow(TRIG_X_ORIGIN - TRIG_AXIS/8, SIN_Y_ORIGIN);
	rightArrow(TRIG_X_ORIGIN + TRIG_AXIS, SIN_Y_ORIGIN);
	upArrow(TRIG_X_ORIGIN, SIN_Y_ORIGIN - MAX_AMP_AXIS);
	downArrow(TRIG_X_ORIGIN, SIN_Y_ORIGIN + MAX_AMP_AXIS);  
	
	// draw dashed amplitude bar at current point
	ctxExpandableUnitCircle.beginPath();
	ctxExpandableUnitCircle.strokeStyle = "blue";
	// full theta pix is the number of pixels between 0 and 2pi for both graphs
	const FULL_THETA_PIX = TRIG_AXIS - 50;
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
	ctxExpandableUnitCircle.fillText("Rcos\u03b8", TRIG_X_ORIGIN, COS_Y_ORIGIN - MAX_AMP_AXIS);	
	
	ctxExpandableUnitCircle.stroke();
	ctxExpandableUnitCircle.closePath();	
	
	// make arrows for Angle-Cos graph
	leftArrow(TRIG_X_ORIGIN - TRIG_AXIS/8, COS_Y_ORIGIN);
	rightArrow(TRIG_X_ORIGIN + TRIG_AXIS, COS_Y_ORIGIN);
	upArrow(TRIG_X_ORIGIN, COS_Y_ORIGIN - MAX_AMP_AXIS);
	downArrow(TRIG_X_ORIGIN, COS_Y_ORIGIN + MAX_AMP_AXIS); 
	
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
  		ctxExpandableUnitCircle.moveTo(TRIG_X_ORIGIN + i, COS_Y_ORIGIN - yLo); 
  		// make a dash seg and then skip and redo again.  
    	ctxExpandableUnitCircle.lineTo(TRIG_X_ORIGIN + i + DASH_SEG_PIX, COS_Y_ORIGIN - yHi); 
  	}
	ctxExpandableUnitCircle.stroke(); 
	
	function vertical_fract(x, y, num, denom) {
		ctxExpandableUnitCircle.font = '12px Arial';
		ctxExpandableUnitCircle.setLineDash([]);  // no dash
		// do numerator
		ctxExpandableUnitCircle.fillText(num, x,y);
		// do dividing line
		if (denom != "") {
			// means we actually have a denominator
			ctxExpandableUnitCircle.beginPath();
			ctxExpandableUnitCircle.strokeStyle = "black";
			ctxExpandableUnitCircle.moveTo(x, y + 3);
			ctxExpandableUnitCircle.lineTo(x + 10, y+3);
			ctxExpandableUnitCircle.stroke();
		}
		// do denominator
		ctxExpandableUnitCircle.fillText(denom, x, y+16);	
	}
	
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
		vertical_fract(TRIG_X_ORIGIN + thetaGraph[i].pix, COS_Y_ORIGIN + 12, thetaGraph[i].num, thetaGraph[i].den);
		vertical_fract(TRIG_X_ORIGIN + thetaGraph[i].pix, SIN_Y_ORIGIN + 12, thetaGraph[i].num, thetaGraph[i].den);

	}
	
	
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
	
	// animate the sine/cos lines from circle to move to the graphs
	let doAnimation = false;
	let ind = 0;
	let preAnimatePlot;
	setInterval(function(){
		if (doAnimation) {
			// dont start till both line arrays are ready
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
			console.log(" animation ind = " + ind);
			if (sinLineMovement.length == ind)  {
				doAnimation = false;
				// we are done with this animation array, empty it and reset counter
				sinLineMovement = [];
				cosLineMovement = [];
				ind = 0;
			}
		}
	
	}, 500); // every 500 ms, move the animation
	
	
	function isInside(point, circle, radius) {
		return ((point.x-circle.x) ** 2 + (point.y - circle.y) ** 2) <= (radius) ** 2;
	};
	
	// this code is used as user interacts with the yellow dots on main circle
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
				console.log("sin length is " + sinLineMovement.length + "cosine len is " + cosLineMovement.length)
				doAnimation = true;
		    }	
		    cntr = cntr + 1;
		});
	});
	
})