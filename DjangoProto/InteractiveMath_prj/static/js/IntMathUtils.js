'use strict'	
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
	
	const isInside = (point, circle, radius) => {
		return ((point.x-circle.x) ** 2 + (point.y - circle.y) ** 2) <= (radius) ** 2;
	};
	
	//*************************************************
	//***  Draw the unit circle plus yellow dots used in Static Trig and Dynamic Trig pages
	//*************************************************
	//The params will be defined every time user changes amplitude of circle 	
	const CIRC_RAD = 120;
	const AXIS_OVERLAP = 40;
	const DOT_RADIUS = 7;
	const ANGLE_IND = 30;
	
	function drawTrigCircle(ctxExpandableUnitCircle, x_center, y_center, halfAxis) {
		// draw y axis for circle/angle
		ctxExpandableUnitCircle.beginPath();
		ctxExpandableUnitCircle.moveTo(x_center, y_center - halfAxis);
		ctxExpandableUnitCircle.lineTo(x_center, y_center + halfAxis);
		ctxExpandableUnitCircle.font = '20px Arial';
		ctxExpandableUnitCircle.fillText("y", x_center + 5, y_center - halfAxis + 5);	
		
		// draw x axis for circle/angle
		ctxExpandableUnitCircle.moveTo(x_center - halfAxis, y_center);
		ctxExpandableUnitCircle.lineTo(x_center + halfAxis, y_center);
		ctxExpandableUnitCircle.font = '20px Arial';
		ctxExpandableUnitCircle.fillText("x", x_center + halfAxis + 5, y_center + 5);
		ctxExpandableUnitCircle.stroke();	
		
		// draw x and y axis tick marks for other amplitudes, we will do 0.1 ticks up to 1.1, 1.1 is as big as I want sin/cos
		// graphs to get
		for(let i=1; i<= 11; i++){ 
			ctxExpandableUnitCircle.beginPath();
			// y axis
			ctxExpandableUnitCircle.moveTo(x_center - 5, y_center - 0.1 * i * CIRC_RAD);
			ctxExpandableUnitCircle.lineTo(x_center + 5, y_center - 0.1 * i * CIRC_RAD);
			// x axis
			ctxExpandableUnitCircle.moveTo(x_center + 0.1 * i * CIRC_RAD, y_center + 5);
			ctxExpandableUnitCircle.lineTo(x_center + 0.1 * i * CIRC_RAD, y_center - 5);
			ctxExpandableUnitCircle.stroke();
		}
		// label 0.5 and 1.0 on each x and y axis
		ctxExpandableUnitCircle.font = '10px Arial';
		// y axis ticks
		ctxExpandableUnitCircle.fillText("0.5", x_center + 5, y_center - 0.1 * 5 * CIRC_RAD + 3);	
		ctxExpandableUnitCircle.fillText("1.0", x_center + 5, y_center - 0.1 * 10 * CIRC_RAD + 3);
		// x axis ticks
		ctxExpandableUnitCircle.fillText("0.5", x_center  + 0.1 * 5 * CIRC_RAD - 8, y_center + 13);	
		ctxExpandableUnitCircle.fillText("1.0", x_center  + 0.1 * 10 * CIRC_RAD - 8, y_center + 13);
						
		ctxExpandableUnitCircle.stroke();
		ctxExpandableUnitCircle.closePath();
		
		// *****
		// make arrows for XY axis 
		leftArrow(ctxExpandableUnitCircle, x_center - halfAxis, y_center);
		rightArrow(ctxExpandableUnitCircle, x_center + halfAxis, y_center);
		upArrow(ctxExpandableUnitCircle, x_center, y_center - halfAxis);
		downArrow(ctxExpandableUnitCircle, x_center, y_center + halfAxis);
	}
	
	//****************
	//want to round but leave value as number, not string, so toFixed() is out. 
	//If x axis is a number, chart js will figure out grid lines/step size as needed
	const roundFP = (number, prec) => {
	    let tempnumber = number * Math.pow(10, prec);
	    tempnumber = Math.round(tempnumber);
	    return tempnumber / Math.pow(10, prec);
	};
	
	//****************
	// Draw arbitrary arrows to help user get started, needs a point, tip1 and tip 2 define the 
	// arrow and end is the end of the arrow.  tip1, tip2 and end are lines that end in point
	function arbArrow(TwoDContext, arrow, text) {
			  	TwoDContext.beginPath();
				TwoDContext.moveTo(arrow.tip1[0], arrow.tip1[1]);
				TwoDContext.lineTo(arrow.point[0], arrow.point[1]);
				TwoDContext.moveTo(arrow.tip2[0], arrow.tip2[1]);
				TwoDContext.lineTo(arrow.point[0], arrow.point[1]);
				TwoDContext.moveTo(arrow.end[0], arrow.end[1]);
				TwoDContext.lineTo(arrow.point[0], arrow.point[1]);
				TwoDContext.strokeStyle = 'red';
				TwoDContext.fillStyle = 'red';
				TwoDContext.font = '20px Arial';
				TwoDContext.fillText(text, arrow.end[0] + 5, arrow.end[1] + 5);	
				TwoDContext.lineWidth = 2.0
				TwoDContext.stroke();
				TwoDContext.closePath();
	};
	