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