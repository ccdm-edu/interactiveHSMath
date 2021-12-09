	//*****
	// used to draw arrows on lines
	const ARROW_LEN = 10;
	function leftArrow(TwoDContext, x, y) {
		TwoDContext.beginPath();
		TwoDContext.moveTo(x, y);
		TwoDContext.lineTo(x + ARROW_LEN, y - ARROW_LEN);
		TwoDContext.moveTo(x, y);
		TwoDContext.lineTo(x + ARROW_LEN, y + ARROW_LEN);
		TwoDContext.stroke();
		TwoDContext.closePath();
	};
	function rightArrow(TwoDContext, x, y) {
		TwoDContext.beginPath();
		TwoDContext.moveTo(x, y);
		TwoDContext.lineTo(x - ARROW_LEN, y + ARROW_LEN);
		TwoDContext.moveTo(x, y);
		TwoDContext.lineTo(x - ARROW_LEN, y - ARROW_LEN);
		TwoDContext.stroke();
		TwoDContext.closePath();
	};
	function upArrow(TwoDContext, x, y) {
		TwoDContext.beginPath();
		TwoDContext.moveTo(x, y);	
		TwoDContext.lineTo(x + ARROW_LEN, y + ARROW_LEN);
		TwoDContext.moveTo(x, y);
		TwoDContext.lineTo(x - ARROW_LEN, y + ARROW_LEN);
		TwoDContext.stroke();
		TwoDContext.closePath();
	};
	function downArrow(TwoDContext, x, y) {
		TwoDContext.beginPath();
		TwoDContext.moveTo(x, y);	
		TwoDContext.lineTo(x + ARROW_LEN, y - ARROW_LEN);
		TwoDContext.moveTo(x, y);
		TwoDContext.lineTo(x - ARROW_LEN, y - ARROW_LEN);
		TwoDContext.stroke();
		TwoDContext.closePath();
	};
	
	function vertical_fract(TwoDContext, x, y, num, denom) {
		TwoDContext.font = '12px Arial';
		TwoDContext.setLineDash([]);  // no dash
		// do numerator
		TwoDContext.fillText(num, x,y);
		// do dividing line
		if (denom != "") {
			// means we actually have a denominator
			TwoDContext.beginPath();
			TwoDContext.strokeStyle = "black";
			TwoDContext.moveTo(x, y + 3);
			TwoDContext.lineTo(x + 10, y+3);
			TwoDContext.stroke();
		}
		// do denominator
		TwoDContext.fillText(denom, x, y+16);	
	}
	
	function isInside(point, circle, radius) {
		return ((point.x-circle.x) ** 2 + (point.y - circle.y) ** 2) <= (radius) ** 2;
	};
	
	//*************************************************
	//***  Draw the unit circle plus yellow dots used in Static Trig and Dynamic Trig pages
	//*************************************************
	//The params will be defined every time user changes amplitude of circle 	
	const CIRC_X0 = 210;
	const CIRC_Y0 = 410;
	const CIRC_RAD = 120;
	const AXIS_OVERLAP = 40;
	const DOT_RADIUS = 7;
	const ANGLE_IND = 30;
	
	function drawTrigCircle(ctxExpandableUnitCircle, halfAxis) {
		// draw y axis for circle/angle
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.moveTo(CIRC_X0, CIRC_Y0 - halfAxis);
		ctxExpandableUnitCircle.lineTo(CIRC_X0, CIRC_Y0 + halfAxis);
		ctxExpandableUnitCircle.font = '20px Arial';
		ctxExpandableUnitCircle.fillText("y", CIRC_X0 + 5, CIRC_Y0 - halfAxis + 5);	
		
		// draw x axis for circle/angle
		ctxExpandableUnitCircle.moveTo(CIRC_X0 - halfAxis, CIRC_Y0);
		ctxExpandableUnitCircle.lineTo(CIRC_X0 + halfAxis, CIRC_Y0);
		ctxExpandableUnitCircle.font = '20px Arial';
		ctxExpandableUnitCircle.fillText("x", CIRC_X0 + halfAxis + 5, CIRC_Y0 + 5);
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
		leftArrow(ctxExpandableUnitCircle, CIRC_X0 - halfAxis, CIRC_Y0);
		rightArrow(ctxExpandableUnitCircle, CIRC_X0 + halfAxis, CIRC_Y0);
		upArrow(ctxExpandableUnitCircle, CIRC_X0, CIRC_Y0 - halfAxis);
		downArrow(ctxExpandableUnitCircle, CIRC_X0, CIRC_Y0 + halfAxis);
	}
	
	//****************
	//want to round but leave value as number, not string, so toFixed() is out. 
	//If x axis is a number, chart js will figure out grid lines/step size as needed
	function roundFP(number, prec) {
	    var tempnumber = number * Math.pow(10, prec);
	    tempnumber = Math.round(tempnumber);
	    return tempnumber / Math.pow(10, prec);
	};