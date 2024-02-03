'use strict'	

	//** Make a fraction teens may be familiar with looking at with a numerator, a line underneath
	// and a denominator
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
	// read configuration to get specific filenames (test/actual)
	//*************************************************	

	function getActualFilename(dummyFilename) {
		const STATIC_FILE_LOC = "../../static/static_binaries/";
		const urlFileMapJson = STATIC_FILE_LOC + "Configuration/BinaryFileNameConfig.json";
		
		var d = new $.Deferred();
		// try to read back old saved value, else need to open and read config json file		
		let fileMapConfig, readback;
		readback = localStorage.getItem("fileMapperConfig");
		if (readback != null) {
			try {
				fileMapConfig = JSON.parse(readback);
				// debug, print it all out
				//console.log('len2 is ' + Object.keys(fileMapConfig).length);
				Object.keys(fileMapConfig).forEach(value => console.log(value + " , " + fileMapConfig[value]));
				// the file mapper was successfully read from session memory, no file reads needed, resolve the promise	
				//console.log('READ FROM LOCAL STORE:  dummyfile is ' + dummyFilename + 'desired mapping is ' + fileMapConfig[dummyFilename])
				d.resolve(fileMapConfig[dummyFilename]);	
			}
			catch(e) {
				console.log('SW error, stored object is not JSON')
				d.reject('FAIL')
			}
		} else {
			console.log('file mapper not in memory, need to read the JSON file')
			$.getJSON(urlFileMapJson)
			.done(function(fileMapConfig,status,xhr) {
				//xhr has good stuff like status, responseJSON, statusText, progress
				if (status === 'success') {				
   					localStorage.setItem("fileMapperConfig", JSON.stringify(fileMapConfig));
   					console.log('READ FROM FILE:  desired mapping is ' + fileMapConfig[dummyFilename])
   					Object.keys(fileMapConfig).forEach(value => console.log(value + " , " + fileMapConfig[value]));
   					// game over, tell caller all is done and return requested value
					//def.resolve(fileMapConfig[dummyFilename]);
					d.resolve(fileMapConfig[dummyFilename]);
				}
				else {
					console.log("config json file request returned with status = " + status);
					d.reject("FAIL")
				}

			})
			.fail(function(fileMapConfig, status, error) {
				console.error("Error in JSON file " + status + error);
				alert("Error in JSON file " + status + error);
				// your screwed, finish the promise
				d.reject("FAIL");
			})
		} 
		return d.promise();
	}	
	//*************************************************
	// constants for special characters in Javascript
	//*************************************************
	const PI = "\u03c0";
	const MULT_DOT = "\u22C5";
	const THETA = "\u03b8";
	
	//*************************************************
	//***  Draw the unit circle plus yellow dots used in Static Trig and Dynamic Trig pages
	//*************************************************
	//The params will be defined every time user changes amplitude of circle 	
	const CIRC_RAD = 120;
	const AXIS_OVERLAP = 40;
	const DOT_RADIUS = 10;
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
		new AxisArrow(ctxExpandableUnitCircle, [x_center - halfAxis, y_center], "L").draw();
		new AxisArrow(ctxExpandableUnitCircle, [x_center + halfAxis, y_center], "R").draw();
		new AxisArrow(ctxExpandableUnitCircle, [x_center, y_center - halfAxis], "U").draw();
		new AxisArrow(ctxExpandableUnitCircle, [x_center, y_center + halfAxis], "D").draw();
	}
	
	//*** draw lines between upper and lower plot to show that lower is an expansion of upper
	// line1 and line2 are a set {start:(x1,y1), stop:(x2,y2)}
	function drawExpansionLines(twoDCtx, line1, line2, text) {
		const MAX_AMP_AXIS = CIRC_RAD + 10;
		// draw lines inbetween plots to show lower plot is expanded time of upper plot
		twoDCtx.beginPath();
		twoDCtx.moveTo(line1.start[0], line1.start[1]);
		twoDCtx.lineTo(line1.stop[0], line1.stop[1]);
		twoDCtx.setLineDash([5, 10])
		twoDCtx.strokeStyle = 'red';
		twoDCtx.fillStyle = 'red';
		twoDCtx.font = '15px Arial';
		twoDCtx.fillText(text, line1.start[0] + 10, line1.start[1] + MAX_AMP_AXIS + 20);
		twoDCtx.stroke();
		twoDCtx.beginPath();
		twoDCtx.moveTo(line2.start[0], line2.start[1]);
		twoDCtx.lineTo(line2.stop[0], line2.stop[1]);
		twoDCtx.stroke();
		// go back to background color
		twoDCtx.strokeStyle = 'black';
		twoDCtx.fillStyle = 'black';
		twoDCtx.setLineDash([])
	}
	//*** Draw the custom axis for sine with tick marks
	function drawSineAxis(twoDCtx, xOrigin, yOrigin, maxTime, pix_per_minor_tick, num_major_ticks) {
		const TRIG_AXIS = 420;  
		const MAX_AMP_AXIS = CIRC_RAD + 10; 
		twoDCtx.beginPath();
		// make x axis
		twoDCtx.moveTo(xOrigin - TRIG_AXIS/8, yOrigin);
		twoDCtx.lineTo(xOrigin + TRIG_AXIS, yOrigin);
		twoDCtx.fillStyle = 'black';
		twoDCtx.font = '15px Arial';
		twoDCtx.fillText("t (sec)", xOrigin + TRIG_AXIS - 30 , yOrigin + 30);
		twoDCtx.stroke()	
		// draw y axis
		twoDCtx.beginPath();
		twoDCtx.moveTo(xOrigin, yOrigin + MAX_AMP_AXIS);
		twoDCtx.lineTo(xOrigin, yOrigin - MAX_AMP_AXIS);
		twoDCtx.fillStyle = 'black';
		twoDCtx.stroke();
		// make arrows for Angle-Sin graph
		new AxisArrow(twoDCtx, [xOrigin - TRIG_AXIS/8, yOrigin], "L").draw();
		new AxisArrow(twoDCtx, [xOrigin + TRIG_AXIS, yOrigin], "R").draw();
		new AxisArrow(twoDCtx, [xOrigin, yOrigin - MAX_AMP_AXIS], "U").draw();
		new AxisArrow(twoDCtx, [xOrigin, yOrigin + MAX_AMP_AXIS], "D").draw();
		
		// draw y axis tick marks for other amplitudes, we will do 0.1 ticks up to 1,
		const SHORT_TICK_LEN = 5
		for(let i=1; i<= 10; i++){ 
			twoDCtx.beginPath();
			// y axis sin
			twoDCtx.moveTo(xOrigin - SHORT_TICK_LEN, yOrigin - 0.1 * i * CIRC_RAD);
			twoDCtx.lineTo(xOrigin + SHORT_TICK_LEN, yOrigin - 0.1 * i * CIRC_RAD);
			twoDCtx.stroke();
		}
		// label 0.5 and 1.0 on each y sin and y cos axis
		twoDCtx.font = '10px Arial';
		// y sin axis ticks
		twoDCtx.fillText("0.5", xOrigin - 20, yOrigin - 0.1 * 5 * CIRC_RAD);	
		twoDCtx.fillText("1.0", xOrigin - 20, yOrigin - 0.1 * 10 * CIRC_RAD);
		
		// x sine axis time ticks
		// 5 small ticks per major ticks,  user specifies number of major ticks
		let tot_num_ticks = 5 * num_major_ticks;
		for(let i=1; i<= tot_num_ticks; i++){ 
			twoDCtx.beginPath();
			// y axis sin
			let xLoc = xOrigin + i * pix_per_minor_tick;
			twoDCtx.moveTo(xLoc, yOrigin );
			if (i%5 == 0) {
				// major axis tick
				twoDCtx.lineTo(xLoc, yOrigin + 2 * SHORT_TICK_LEN);
				// time is now i*maxTime/20
				twoDCtx.fillText(String(i*maxTime/tot_num_ticks), xLoc - 2, yOrigin + 2 * SHORT_TICK_LEN + 5);
			} else {
				// minor axis tick
				twoDCtx.lineTo(xLoc, yOrigin + SHORT_TICK_LEN);
			}			
			twoDCtx.stroke();
		}
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
	// Draw arrows on the canvas.  In general, arrowLoc consists of 4 xy points
	class Arrow {
		// point, tip1 tip2 and end are all [x,y] point on given context
		constructor( twoD_ctx, arrowLoc, color="black", text="", linewidth =1) 
		{
			this.TwoDContext = twoD_ctx;
			this.Point = arrowLoc.point;
			this.Tip1 = arrowLoc.tip1;
			this.Tip2 = arrowLoc.tip2;
			this.End = arrowLoc.end;
			this.Color = color;
			this.Text = text;
			this.Linewidth = linewidth;
		}
		draw(){
			this.TwoDContext.beginPath();
			this.TwoDContext.moveTo(this.Tip1[0], this.Tip1[1]);
			this.TwoDContext.lineTo(this.Point[0], this.Point[1]);
			this.TwoDContext.moveTo(this.Tip2[0], this.Tip2[1]);
			this.TwoDContext.lineTo(this.Point[0], this.Point[1]);
			this.TwoDContext.moveTo(this.End[0], this.End[1]);
			this.TwoDContext.lineTo(this.Point[0], this.Point[1]);
			this.TwoDContext.strokeStyle = this.Color;
			this.TwoDContext.fillStyle = this.Color;
			this.TwoDContext.font = '20px Arial';
			if (this.End[0] < this.Point[0]) {
				// then on the left side of hemisphere, need to place text further off to left ([0] is x coord )
				if (this.End[1] < this.Point[1]) {
					// are in quadrant 2, upper left side
					//console.log(" quadrant 2");
					this.TwoDContext.fillText(this.Text, this.End[0] -15, this.End[1] - 10);	
				} else {
					this.TwoDContext.fillText(this.Text, this.End[0] -15, this.End[1] + 15);
				}
			} else {
				// text goes off to right of arrow since on right hemisphere 
				this.TwoDContext.fillText(this.Text, this.End[0] + 5, this.End[1] + 5);	
			}
			this.TwoDContext.lineWidth = this.Linewidth;
			this.TwoDContext.stroke();
			this.TwoDContext.closePath();
		}
	};
	class AxisArrow extends Arrow {
		// point is a [x,y] pair and direction is a character for left, right, up, down
		constructor(twoD_ctx, point, direction, color="black")
		{	
			const ARROW_LEN = 10;
			let t1;
			let t2;
			switch (direction) {
				case "L": 		
					t1 = [point[0] + ARROW_LEN, point[1] - ARROW_LEN];
					t2 = [point[0] + ARROW_LEN, point[1] + ARROW_LEN];	
					break;
				case "R": 
					t1 =  [point[0] - ARROW_LEN, point[1] + ARROW_LEN];
					t2 = [point[0] - ARROW_LEN, point[1] - ARROW_LEN];
					break;
				case "U":
					t1 = [point[0] + ARROW_LEN, point[1] + ARROW_LEN];
					t2 = [point[0] - ARROW_LEN, point[1] + ARROW_LEN];
					break;
				case "D":
					t1 = [point[0] + ARROW_LEN, point[1] - ARROW_LEN];
					t2 = [point[0] - ARROW_LEN, point[1] - ARROW_LEN];
					break;
				default:
					console.log("Axis arrow called with bad direction: " + direction);
					// do no harm, make a dot
					t1 = point;
					t2 = point;
			};
			// axis arrows do the axis line someewhere else, just make two arrow ends
			let arrowLoc = {point: point, tip1: t1, tip2: t2, end: point};
			super(twoD_ctx, arrowLoc, color, "",1);
		}
		draw() {
			super.draw();
		}
	};
	