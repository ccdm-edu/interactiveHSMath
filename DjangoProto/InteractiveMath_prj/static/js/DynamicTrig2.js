/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      DynamicTrig2.js
 * ============================================================================
 * 
 * DESCRIPTION:
 * Handle user interaction of page with corresponding name (i.e. test1.js handles user
 * interaction for test1.html which is styled by test1.css).  
 * 
 * DEPENDENCIES:
 * Here we keep track of time but this code samples the unit circle faster and slower with min
 * frequency of 0.1 Hz and max of 2 Hz.  The idea here is for user to observe and prove
 * to themselves that theta=2*pi*freq*time.  The frequencies created are plotted to right
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

// Native DOMContentLoaded wrapper replaces legacy jQuery selection layers
document.addEventListener('DOMContentLoaded', () => {

	$("#GoToNextPage")?.on('click', () => window.location.href = "../ToneTrig");
	$("#GoToPreviousPage")?.on('click', () => window.location.href = "../DynamicTrig1");

	// Handle User Layout Mode Configuration Setup
	const isNewbie = sessionStorage.getItem('UserIsNew')?.toLowerCase();
	if (isNewbie === 'true') {
		$('#startAutoDemo')?.addClass('newbieMode');
	} else if (isNewbie === 'false') {
		$('#FirstHelp_DT2')?.css('visibility', 'visible'); 
	}

	let ctxUnitCircle;
	const EXPANDED_TIME = 2;
	const MAX_TIME_SEC = 10;
	const MAX_FREQ_ALLPT = 1;
	const PIX_PER_MINOR_TICK = 17;
	const MAX_AMP_AXIS = 110; // CIRC_RAD + 10 assuming CIRC_RAD is 100
	const PERIOD_COLOR = 'DarkOrchid';
	const SINE_COLOR = "blue";
	const RADIUS_VECTOR_COLOR = "black";
	const SINE_OUTLINE_COLOR = "PaleTurquoise";
	const ANGLE_COLOR = 'green';
	const ANGLE_PER_PT_RAD = Math.PI / 6;
	const TOTAL_NUM_DOTS = 12.0;

	// NOTE: We keep the sample rate around the circle less than 2 Hz because at 
	// about 3 Hz to 30 Hz, flashing can potentially trigger photosensitive seizures. 
	// Reference: https://epilepsysociety.org.uk/about-epilepsy/epileptic-seizures/seizure-triggers/photosensitive-epilepsy

	// Setup Unit Circle Canvas Context Natively
	let circleDotsCanvas = $("#AmpSinCosCircle_DT2");
	if (circleDotsCanvas) {
		ctxUnitCircle = circleDotsCanvas.getContext('2d');
	} else {
		console.error('Cannot obtain Sin/Cos unit circle context ctxUnitCircle from DynamicTrig2.js');
	}

	let sineAxisBkgd;
	let thetaSamp = [];
	const EPSILON = 15;

	// Radian index definitions for unit circle mappings
	thetaSamp[0] = { num: 0, thetaInRad: "(2" + PI + ")" + MULT_DOT + "0/12", angleRadCCW: 0, moveX: EPSILON, moveY: -EPSILON };
	// FIX: Resolved loose brace 'ang};' compile crash syntax typo
	thetaSamp[1] = { num: 1, thetaInRad: "(2" + PI + ")" + MULT_DOT + "1/12", angleRadCCW: 11 * Math.PI / 6, moveX: EPSILON, moveY: 0 };
	thetaSamp[2] = { num: 2, thetaInRad: "(2" + PI + ")" + MULT_DOT + "2/12", angleRadCCW: 5 * Math.PI / 3, moveX: EPSILON, moveY: 0 };
	thetaSamp[3] = { num: 3, thetaInRad: "(2" + PI + ")" + MULT_DOT + "3/12", angleRadCCW: 3 * Math.PI / 2, moveX: EPSILON, moveY: -EPSILON };
	thetaSamp[4] = { num: 4, thetaInRad: "(2" + PI + ")" + MULT_DOT + "4/12", angleRadCCW: (4 / 3) * Math.PI, moveX: -3 * EPSILON, moveY: -EPSILON };
	thetaSamp[5] = { num: 5, thetaInRad: "(2" + PI + ")" + MULT_DOT + "5/12", angleRadCCW: 7 * Math.PI / 6, moveX: -4 * EPSILON, moveY: -EPSILON };
	thetaSamp[6] = { num: 6, thetaInRad: "(2" + PI + ")" + MULT_DOT + "6/12", angleRadCCW: Math.PI, moveX: -4 * EPSILON, moveY: -EPSILON };
	thetaSamp[7] = { num: 7, thetaInRad: "(2" + PI + ")" + MULT_DOT + "7/12", angleRadCCW: 5 * Math.PI / 6, moveX: -5 * EPSILON, moveY: 0 };
	thetaSamp[8] = { num: 8, thetaInRad: "(2" + PI + ")" + MULT_DOT + "8/12", angleRadCCW: 2 * Math.PI / 3, moveX: -5 * EPSILON, moveY: 0 };
	thetaSamp[9] = { num: 9, thetaInRad: "(2" + PI + ")" + MULT_DOT + "9/12", angleRadCCW: Math.PI / 2, moveX: -4.5 * EPSILON, moveY: 1.5 * EPSILON };
	thetaSamp[10] = { num: 10, thetaInRad: "(2" + PI + ")" + MULT_DOT + "10/12", angleRadCCW: Math.PI / 3, moveX: EPSILON, moveY: EPSILON };
	thetaSamp[11] = { num: 11, thetaInRad: "(2" + PI + ")" + MULT_DOT + "11/12", angleRadCCW: Math.PI / 6, moveX: EPSILON, moveY: EPSILON };

	const HALF_AXIS = 130; // Assuming CIRC_RAD = 100 + AXIS_OVERLAP = 30
	const CIRC_X0 = 210;
	const CIRC_Y0 = 170;
	
	// keep a snapshot of drawing before user interation, need to go back to it on change
    let backgroundPlot; // used when user selects a new yellow dot to clear out the values of the old dot selected
	let sample = [];
	if (ctxUnitCircle) {
		drawTrigCircle(ctxUnitCircle, CIRC_X0, CIRC_Y0, HALF_AXIS);
		ctxUnitCircle.beginPath();
		ctxUnitCircle.lineWidth = 1.0;
		ctxUnitCircle.strokeStyle = "black";
		ctxUnitCircle.arc(CIRC_X0, CIRC_Y0, 100, 0, Math.PI * 2, true);
		ctxUnitCircle.stroke();

		for (let pt = 0; pt < TOTAL_NUM_DOTS; pt++) {
			let curr_angle = pt * ANGLE_PER_PT_RAD;
			let x = CIRC_X0 + Math.round(100 * Math.cos(curr_angle));
			let y = CIRC_Y0 - Math.round(100 * Math.sin(curr_angle));
			sample.push({ x: x, y: y });

			ctxUnitCircle.beginPath();
			ctxUnitCircle.arc(x, y, DOT_RADIUS, 0, 2 * Math.PI, true); 
			ctxUnitCircle.fillStyle = "yellow";
			ctxUnitCircle.fill();
			ctxUnitCircle.stroke();
			ctxUnitCircle.closePath();

			ctxUnitCircle.font = "15px Georgia";
			ctxUnitCircle.fillStyle = ANGLE_COLOR;
			ctxUnitCircle.fillText(thetaSamp[pt].thetaInRad, x + thetaSamp[pt].moveX, y + thetaSamp[pt].moveY);
		}
		backgroundPlot = ctxUnitCircle.getImageData(0, 0, circleDotsCanvas.width, circleDotsCanvas.height);
	}  // end of if (ctxUnitCircle)

	// Setup Linear Time/Frequency Graphing Context Natively
	let ctxFreqPlot;
	let freqCanvas = $("#FreqChange_DT2");
	if (freqCanvas) {
		ctxFreqPlot = freqCanvas.getContext('2d');
	} else {
		console.error('Cannot obtain Sin/Cos unit circle context, ctxFreqPlot from DynamicTrig2.js');
	}

	const UPPER_Y_ORIGIN = 180;
	const UPPER_X_ORIGIN = 60;
	const LOWER_Y_ORIGIN = 500;
	const LOWER_X_ORIGIN = 60;

	if (ctxFreqPlot && freqCanvas) {
		drawSineAxis(ctxFreqPlot, UPPER_X_ORIGIN, UPPER_Y_ORIGIN, MAX_TIME_SEC, PIX_PER_MINOR_TICK, 4);
		drawSineAxis(ctxFreqPlot, LOWER_X_ORIGIN, LOWER_Y_ORIGIN, MAX_TIME_SEC / 5, PIX_PER_MINOR_TICK, 4);

		// Sync input components through vanilla layout element mapping properties
		let $freqSlider = $("#FreqSlider_DT2");
		let currFreq = $freqSlider ? $freqSlider.value : "1";

		//There are several locations that must all be updated
		document.querySelectorAll(".currFreqVal_DT2").forEach(el => {
    		el.textContent =  currFreq + " Hz"
		});	

		let $labelHi = $("#sinEqtnLabelHI_DT2");
		let $labelLo = $("#sinEqtnLabelLO_DT2");
		let labelString = "S=sin(2" + MULT_DOT + PI + MULT_DOT + "f" + MULT_DOT + "t)=sin(2" + MULT_DOT + PI + MULT_DOT + currFreq + MULT_DOT + "t)";
		if ($labelHi) $labelHi.textContent = labelString;
		if ($labelLo) $labelLo.textContent = labelString;

		let startPt = { start: [UPPER_X_ORIGIN, UPPER_Y_ORIGIN], stop: [LOWER_X_ORIGIN, LOWER_Y_ORIGIN - MAX_AMP_AXIS - 10] };
		let endPt = { start: [UPPER_X_ORIGIN + 4 * PIX_PER_MINOR_TICK, UPPER_Y_ORIGIN], stop: [LOWER_X_ORIGIN + 20 * PIX_PER_MINOR_TICK, LOWER_Y_ORIGIN] };
		drawExpansionLines(ctxFreqPlot, startPt, endPt, EXPANDED_TIME + " sec expanded");

		sineAxisBkgd = ctxFreqPlot.getImageData(0, 0, freqCanvas.width, freqCanvas.height);
	}

	function calcSine(j, phaseInRad = 0) {
		let $freqSlider = $("#FreqSlider_DT2");
		let activeFreq = $freqSlider ? parseFloat($freqSlider.value) : 1.0;
		return Math.round(100 * Math.sin(2 * Math.PI * j * activeFreq + phaseInRad));
	}

	function drawOneSineSet(x_orig, y_orig, maxTimePlot) {
		if (!ctxFreqPlot) return;
		ctxFreqPlot.strokeStyle = SINE_OUTLINE_COLOR;
		let $freqSlider = $("#FreqSlider_DT2");
		let activeFreq = $freqSlider ? parseFloat($freqSlider.value) : 1.0;
		let T = 1 / activeFreq;

		const TOT_PIX_X_AXIS = PIX_PER_MINOR_TICK * 20;
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

	//************************************************* 
	// Reset the page to the defaults 
	//************************************************* 
	let DEFAULT_FREQ = 0.1; // as set in html for element 
	let currFreq = DEFAULT_FREQ;
	let $goBtn = $('#GoFreq_DT2');
	$('#SubSampleNotice_DT2')?.css("display","none")

	function resetToDefaults() {
		let $freqSlider = $("#FreqSlider_DT2");
		if ($freqSlider) $freqSlider.value = DEFAULT_FREQ;

		// get slider value and put it on the label as string 
		let activeVal = $freqSlider ? $freqSlider.value : String(DEFAULT_FREQ);
		//There are several locations that must all be updated
		document.querySelectorAll(".currFreqVal_DT2").forEach(el => {
    		el.textContent =  activeVal + " Hz"
		});

		// update global var 
		currFreq = parseFloat(activeVal);

		// turn off the sampler, first turn off timer 
		if (startInterval) clearInterval(startInterval);
		clockIsRunning = false;

		// set up button to go again 
		if ($goBtn) {
			$goBtn.style.backgroundColor = (typeof currentGreen !== 'undefined') ? currentGreen : 'green';
		}

		// clear out the unit circle and graphs now that timer is stopped 
		if (ctxUnitCircle && backgroundPlot) ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
		if (ctxFreqPlot && sineAxisBkgd) ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);

		// restart the table values 
		startOverValues();

		// clock is not running, need to manually clean up the table values 
		let $timeLabels = $$('.timeVal_DT2');
		$timeLabels.forEach(el => el.textContent = "0 sec");

		$$(".ThetaUC_eqtn").forEach(el => {
    		el.textContent =  thetaSamp[0].thetaInRad;
		});

		$('#observeAnswer')?.text(`2${PI}(0 + ${thetaSamp[0].num}/12)`);
		$('#expectAnswer')?.text(`2${PI}(0 + 0/12)`);

		//There are several locations that must all be updated
		$$(".N_eqtn").forEach(el => { el.textContent =  "0" });

		// get rid of any possible user notifications about the graphs, which are now irrelevant 
		$('#UserNotices_DT2')?.text("");
		$('#SubSampleNotice_DT2')?.css("display","none")

	}

	//************************************************* 
	//*** update unit circle to dynamically show freq 
	//************************************************* 
	let startInterval;
	const TWO_PI_RAD = 2.0 * Math.PI;
	const SUBSCRIPT_U = '\u1d64'; // subscript u is "theta on the unit circle" 

	// these need to be available for resuming after a pause, initialize for first run 
	let countTic = 0;
	let phaseInRad = 0;
	let numCycles = 0; // num times around circle 
	let ind = 0; // num points processed 

	function startOverValues() {
		countTic = 0;
		phaseInRad = 0;
		numCycles = 0;
		ind = 0;
	}

	function startFreqSample(startOver = true) {
		if (startOver) {
			startOverValues();
		}

		// 20 ticks per top or bottom expanded axis 
		const TICKS_PER_MAX_TIME = 20 / MAX_TIME_SEC;
		const TICKS_PER_EXP_TIME = 20 / EXPANDED_TIME;

		// this value can NEVER go below 10 ms or browser will change it to 10 ms but in practice, 
		// it should not go below 40 ms or browser can't keep up 
		let timeIntMs = roundFP(1000 / (currFreq * TOTAL_NUM_DOTS), 1);

		startInterval = setInterval(function() {
			let currPeriod = 1 / currFreq;
			// adding timeIntMs but simplifying to avoid round-off error 
			let timeInS = roundFP(countTic / (currFreq * TOTAL_NUM_DOTS), 3);
			ind = ind % TOTAL_NUM_DOTS;

			// update the user experience 
			$$('.timeVal_DT2').each(el => el.text(`${roundFP(timeInS, 1)} sec`));

			$$(".ThetaUC_eqtn").each(el => el.text(thetaSamp[ind].thetaInRad));

			$('#observeAnswer')?.text(`2${PI}(${numCycles} + ${thetaSamp[ind].num}/12)`);

			// handle the right side of the equation, final line, need to turn the decimal value into fraction with same denom as left side 
			let calcVal = currFreq * timeInS;
			let intCalcVal = Math.floor(calcVal);
			let fracNum = Math.round((calcVal - intCalcVal) * 12);

			$('#expectAnswer')?.text(`2${PI}(${intCalcVal} + ${fracNum}/12)`);

			phaseInRad += ANGLE_PER_PT_RAD;

			if ((countTic % TOTAL_NUM_DOTS) == 0) {
				numCycles = countTic / TOTAL_NUM_DOTS;
				//There are several locations that must all be updated
				$$(".N_eqtn").forEach(el => {el.textContent =  numCycles });
			}

			if (countTic == TOTAL_NUM_DOTS) {
				// first cycle has completed, update labels and circle around T on appropriate graph only once 
				phaseInRad = phaseInRad % TWO_PI_RAD;

				$('#period_DT2')?.text(roundFP(currPeriod, 3).toString());
				$('#UserNotices_DT2')?.text(`Period T = 1/f = 1/(${currFreq}Hz) = ${roundFP(currPeriod, 1)} sec as circled in purple on graphs`);
				(currFreq >= MAX_FREQ_ALLPT)?$('#SubSampleNotice_DT2').css("display","block"):$('#SubSampleNotice_DT2').css("display","none")
				// draw a circle on the period T on the graph to right 
				if (ctxFreqPlot) {
					if (currPeriod > EXPANDED_TIME) {
						let xcoord = Math.round(UPPER_X_ORIGIN + currPeriod * PIX_PER_MINOR_TICK * TICKS_PER_MAX_TIME);
						ctxFreqPlot.beginPath();
						ctxFreqPlot.lineWidth = 2.0;
						ctxFreqPlot.strokeStyle = PERIOD_COLOR;
						ctxFreqPlot.arc(xcoord, UPPER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
						ctxFreqPlot.stroke();
					} else {
						let xcoord = Math.round(LOWER_X_ORIGIN + currPeriod * PIX_PER_MINOR_TICK * TICKS_PER_EXP_TIME);
						ctxFreqPlot.beginPath();
						ctxFreqPlot.lineWidth = 2.0;
						ctxFreqPlot.strokeStyle = PERIOD_COLOR;
						ctxFreqPlot.arc(xcoord, LOWER_Y_ORIGIN, 15, 0, Math.PI * 2, true);
						ctxFreqPlot.stroke();
					}
				}
			}  // end of if (countTic == TOTAL_NUM_DOTS)

			// draw line from axis to sine sample on both graphs to the right 
			let sampY = calcSine(timeInS);
			let countPoint = countTic % 12;

			if (ctxFreqPlot) {
				if (timeInS <= MAX_TIME_SEC) {
					if ((currFreq < MAX_FREQ_ALLPT) || ((currFreq >= MAX_FREQ_ALLPT) && (countPoint % 3 == 0))) {
						let xcoord = Math.round(UPPER_X_ORIGIN + (timeInS / MAX_TIME_SEC) * 20 * PIX_PER_MINOR_TICK);
						ctxFreqPlot.beginPath();
						ctxFreqPlot.lineWidth = 3.0;
						ctxFreqPlot.strokeStyle = SINE_COLOR;
						ctxFreqPlot.moveTo(xcoord, UPPER_Y_ORIGIN);
						ctxFreqPlot.lineTo(xcoord, Math.round(UPPER_Y_ORIGIN - sampY));
						ctxFreqPlot.stroke();
						ctxFreqPlot.closePath();

						ctxFreqPlot.beginPath();
						ctxFreqPlot.arc(xcoord, Math.round(UPPER_Y_ORIGIN - sampY), 3, 0, 2 * Math.PI, true);
						ctxFreqPlot.fillStyle = SINE_COLOR;
						ctxFreqPlot.fill();
						ctxFreqPlot.stroke();
						ctxFreqPlot.closePath();
					}
				}

				if (timeInS <= EXPANDED_TIME) {
					let xcoord = Math.round(LOWER_X_ORIGIN + (timeInS / EXPANDED_TIME) * 20 * PIX_PER_MINOR_TICK);
					ctxFreqPlot.beginPath();
					ctxFreqPlot.lineWidth = 3.0;
					ctxFreqPlot.strokeStyle = SINE_COLOR;
					ctxFreqPlot.moveTo(xcoord, LOWER_Y_ORIGIN);
					ctxFreqPlot.lineTo(xcoord, Math.round(LOWER_Y_ORIGIN - sampY));
					ctxFreqPlot.stroke();
					ctxFreqPlot.closePath();

					ctxFreqPlot.beginPath();
					ctxFreqPlot.arc(xcoord, Math.round(LOWER_Y_ORIGIN - sampY), 3, 0, 2 * Math.PI, true);
					ctxFreqPlot.fillStyle = SINE_COLOR;
					ctxFreqPlot.fill();
					ctxFreqPlot.stroke();
					ctxFreqPlot.closePath();
				}
			}  // end of if (ctxFreqPlot)

			if (ctxUnitCircle && backgroundPlot) {
				// every time sample, put unit circle back to "clean" initial state 
				ctxUnitCircle.putImageData(backgroundPlot, 0, 0);

				// draw line from center of unit circle to sample point on circle 
				ctxUnitCircle.beginPath();
				ctxUnitCircle.moveTo(CIRC_X0, CIRC_Y0);
				ctxUnitCircle.lineTo(sample[ind].x, sample[ind].y);
				ctxUnitCircle.strokeStyle = RADIUS_VECTOR_COLOR;
				ctxUnitCircle.lineWidth = 1.0;
				ctxUnitCircle.stroke();
				ctxUnitCircle.closePath();

				// draw the vertical sine portion on the unit circle 
				ctxUnitCircle.beginPath();
				ctxUnitCircle.moveTo(sample[ind].x, sample[ind].y);
				ctxUnitCircle.lineTo(sample[ind].x, CIRC_Y0);
				ctxUnitCircle.strokeStyle = SINE_COLOR;
				ctxUnitCircle.lineWidth = 3.0;
				ctxUnitCircle.stroke();
				ctxUnitCircle.closePath();

				// create angle indicator 
				ctxUnitCircle.beginPath();
				ctxUnitCircle.arc(CIRC_X0, CIRC_Y0, 2 * ANGLE_IND, 0, thetaSamp[ind].angleRadCCW, true);
				ctxUnitCircle.lineWidth = 1.0;
				ctxUnitCircle.strokeStyle = ANGLE_COLOR;
				ctxUnitCircle.fillStyle = ANGLE_COLOR;
				ctxUnitCircle.font = '20px Arial';
				ctxUnitCircle.fillText(THETA + SUBSCRIPT_U, CIRC_X0 + 2 * ANGLE_IND, CIRC_Y0 - ANGLE_IND / 2);
				ctxUnitCircle.stroke();
				ctxUnitCircle.closePath();

				// done now, increment time to next value
				ind += 1;
				countTic++;

			}  // end of if (ctxUnitCircle && backgroundPlot)
		}, timeIntMs);
	}
	//*********************************** 
	//*** User interaction 
	//*********************************** 
	let clockIsRunning = false;
	$("#GoFreq_DT2").click(function() {
		let $firstHelp = $('#FirstHelp_DT2');
		if ($firstHelp) $firstHelp.style.visibility = "hidden";
		let textEl = this.find(".btn-text");
		let iconEl = this.find(".btn-icon");

		if (textEl.text() === "Start") {
			// plot new freq sin graphs
			drawOneSineSet(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, MAX_TIME_SEC);
			drawOneSineSet(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPANDED_TIME);
			textEl.text("Pause");
			iconEl.text("⏸️");
			this.style.backgroundColor = 'hsl(0,100%,80%)';
			clockIsRunning = true;
			startFreqSample(false);
		} else {
			if (startInterval) clearInterval(startInterval);
			clockIsRunning = false;
			textEl.text("Start");
			iconEl.text("⚡");
			this.style.backgroundColor = currentGreen;
		}
	});

	// allow other functions to clear for a restart 
	function clearStartOver() {
		if (ctxFreqPlot && sineAxisBkgd) ctxFreqPlot.putImageData(sineAxisBkgd, 0, 0);

		drawOneSineSet(UPPER_X_ORIGIN, UPPER_Y_ORIGIN, MAX_TIME_SEC);
		drawOneSineSet(LOWER_X_ORIGIN, LOWER_Y_ORIGIN, EXPANDED_TIME);

		if (ctxUnitCircle && backgroundPlot) ctxUnitCircle.putImageData(backgroundPlot, 0, 0);
		startOverValues();

		if (!clockIsRunning) {

			$$('.timeVal_DT2').each(el => el.text("0 sec"));
			$$(".ThetaUC_eqtn").each(el => el.text(thetaSamp[0].thetaInRad));
		
			$('#observeAnswer')?.text(`2${PI}(0 + ${thetaSamp[0].num}/12)`);
			$('#expectAnswer')?.text(`2${PI}(0 + 0/12)`);

			//There are several locations that must all be updated
			$$(".N_eqtn").each(el => el.text("0"));
		}

		$('#UserNotices_DT2')?.text("");
		$('#SubSampleNotice_DT2')?.css("display","none")

	}

	let $clearBtn = $('#Clear_DT2');
	if ($clearBtn) {
		$clearBtn.on('click', function() {
			clearStartOver();
		});
	}

	// make a nice blinky green to attract attention on the go button and a red background when its stop 
	const PALE_GREEN = 'hsl(120, 100%, 80%)';
	const FULL_GREEN = 'hsl(120, 100%, 50%)';
	let currentGreen = FULL_GREEN;

	if ($goBtn) $goBtn.style.backgroundColor = currentGreen;

	setInterval(function() {
		if (!clockIsRunning && $goBtn) {
			$goBtn.style.backgroundColor = currentGreen;
			currentGreen = (currentGreen == PALE_GREEN) ? FULL_GREEN : PALE_GREEN;
		}
	}, 700);

	//*********************************** 
	//*** Change label on freq slider and adjust the tone as appropriate 
	let $freqSlider = $('#FreqSlider_DT2');
	if ($freqSlider) {
		$freqSlider.on('change', function() {
			let activeVal = $freqSlider.value;

			//There are several locations that must all be updated
			$$(".currFreqVal_DT2").each(el => el.text(`${activeVal} Hz`));

			currFreq = parseFloat(activeVal);
			clearStartOver();

			const labelString = `S=sin(2${MULT_DOT}${PI}${MULT_DOT}f${MULT_DOT}t)=sin(2${MULT_DOT}${PI}${MULT_DOT}${currFreq}${MULT_DOT}t)`;
			$$("#sinEqtnLabelHI_DT2, #sinEqtnLabelLO_DT2").each(el => el.text(labelString));

			if (startInterval) clearInterval(startInterval);
			if (clockIsRunning) {
				startFreqSample();
			}
		});
	}

	//****************************************************************************
	// Autodemo script for dynamic trig 2
	//**************************************************************************** 
	const SCRIPT_AUTO_DEMO = [
		{
			segmentName: "Observed Theta",
			headStartForAudioMillisec: 103000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'DynamicTrig2Seg0' }
					},

					// now hit go button to execute
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#GoFreq_DT2',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 15, y: 20 },
							waitTimeMillisec: 8000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#GoFreq_DT2',
							action: "nothing",
							waitTimeMillisec: 5000
						}
					},
				]
		},
		{
			segmentName: "Calculate theta",
			headStartForAudioMillisec: 51000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'DynamicTrig2Seg1' }
					},

					// now hit go button to execute
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#GoFreq_DT2',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 15, y: 20 },
							waitTimeMillisec: 6000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#GoFreq_DT2',
							action: "nothing",
							waitTimeMillisec: 20000
						}
					},
					//Pause and calculate values to verify
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#GoFreq_DT2',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 15, y: 20 },
							waitTimeMillisec: 1000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#GoFreq_DT2',
							action: "nothing",
							waitTimeMillisec: 3000
						}
					},
				]
		},
		{
			segmentName: "Increase frequency",
			headStartForAudioMillisec: 1000, // generally the audio is longer than the cursor/annotate activity
			segmentActivities:
				[
					{
						segmentActivity: "PLAY_AUDIO",
						segmentParams:
							{ filenameURL: 'DynamicTrig2Seg2' }
					},

					// now hit go button to execute
					{
						segmentActivity: "ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#GoFreq_DT2',
							action: "click",
							// positive values for offset x and y move the cursor "southwest"
							offset: { x: 15, y: 20 },
							waitTimeMillisec: 5000
						}  // this is wait before you go on to next item
					},
					// remove cursor on go/stop button
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#GoFreq_DT2',
							action: "nothing",
							waitTimeMillisec: 13000
						}
					},
					//increase frequency to 0.5 Hz
					// click on freq slider to change freq to 1 hz,  offset is approx guess, user can change
					// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
					{
						segmentActivity: "CHANGE_ELEMENT_VALUE",
						segmentParams:
						{
							element: 'FreqSlider_DT2',
							value: "0.5",
							offset: { x: 0, y: 10 },
							waitTimeMillisec: 4000
						}  // this is wait before you go on to next item
					},
					// remove cursor on freq slider 
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#FreqSlider_DT2',
							action: "nothing",
							waitTimeMillisec: 20000
						}
					},
					//increase frequency to 1.5 Hz
					// click on freq slider to change freq to 1 hz,  offset is approx guess, user can change
					// value by clicking on slider, demo cannot, it must change the value directly and show user what user can do
					{
						segmentActivity: "CHANGE_ELEMENT_VALUE",
						segmentParams:
						{
							element: 'FreqSlider_DT2',
							value: "1.5",
							offset: { x: -55, y: 10 },
							waitTimeMillisec: 4000
						}  // this is wait before you go on to next item
					},
					// remove cursor on freq slider 
					{
						segmentActivity: "REMOVE_ACT_ON_ELEMENT",
						segmentParams:
						{
							element: '#FreqSlider_DT2',
							action: "nothing",
							waitTimeMillisec: 12000
						}
					},
				]
		}
	];

	//**************************************************************************** 
	// User initiates autoDemo activity 
	//**************************************************************************** 
	//*** user clicks the start demo image, iniitalize everything 
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO);

	let $startAutoDemoBtn = $('#startAutoDemo');
	if ($startAutoDemoBtn) {
		$startAutoDemoBtn.on('click', function() {
			demo.prepDemoControls(); // move down the table/canvas/controls to make room for autodemo 
		});
	}

	//**************************************************************************** 
	// User has interacted with autoDemo controls 
	//**************************************************************************** 
	// User has selected play 
	let $playSegmentBtn = $('#playSegment');
	if ($playSegmentBtn) {
		$playSegmentBtn.on('click', function() {
			// bring everything back to defaults 
			resetToDefaults();
			// activate pause and disable play 
			demo.startDemo();
		});
	}

	let $stopSegmentBtn = $('#stopSegment');
	if ($stopSegmentBtn) {
		$stopSegmentBtn.on('click', function() {
			// go back to the way it was before autodemo 
			resetToDefaults();
			demo.stopThisSegment(false); // we don't want to destroy controls box 
		});
	}

	let $dismissAutoDemoBtn = $('#dismissAutoDemo');
	if ($dismissAutoDemoBtn) {
		$dismissAutoDemoBtn.on('click', function() {
			// go back to the way it was before autodemo 
			resetToDefaults();
			// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen 
			demo.stopThisSegment(); // may or may not be needed 
		});
	}
	
	let $segNumSelect = $("#segNum");
	if ($segNumSelect) {
		$segNumSelect.on('change', function() {
			let $segNumSelect = $('#segNum');
			currSeg = $segNumSelect ? parseInt($segNumSelect.value) : 0;
			demo.setCurrSeg(currSeg);

			// remove the class so the animation will work on next page, cant do this until animation completes 
			let $clickHereCursor = $('#clickHereCursor');
			if ($clickHereCursor) {
				$clickHereCursor.classList.remove('userHitPlay');
			}
		});
	}

}); 
