/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      DynamicTrig1.js
 * ============================================================================
 * 
 * DESCRIPTION:
 * Handle user interaction of page with corresponding name (i.e. test1.js handles user
 * interaction for test1.html which is styled by test1.css). 
 * This code manages a unit circle and a user that clicks points around it.  The time
 * it takes the user to go around the circle is measured and the resulting frequency
 * created is plotted.  The user is encouraged to click fewer points, thus going faster,
 * to create higher frequencies (within the Shannon sampling theorem limits).  
 * 
 * DEPENDENCIES:
 * SCRIPT_AUTO_DEMO is the script sent to autodemo.js to execute the automated demo of
 * how the page works as a tutorial to user.
 * - All static files, such as this js, are served over cloud service such as Cloudflare
 * 
 * ARCHITECTURE NOTES:
 *
 * There is no jquery or bootstrap dependency, we do use a "sugar" file that has 
 *    the parts of those libraries we need but uses native HTML/JS:  jqBS-shorthand.js
 * 
 * FIRST PRODUCTION VERSION: 2026-06-07
 * AUTHOR:     C. DeMeyer (with Gemini AI assist)
 * ============================================================================
 */

'use strict'

document.addEventListener('DOMContentLoaded', () => {

	// Hide frequency advice
    $('#ExplnFreqMark')?.css("visibility","hidden")
	$("#GoToNextPage")?.on('click', () => window.location.href = "../DynamicTrig2");
	$("#GoToPreviousPage")?.on('click', () => window.location.href = "../StaticTrig");

	// Handle User Mode (Newbie/Expert)
	const isNewbie = sessionStorage.getItem('UserIsNew')?.toLowerCase();

	if (!isNewbie || isNewbie === 'true') {
		$('#startAutoDemo')?.addClass('newbieMode');
		$('#FirstHelp_DT1')?.addClass('newbieMode');
	} else if (isNewbie === 'false') {
		$('#FirstHelp_DT1')?.addClass('expertMode');
	}

	// Setup Canvas
	let circleDotsCanvas = document.getElementById("AmpSinCosCircle_DT1");
	let ctxUnitCircle = circleDotsCanvas ? circleDotsCanvas.getContext('2d') : null;

	if (!ctxUnitCircle) {
		console.error('Cannot obtain Sin/Cos unit circle context');
	}
	
	const FIRST_USER_BOX_POP_HELP = "1. Click the yellow dot with red arrow labeled Start Here.  Then follow the red arrows as they appear. GO FAST!";
	const SECOND_USER_BOX_POP_HELP = "2. Do it again, but this time skip half the dots.  The red arrows will lead you.  GO FAST!";	
	const THIRD_USER_BOX_POP_HELP = "3. Another try, but this time skip most of the dots.  The red arrows will lead you.  GO FAST!";
	const FOURTH_USER_BOX_POP_HELP = "4. Final try.  The red arrows will lead you.  GO FAST!";
	const FIFTH_USER_BOX_POP_HELP = "5. On your own.  Click start and at least one other point before end point";
	
	const EXPIRATION_TIME_SEC = 30
	
	// When user first enters page, they need to know what dots to hit to create desired
	// effect, slow frequency that increases through these arrows that prompt the user
	// Each set represents one of the dots, starting at 0/360 phase, next set is 30 degrees, etc
	// the elements of the set tell the arrow drawing function where to put the lines
	const ARROW_HELPERS = [
	// 0:  0 degrees
	{	tip1: [345, 338],
		tip2: [338, 345],
		point: [338,338],
		end: [350,350]
	},
	// 1:  30 degrees
	{	tip1: [328, 264],
		tip2: [322, 258],
		point: [322,264],
		end: [335,255]
	},
	// 2:  60 degrees
	{	tip1: [282, 216],
		tip2: [276, 210],
		point: [276,216],
		end: [285,205]
	},
	// 3:  90 degrees
	{	tip1: [225,202],
		tip2: [218,195],
		point: [219,201],
		end: [228,192]
	},
	// 4:  120 degrees
	{	tip1: [136,218],
		tip2: [145,209],
		point: [144,217],
		end: [134,204]
	},
	// 5:  150 degrees
	{	tip1: [87,266],
		tip2: [92,255],
		point: [97,263],
		end: [81,253]
	},
	// 6:  180 degrees
	{	tip1: [84,315],
		tip2: [78,321],
		point: [84,322],
		end: [72,310]
	},
	// 7:  210 degrees
	{	tip1: [90,391],
		tip2: [95,401],
		point: [98,394],
		end: [84,403]
	},
	// 8:  240 degrees
	{	tip1: [137,440],
		tip2: [146,449],
		point: [145,441],
		end: [135,452]
	},
	// 9:  270 degrees
	{	tip1: [197,455],
		tip2: [203,461],
		point: [202,455],
		end: [193,467]
	},
	// 10:  300 degrees
	{	tip1: [272,449],
		tip2: [283,442],
		point: [276,441],
		end: [287,453]
	},	
	// 11:  330 degrees
	{	tip1: [323,403],
		tip2: [328,389],
		point: [322,394],
		end: [336,403]
	},	
	 ];
	const POINT_TO_TIME = 
	{	tip1: [133, 45],
		tip2: [115, 47],
		point: [120,35],
		end: [140,90]
	};

	let numFreqGenSoFar = 0;
	const ANGLE_PER_PT_RAD = Math.PI/6;
	const TOTAL_NUM_DOTS = 2.0 * Math.PI/ANGLE_PER_PT_RAD;
	let ptsClickedOnCircle = 0;  // when user starts clicking, help changes			
	const CIRC_X0 = 210;
	const CIRC_Y0 = 330;
	const HALF_AXIS = CIRC_RAD + AXIS_OVERLAP;
	drawTrigCircle(ctxUnitCircle, CIRC_X0, CIRC_Y0, HALF_AXIS);
	
	// Draw Unit Circle and Interaction Dots. Angle in rad
	let littleDotCenter = [];
	if (ctxUnitCircle) {
		// Draw Background
		ctxUnitCircle.beginPath();
		ctxUnitCircle.arc(CIRC_X0, CIRC_Y0, CIRC_RAD, 0, Math.PI * 2, true);
		ctxUnitCircle.strokeStyle = "black";
		ctxUnitCircle.stroke();

		// Draw Clickable Dots
		for (let pt = 0; pt < TOTAL_NUM_DOTS; pt++) {
			let curr_angle = pt * ANGLE_PER_PT_RAD;
			let x = CIRC_X0 + Math.round(CIRC_RAD * Math.cos(curr_angle));
			let y = CIRC_Y0 - Math.round(CIRC_RAD * Math.sin(curr_angle));
			littleDotCenter.push({x: x, y: y});
			ctxUnitCircle.beginPath();
			ctxUnitCircle.arc(x, y, DOT_RADIUS, 0, 2 * Math.PI, true);
			ctxUnitCircle.fillStyle = 'yellow';
			ctxUnitCircle.fill();
			ctxUnitCircle.stroke();
			ctxUnitCircle.closePath();
		}
	}

	// keep a snapshot of drawing before user interation, need to go back to it on change
	let backgroundPlot; // used when user selects a new yellow dot to clear out the values of the old dot selected
	backgroundPlot = ctxUnitCircle.getImageData(0, 0, circleDotsCanvas.width, circleDotsCanvas.height);

	//********************************************************
	// Start drawing the graph to show the changes in freq and sine plots with respect to time
	// Upper plot is longer view of time and good for low freq, Lower plot is shorter view of time
	// and good for higher freq
	//********************************************************
	// Set up the frequency canvas and acquire drawing context natively
	let freqCanvas = $("#FreqChange_DT1");
	let ctxFreqPlot = freqCanvas ? freqCanvas.getContext('2d') : null;

	if (!ctxFreqPlot) {
		console.error('Cannot obtain Sin/Cos unit circle context, ctxFreqPlot in DynamicTrig1.js');
	}

	const PIX_PER_MINOR_TICK = 13;
	const MAX_AMP_AXIS = CIRC_RAD + 10;
	const UPPER_Y_ORIGIN = 180;
	const UPPER_X_ORIGIN = 60;
	const LOWER_Y_ORIGIN = 500;
	const LOWER_X_ORIGIN = 60;
	const NUM_MAJOR_TICK = EXPIRATION_TIME_SEC/5; 

	// Draw initial bare plots
	let sineAxisBkgd = null; 
	if (ctxFreqPlot) {
		drawSineAxis(ctxFreqPlot, UPPER_X_ORIGIN, UPPER_Y_ORIGIN, 30, PIX_PER_MINOR_TICK, NUM_MAJOR_TICK);
		drawSineAxis(ctxFreqPlot, LOWER_X_ORIGIN, LOWER_Y_ORIGIN, 3, PIX_PER_MINOR_TICK, NUM_MAJOR_TICK);

		// Draw lines inbetween plots to show lower plot is expanded time of upper plot
		let startPt = { start: [UPPER_X_ORIGIN, UPPER_Y_ORIGIN], stop: [LOWER_X_ORIGIN, LOWER_Y_ORIGIN - MAX_AMP_AXIS - 10] };
		let endPt = { start: [UPPER_X_ORIGIN + 3 * PIX_PER_MINOR_TICK, UPPER_Y_ORIGIN], stop: [LOWER_X_ORIGIN + 30 * PIX_PER_MINOR_TICK, LOWER_Y_ORIGIN] };
		drawExpansionLines(ctxFreqPlot, startPt, endPt, "3 sec expanded");

		// Snapshot drawing background state natively
		sineAxisBkgd = ctxFreqPlot.getImageData(0, 0, freqCanvas.width, freqCanvas.height);
	}

	//********************************************************
	// Update graph to show what user has done in both lower and upper plot
	//********************************************************
	function drawOnePlot(x_orig, y_orig, maxTimePlot) {
		if (!ctxFreqPlot) return;
		for (let plotInd = 0; plotInd < freqMeasured.length; plotInd++) {
			let minColorInd = MAX_FREQ - freqMeasured.length;
			let colorInd = minColorInd + plotInd;
			ctxFreqPlot.strokeStyle = FREQ_COLORS[colorInd];
			let currFreq = freqMeasured[plotInd];
			let T = 1 / currFreq;

			function calcSine(j) {
				return Math.round(100 * Math.sin(2 * Math.PI * j * currFreq)); // Using CIRC_RAD = 100
			}

			const TOT_PIX_X_AXIS = PIX_PER_MINOR_TICK * 30;
			let numPts = 40 + 10 * maxTimePlot / T;
			let pixPerPt = TOT_PIX_X_AXIS / numPts;
			let timeInc = maxTimePlot / numPts;

			for (let i = 0; i < numPts; i++) {
				let currTime = (i / numPts) * maxTimePlot;
				let yLo = calcSine(currTime);
				let yHi = calcSine(currTime + timeInc);
				ctxFreqPlot.beginPath();
				ctxFreqPlot.moveTo(x_orig + i * pixPerPt, Math.round(y_orig - yLo));
				ctxFreqPlot.lineTo(x_orig + i * pixPerPt + pixPerPt, Math.round(y_orig - yHi));
				ctxFreqPlot.stroke();
			}
		}
	}

	function drawPlots() {
		if (ctxFreqPlot && sineAxisBkgd) {
			ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
			drawOnePlot(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, 30);
			drawOnePlot(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, 3);
		}
	}

	//********************************************************
	// Add temporary circles and verbiage to show user their new period/freq
	//********************************************************
	const SHOW_FREQ_COLOR = "DarkOrchid";
	const NEXT_PT_COLOR = "red";
	const NEXT_PT_TXT = "Click Here";
	const BEGIN_TEXT = "Start Here";
	const BEGIN_END_TEXT = "Start/End";
	const END_TEXT = "End Here";
	const TIMER_LOC_X = 110;
	const TIMER_LOC_Y = 20;

	function showUserPeriod(latestPeriod) {
		if (!ctxUnitCircle || !ctxFreqPlot) return;
		// draw circle (with line and arrow) around the current time
		ctxUnitCircle.beginPath();
		ctxUnitCircle.lineWidth = 2.0;
		ctxUnitCircle.strokeStyle = SHOW_FREQ_COLOR;
		ctxUnitCircle.arc(TIMER_LOC_X, TIMER_LOC_Y, 18, 0, Math.PI * 2, true);
		ctxUnitCircle.stroke();
		new Arrow(ctxUnitCircle, POINT_TO_TIME, SHOW_FREQ_COLOR, "", 2).draw();
		
		// draw circle (with line and arrow) around the period time on the graph (either upper or lower)
		let arrow_to_graph_time;
		if (latestPeriod > 3) {
			let xcoord = Math.round(UPPER_X_ORIGIN + latestPeriod * PIX_PER_MINOR_TICK);
			ctxFreqPlot.beginPath();
			ctxFreqPlot.lineWidth = 2.0;
			ctxFreqPlot.strokeStyle = SHOW_FREQ_COLOR;
			ctxFreqPlot.arc(xcoord, UPPER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
			ctxFreqPlot.stroke();
			//set up the arrow to point to period circle
			arrow_to_graph_time = {
				tip1: [xcoord - 20, UPPER_Y_ORIGIN + 5],
				tip2: [xcoord - 20, UPPER_Y_ORIGIN + 25],
				point: [xcoord - 15, UPPER_Y_ORIGIN + 15],
				end: [0,200]
			};
		} else {
			let xcoord = Math.round(LOWER_X_ORIGIN + 10 * latestPeriod * PIX_PER_MINOR_TICK);
			ctxFreqPlot.beginPath();
			ctxFreqPlot.lineWidth = 2.0;
			ctxFreqPlot.strokeStyle = SHOW_FREQ_COLOR;
			ctxFreqPlot.arc(xcoord, LOWER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
			ctxFreqPlot.stroke();
			// setup the arrow to point to period circle
			arrow_to_graph_time = {
				tip1: [xcoord - 15, LOWER_Y_ORIGIN - 25],
				tip2: [xcoord - 23, LOWER_Y_ORIGIN - 12],
				point: [xcoord - 15, LOWER_Y_ORIGIN - 15],
				end: [0,200]
			};
		}

		new Arrow(ctxFreqPlot, arrow_to_graph_time, SHOW_FREQ_COLOR, "", 2).draw();
		// put things back to default colors
		ctxUnitCircle.strokeStyle = "black";
		ctxFreqPlot.strokeStyle = "black";
	}


	//********************************************************
	// Initial User Assistance
	//********************************************************
	if (ctxUnitCircle) {
		new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_TEXT, 2).draw();
	}

	let $firstHelp = $('#FirstHelp_DT1');
	if ($firstHelp) $firstHelp.text(FIRST_USER_BOX_POP_HELP);

	function updateContextSensHelp(numFreq) {
		let $helpText = $('#FirstHelp_DT1');
		if (!$helpText) return;

		if ((numFreq == 0) && (ptsClickedOnCircle == 0)) {
			$helpText.text(FIRST_USER_BOX_POP_HELP);
			$helpText.style.visibility = "visible";
			if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_TEXT, 2).draw();
		} else if ((numFreq == 1) && (ptsClickedOnCircle == 0)) {
			$helpText.text(SECOND_USER_BOX_POP_HELP);
			$helpText.style.visibility = "visible";
			if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_TEXT, 2).draw();
		} else if ((numFreq == 2) && (ptsClickedOnCircle == 0)) {
			$helpText.text(THIRD_USER_BOX_POP_HELP);
			$helpText.style.visibility = "visible";
			if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_TEXT, 2).draw();
		} else if ((numFreq == 3) && (ptsClickedOnCircle == 0)) {
			$helpText.text(FOURTH_USER_BOX_POP_HELP);
			$helpText.style.visibility = "visible";
			if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_TEXT, 2).draw();
		} else if ((numFreq == 4) && (ptsClickedOnCircle == 0)) {
			$helpText.text(FIFTH_USER_BOX_POP_HELP);
			$helpText.style.visibility = "visible";
			if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_END_TEXT, 2).draw();
		} else {
			$helpText.style.visibility = "hidden";
		}

		if (numFreq > 4 && ctxUnitCircle) {
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_END_TEXT, 2).draw();
		}
	}

	//******************************************************** 
	// User Interaction clicking yellow dots: Start counting time and collecting phase 
	//******************************************************** 
	let countTime;
	let lastFreq = 0; // used for user messages on performance 
	let timerStarted = false;
	let startInterval;
	let lastIndexClicked = 0;
	let accumPhase = 0;
	// keep track of the last MAX_FREQ frequencies produce by the user 
	let freqMeasured = [];
	const MAX_FREQ = 3;
	// newest freq are navy (000080) and cornflower blue (6495ED) fading to pale blue for older frequencies 
	const FREQ_COLORS = ["#B0E0E6", "#6495ED", "#000080"];
	Object.freeze(FREQ_COLORS);
	const LATEST_FREQ_TEXT = " <- Most Recent";
	const EARLIEST_FREQ_TEXT = " <- Least Recent";

	//******************************************************** 
	//*** start the timer and stop it on expiration or if user hits 360 degrees of phase 
	let stopTimerNow = false; // a request 
	function startFreqMeas() {
		timerStarted = true; // a state 
		countTime = 0;
		let $userNotices = $('#UserNotices_DT1');
		if ($userNotices) $userNotices.textContent = '';

		startInterval = setInterval(function() {
			let $clearBtn = $('#ClearOldFreq_DT1');
			if ($clearBtn) $clearBtn.disabled = true;
			countTime++;

			let $timeVal = $('#timeVal_DT1');
			if ($timeVal) $timeVal.textContent = roundFP(countTime * 0.1, 1).toString();

			let $theta = $('#theta_DT1');
			if ($theta) {
				if (accumPhase == 360) {
					$theta.textContent = "0\u00B0 or 360\u00B0";
				} else {
					$theta.textContent = String(accumPhase) + '\u00B0';
				}
			}

			if ((countTime / 10 == 30) || (stopTimerNow)) { // Assuming EXPIRATION_TIME_SEC = 30
				if (startInterval) clearInterval(startInterval);
				timerStarted = false;
				accumPhase = 0;
				lastIndexClicked = 0;

				if ($clearBtn) $clearBtn.disabled = false;
				if ($theta) {
					if (accumPhase == 360) {
						$theta.textContent = "0\u00B0 or 360\u00B0";
					} else {
						$theta.textContent = String(accumPhase) + '\u00B0';
					}
				}

				if ($timeVal) $timeVal.textContent = '0';
				prepHelpForUser(numFreqGenSoFar);
				stopTimerNow = false;

				if (countTime / 10 == 30) {
					let expireModalEl = $('#expiremodal');
					if (expireModalEl) {
						// Framework-free Native HTML5 Dialog Launch API replaces Bootstrap Modals
						if (typeof expireModalEl.showModal === 'function') {
							expireModalEl.showModal();
						} else {
							expireModalEl.style.display = 'block';
						}
					}
				}
			}

			if (accumPhase >= 360) {
				if (startInterval) clearInterval(startInterval);
				timerStarted = false;
				let minColorInd = 0;

				if (freqMeasured.length == MAX_FREQ) {
					freqMeasured.shift();
				}

				let currFreq = 10 / countTime;
				freqMeasured.push(roundFP(currFreq, 4));
				minColorInd = MAX_FREQ - freqMeasured.length;

				let freqText = '';
				for (let frInd = 0; frInd < freqMeasured.length; frInd++) {
					let colorInd = minColorInd + frInd;
					if ((frInd == 0) && (freqMeasured.length > 1)) {
						freqText = freqText.concat('<span style="color:' + FREQ_COLORS[colorInd] + '">' + freqMeasured[frInd] + EARLIEST_FREQ_TEXT + '<br></span>');
					} else if (frInd == freqMeasured.length - 1) {
						freqText = freqText.concat('<span style="color:' + FREQ_COLORS[colorInd] + '">' + freqMeasured[frInd] + LATEST_FREQ_TEXT + '<br></span>');
					} else {
						freqText = freqText.concat('<span style="color:' + FREQ_COLORS[colorInd] + '">' + freqMeasured[frInd] + '<br></span>');
					}
				}

				let $lastFreqContainer = $('#LastFrequencies_DT1');
				if ($lastFreqContainer) $lastFreqContainer.innerHTML = freqText;

				let $explnMark = $('#ExplnFreqMark');
				if ($explnMark) $explnMark.style.visibility = "visible";

				let $notices = $('#UserNotices_DT1');
				if ($notices) {
					if (lastFreq == 0) {
						$notices.textContent = 'Nice work, lets try another one';
					} else {
						let hzDiff = roundFP((currFreq - lastFreq), 3);
						if (hzDiff > 0) {
							$notices.textContent = 'This time your frequency was higher by ' + hzDiff + ' Hertz (Hz)';
						} else {
							$notices.textContent = 'This time your frequency was lower by ' + (-hzDiff) + ' Hertz (Hz)';
						}
					}
				}

				lastFreq = currFreq;
				if ($clearBtn) $clearBtn.disabled = false;
				accumPhase = 0;
				drawPlots();
				showUserPeriod(countTime / 10);
			}
		}, 100);
	}

	//******************************************************** 
	//*** user clicks a yellow dot 
	//********************************************************
	const ANGLE_PER_PT_DEG = ANGLE_PER_PT_RAD * 180 / Math.PI;
	const RADIUS_VECTOR_COLOR = "green";

	let mainCircleEl = $("#AmpSinCosCircle_DT1");
	(mainCircleEl)?.on('click', (e) => {
			let $firstHelpText = $('#FirstHelp_DT1');
			if ($firstHelpText) $firstHelpText.style.visibility = "hidden";

			let rect = mainCircleEl.getBoundingClientRect();
			let pos;

			if (e instanceof CustomEvent) {
				pos = { x: e.detail.xVal, y: e.detail.yVal };
				} else if (e instanceof PointerEvent) {
					// user clicked on the circle
					pos = {
					  x: e.clientX - rect.left,
					  y: e.clientY - rect.top
					};	
				} 
			else if (e instanceof MouseEvent) {
				// DELETE THIS CODE when Safari and Firefox fix their bug (over 2 yrs old) referred to here
				// https://stackoverflow.com/questions/70626381/why-chrome-emits-pointerevents-and-firefox-mouseevents-and-which-type-definition
				pos = {
				  x: e.clientX - rect.left,
				  y: e.clientY - rect.top
				};			
			} else { console.error('ERROR:  unexpected event: ' + e);}
			
			Object.freeze(pos);
			let ind = 0;
			littleDotCenter.forEach(dot => {
				if (isInside(pos, dot, DOT_RADIUS)) { 
					if (timerStarted) {
						if (ind > lastIndexClicked) {
							accumPhase = roundFP(accumPhase + (ind - lastIndexClicked) * ANGLE_PER_PT_DEG, 1);
							lastIndexClicked = ind;
							if (ctxUnitCircle && backgroundPlot) ctxUnitCircle.putImageData(backgroundPlot, 0, 0);

							if (ctxUnitCircle) {
								ctxUnitCircle.beginPath();
								ctxUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
								ctxUnitCircle.lineTo(dot.x, dot.y);
								ctxUnitCircle.strokeStyle = RADIUS_VECTOR_COLOR;
								ctxUnitCircle.fillStyle = RADIUS_VECTOR_COLOR;
								ctxUnitCircle.lineWidth = 3.0;
								ctxUnitCircle.stroke();
								ctxUnitCircle.closePath();
							}

							ptsClickedOnCircle++;
							let $startOverBtn = $('#StartOver_DT1');

							if (numFreqGenSoFar == 0) {
								if ($startOverBtn) $startOverBtn.style.visibility = "visible";
								if (ptsClickedOnCircle >= TOTAL_NUM_DOTS && ctxUnitCircle) {
									new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, END_TEXT, 2).draw();
								} else if (ctxUnitCircle) {
									new Arrow(ctxUnitCircle, ARROW_HELPERS[ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
								}
							} else if (numFreqGenSoFar == 1) {
								if (2 * ptsClickedOnCircle >= TOTAL_NUM_DOTS && ctxUnitCircle) {
									new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, END_TEXT, 2).draw();
								} else if (ctxUnitCircle) {
									new Arrow(ctxUnitCircle, ARROW_HELPERS[2 * ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
								}
							} else if (numFreqGenSoFar == 2) {
								if (3 * ptsClickedOnCircle >= TOTAL_NUM_DOTS && ctxUnitCircle) {
									new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, END_TEXT, 2).draw();
								} else if (ctxUnitCircle) {
									new Arrow(ctxUnitCircle, ARROW_HELPERS[3 * ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
								}
							} else if (numFreqGenSoFar == 3) {
								if (4 * ptsClickedOnCircle >= TOTAL_NUM_DOTS && ctxUnitCircle) {
									new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, END_TEXT, 2).draw();
								} else if (ctxUnitCircle) {
									new Arrow(ctxUnitCircle, ARROW_HELPERS[4 * ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
								}
							} else if (ctxUnitCircle) {
								new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_END_TEXT, 2).draw();
							}
						} else if (ind == 0 && lastIndexClicked != 0) {
							accumPhase = 360;
							lastIndexClicked = 0;
							numFreqGenSoFar++;
							ptsClickedOnCircle = 0;

							if (ctxUnitCircle && backgroundPlot) ctxUnitCircle.putImageData(backgroundPlot, 0, 0);

							if (ctxUnitCircle) {
								ctxUnitCircle.beginPath();
								ctxUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
								ctxUnitCircle.lineTo(dot.x, dot.y);
								ctxUnitCircle.strokeStyle = RADIUS_VECTOR_COLOR;
								ctxUnitCircle.fillStyle = RADIUS_VECTOR_COLOR;
								ctxUnitCircle.lineWidth = 3.0;
								ctxUnitCircle.stroke();
								ctxUnitCircle.closePath();
							}
							updateContextSensHelp(numFreqGenSoFar);
						}  // end of if ind
					} else {
						if (0 == ind) {
							if (!timerStarted) {
								startFreqMeas();
							}
							accumPhase = 0;
							lastIndexClicked = ind;
							if (ctxUnitCircle && backgroundPlot) ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
							ptsClickedOnCircle++;

							let $startOverBtn = $('#StartOver_DT1');
							if (numFreqGenSoFar == 0) {
								if ($startOverBtn) $startOverBtn.style.visibility = "visible";
								if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
							} else if (numFreqGenSoFar == 1) {
								if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[2 * ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
							} else if (numFreqGenSoFar == 2) {
								if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[3 * ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
							} else if (numFreqGenSoFar == 3) {
								if (ctxUnitCircle) new Arrow(ctxUnitCircle, ARROW_HELPERS[4 * ptsClickedOnCircle], NEXT_PT_COLOR, NEXT_PT_TXT, 2).draw();
							} else if (ctxUnitCircle) {
								new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_END_TEXT, 2).draw();
							}
						}
					} // end of if timer started
				}
				ind = ind + 1;
			});
		});


	//******************************************************** 
	// this function used when user hits clear or start over 
	//******************************************************** 
	function clearPage(wipeGraphs = true) {
		// if the clock is running, stop it 
		// go back to bare plots 
		if (ctxFreqPlot && sineAxisBkgd) {
			ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);
		}

		if (wipeGraphs) {
			// wipe out all old freq from graphs 
			freqMeasured = [];
			let $lastFreq = $('#LastFrequencies_DT1');
			if ($lastFreq) $lastFreq.textContent = '';
		} else {
			// redraw the old freq for the demo mode 
			drawPlots();
		}

		if (ctxUnitCircle && backgroundPlot) {
			ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
		}

		let $timeVal = $('#timeVal_DT1');
		if ($timeVal) $timeVal.textContent = '0';
		
		$('#ExplnFreqMark')?.css("visibility","hidden")

		let $theta = $('#theta_DT1');
		if ($theta) $theta.textContent = '0' + '\u00B0';

		let $userNotices = $('#UserNotices_DT1');
		if ($userNotices) $userNotices.textContent = '';

		// initial condition 
		if (ctxUnitCircle) {
			new Arrow(ctxUnitCircle, ARROW_HELPERS[0], NEXT_PT_COLOR, BEGIN_TEXT, 2).draw();
		}

		if (timerStarted) stopTimerNow = true; // in case timer is running, stop it 
	}

	//******************************************************** 
	//*** user clicks the Clear button 
	//******************************************************** 
	let $clearBtn = $('#ClearOldFreq_DT1');
	if ($clearBtn) {
		$clearBtn.on('click', function() {
			clearPage();
		});
	}

	//******************************************************** 
	//*** user wants to start over with the handholding help that first directs them to hit 
	// every dot (getting a lower freq) then every other dot (getting a higher freq) then do it your 
	// way and max out freq. 
	//******************************************************** 
	function prepHelpForUser(segment = 0) {
		if (0 == segment) {
			// user is starting over from very beginning 
			let $startOverBtn = $('#StartOver_DT1');
			if ($startOverBtn) $startOverBtn.style.visibility = "hidden";

			clearPage();
			lastFreq = 0; // used for user messages on performance, forget all frequencies generated before 
		} else {
			// we are in the middle of a demo and we want to go back to specific context sens help and 
			// keep graphs off to right 
			clearPage(false);
		}

		numFreqGenSoFar = segment; // segment in demo is how many freq one has generated 
		ptsClickedOnCircle = 0;

		// chances are first help is obsolete now.. get rid of old and update with new value 
		let $firstHelp = $('#FirstHelp_DT1');
		if ($firstHelp) $firstHelp.style.visibility = "hidden";

		updateContextSensHelp(segment);
	}

	let $startOver = $('#StartOver_DT1');
	if ($startOver) {
		$startOver.on('click', function(event) {
			prepHelpForUser(); // always start over from 0 for user button 
		});
	}

	//********************************************************
	// create a "script" for the auto-demo tutorial, by now, all variables should be set
	//********************************************************	
	const SCRIPT_AUTO_DEMO = [
		{
			segmentName: "First frequency",
			headStartForAudioMillisec: 16000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'DynamicTrig1Seg0' }
					},
					// this of course relys on fact that demo canvas, funTutorial_DT1, exactly overlays the canvas, AmpSinCosCircle_DT1, we plan to annotate
					{
						segmentActivity: "ANNOTATION",
						segmentParams:
						{
							circleCenter: { x: TIMER_LOC_X, y: TIMER_LOC_Y, radius: 20 },
							color: "red",
							waitTimeMillisec: 20000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[0],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[1],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[2],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[3],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[4],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[5],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[6],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[7],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[8],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[9],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[10],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[11],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[0],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
				]
		},
		{
			segmentName: "Double the speed",
			headStartForAudioMillisec: 20000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'DynamicTrig1Seg1' }
					},
					// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[0],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[2],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[4],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[6],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[8],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[10],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[0],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},

				]
		},
		{
			segmentName: "Faster still",
			headStartForAudioMillisec: 16000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'DynamicTrig1Seg2' }
					},
					// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[0],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[3],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[6],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[9],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[0],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},

				]
		},
		{
			segmentName: "Fastest Of All",
			headStartForAudioMillisec: 10000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'DynamicTrig1Seg3' }
					},
					// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[0],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[4],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[8],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},
					{
						segmentActivity: "CLICK_ON_CANVAS",
						segmentParams:
						{
							xyCoord: littleDotCenter[0],
							canvas: circleDotsCanvas,
							waitTimeMillisec: 1000
						}
					},

				]
		}
	];

	//**************************************************************************** 
	// User initiates autoDemo activity 
	//**************************************************************************** 
	//*** user clicks the start demo image, iniitalize everything 
	// give the demo the full script natively
	let demo = new AutoDemoWithCanvas(SCRIPT_AUTO_DEMO, 'funTutorial_DT1');

	let $startAutoDemoBtn = $('#startAutoDemo');
	if ($startAutoDemoBtn) {
		$startAutoDemoBtn.on('click', function() {
			// clear out any previous user activity 
			prepHelpForUser();
			// prep the controls for user to interact with auto demo 
			demo.prepDemoControls();
		});
	}

	//**************************************************************************** 
	// User has interacted with autoDemo controls 
	//**************************************************************************** 
	// User has selected play 
	let $playSegmentBtn = $('#playSegment');
	if ($playSegmentBtn) {
		$playSegmentBtn.on('click', function() {
			// user may have chosen a segment out of order 
			prepHelpForUser(demo.getCurrSeg());
			demo.startDemo();
		});
	}

	let $stopSegmentBtn = $('#stopSegment');
	if ($stopSegmentBtn) {
		$stopSegmentBtn.on('click', function() {
			demo.stopThisSegment(false); // we don't want to destroy controls box 
			// stop the timer request 
			stopTimerNow = true;
			// need to get the help set up for correct segment we think we are on 
			prepHelpForUser(demo.getCurrSeg());
		});
	}

	let $dismissAutoDemoBtn = $('#dismissAutoDemo');
	if ($dismissAutoDemoBtn) {
		$dismissAutoDemoBtn.on('click', function() {
			// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen 
			demo.stopThisSegment(); // may or may not be needed 
			// stop the timer request 
			stopTimerNow = true;
		});
	}

	let $segNumSelect = $("#segNum");
	if ($segNumSelect) {
		$segNumSelect.on('change', function() {
			// Native element .value retrieval handles the conversion smoothly
			demo.setCurrSeg(parseInt($segNumSelect.value));

			// remove the class so the animation will work on next page, cant do this until animation completes 
			let $clickHereCursor = $('#clickHereCursor');
			if ($clickHereCursor) {
				$clickHereCursor.classList.remove('userHitPlay');
			}
		});
	}

}); 
