/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      autoDemo.js
 * ============================================================================
 * 
 * DESCRIPTION:
 * Handle user interaction of page basepage.html for automated demo, which is styled by IntMath.css
 * Automated demo has several segments, typically, and is voiced by a mp3 file. 
 * Each page wanting an autodemo creates a script with the element, the action, when it should
 * occur etc.  This file executes that script so the actions sync up with users voice.
 * It explains how to use the page and is not interactive,  in that once user launches demo via
 * green go button, it executes to completion.
 * 
 * DEPENDENCIES:
 * - Backend:  Django HTML, Static files served over cloud service such as Cloudflare
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

class AutoDemo {
	constructor(multiSegScript) {
		this.fullScript = multiSegScript;
		this.currSeg = 0;
		this.helpAudio;
		this.eventLoopPtrs = [];
		this.userStopRequest = false;
		this.MOVE_RIGHT_AUTODEMO_ACTIVE = 200;
		this.MOVE_DOWN_AUTODEMO_ACTIVE = 65;
	}

	// Refactored to remove jQuery/Bootstrap, using custom '$' helper
	prepDemoControls() {
		let $startBtn = $("#startAutoDemo");
		if ($startBtn) $startBtn.style.display = 'none';
		let $clickCursor = $('#clickHereCursor');
		if ($clickCursor) $clickCursor.classList.add('userHitPlay');
		if ($startBtn) $startBtn.style.animation = 'none';

		let $demoCtls = $('#autoDemoCtls');
		if ($demoCtls) $demoCtls.style.display = 'inline-block';

		let $totalSeg = $('#totalSeg');
		if ($totalSeg) $totalSeg.textContent = '/' + this.fullScript.length;

		if (this.fullScript.length > 1) {
			let $segNum = $('#segNum');
			if ($segNum) {
				for (var i = 1; i < this.fullScript.length; i++) {
					let newVal = (i + 1).toString();
					let newOption = document.createElement('option');
					newOption.value = newVal;
					newOption.textContent = newVal;
					$segNum.appendChild(newOption);
				}
			}
		}
		this.setCurrSeg(1);
		let $stopBtn = $('#stopSegment');
		if ($stopBtn) $stopBtn.disabled = true;
	}

	setCurrSeg(newCurrSeg) {
		if (!isNaN(parseFloat(newCurrSeg)) && isFinite(newCurrSeg)) {
			let temp = newCurrSeg - 1;
			if ((temp >= 0) && (temp <= (this.fullScript.length - 1))) {
				this.currSeg = temp;
				let $segNumInput = $('#segNum');
				if ($segNumInput) $segNumInput.value = (this.currSeg + 1).toString();
			}
		}
		let newLabel = this.fullScript[this.currSeg].segmentName;
		let $segName = $('#segName');
		if ($segName) $segName.innerHTML = '<b>' + newLabel + '</b>';
	}

	stopThisSegment(killTheAutoDemoCtlBox = true) {
		this.userStopRequest = true;
		this.eventLoopPtrs.forEach(timedEvent => clearTimeout(timedEvent));
		if (this.helpAudio) this.helpAudio.stop(0);

		let $stopBtn = $('#stopSegment');
		if ($stopBtn) $stopBtn.disabled = true;
		let $playBtn = $('#playSegment');
		if ($playBtn) $playBtn.disabled = false;

		if (killTheAutoDemoCtlBox) {
			let $startBtn = $("#startAutoDemo");
			if ($startBtn) {
				$startBtn.style.display = 'block';
				$startBtn.style.opacity = '1';
			}
			let $demoCtls = $('#autoDemoCtls');
			if ($demoCtls) $demoCtls.style.display = 'none';
			let $clickCursor = $('#clickHereCursor');
			if ($clickCursor) $clickCursor.classList.remove('userHitPlay');
		}
	}

	segmentOverCleanup() {
		if (!this.userStopRequest) {
			this.setCurrSeg(this.currSeg + 1 + 1);
		}
		let $playBtn = $('#playSegment');
		if ($playBtn) $playBtn.disabled = false;
		let $stopBtn = $('#stopSegment');
		if ($stopBtn) $stopBtn.disabled = true;

		this.removeActOnElement();

		// Updated to remove ModalWindow dependency for pure JS
		if (typeof this.ModalWindow !== 'undefined' && this.ModalWindow) {
			this.ModalWindow.close();
		}
		let $clickCursor = $('#clickHereCursor');
		if ($clickCursor) $clickCursor.classList.remove('userHitPlay');
	}

	async playAudio(segmentParams) {
		let context;
		try {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			context = new AudioContext();
		} catch (e) {
			alert('Web Audio API is not supported');
			return;
		}

		let audioURLKey = segmentParams.filenameURL;
		let thisObj = this;

		const response = await fetch('/getDynamicFilename/?fileKey=' + audioURLKey);
		if (response.ok) {
			const data = await response.json();
			const audioURL = data.url;

			let spinnerEl = document.getElementById('spinner');
			if (spinnerEl) spinnerEl.classList.add("show");

			try {
				const audioFileResponse = await fetch(audioURL);
				if (!audioFileResponse.ok) throw new Error('Network error');

				const rawBlob = await audioFileResponse.blob();
				if (spinnerEl) spinnerEl.classList.remove("show");

				const arrayBuffer = await rawBlob.arrayBuffer();
				// Modern Promise-based syntax for decoding audio data
				const decodedBuffer = await context.decodeAudioData(arrayBuffer);

				thisObj.helpAudio = context.createBufferSource();
				thisObj.helpAudio.buffer = decodedBuffer;
				thisObj.helpAudio.connect(context.destination);
				thisObj.helpAudio.start(0);
				thisObj.helpAudio.onended = () => {
					thisObj.segmentOverCleanup();
				};
			} catch (e) {
				if (spinnerEl) spinnerEl.classList.remove("show");
				alert("Audio error: " + e);
			}
		}
	}

	// make annotation on an element of the page. Cant just change border or add border, that changes the element itself and 
	// can make an input element look like a label 
	annotateElement(param, ind) {
		let targetEl = document.getElementById(param.element);
		if (!targetEl) return;

		// Replacement for jQuery .offset() using native viewport geometry calculations
		const rect = targetEl.getBoundingClientRect();
		const locEl = {
			top: rect.top + window.scrollY,
			left: rect.left + window.scrollX
		};

		const MARGIN = 10; // this is the only way to set the logical size of the canvas. The physical size of canvas is set in css 
		let currentID = 'annotateElement' + ind; // so multiple annotations get unique ID 

		// Created using native standard elements instead of raw template string injection strings
		let newCanvas = document.createElement('canvas');
		newCanvas.id = currentID;
		newCanvas.width = 70;
		newCanvas.height = 40;

		let topOffsetStr = Math.round(locEl.top - MARGIN).toString() + 'px';
		let leftOffsetStr = Math.round(locEl.left - MARGIN).toString() + 'px';

		// Native styling properties updates directly
		newCanvas.style.position = 'absolute';
		newCanvas.style.top = topOffsetStr;
		newCanvas.style.left = leftOffsetStr;
		newCanvas.style.zIndex = '10000'; // will make sure the annotation is on top of other elements 

		document.body.appendChild(newCanvas); // ensure the new little canvas was added properly, else this will fail 

		let newCanvasCtx = newCanvas.getContext('2d');
		newCanvasCtx.beginPath();
		newCanvasCtx.lineWidth = 2.0;
		newCanvasCtx.strokeStyle = param.color;

		// put circle annotation in canvas 
		newCanvasCtx.arc(20, 20, 20, 0, 2 * Math.PI);
		newCanvasCtx.stroke();
		newCanvasCtx.closePath();
	}

	// go through all possible indices before this one and try to remove any canvases used to annotate 
	removeAllAnnotateElement(ind) {
		for (let i = 0; i <= ind; i++) {
			// yes, we are trying to knock out alot of canvases that don't exist but no harm in that with native DOM checks
			let currentEl = document.getElementById('annotateElement' + i);
			if (currentEl) {
				currentEl.remove();
			}
		}
	}

	// fake cursor to DOM element and allow focus on that element. 
	actOnElement(param) {
		// pull out the special demo cursor icon and place on proper location 
		let demoCursor = $('#demoCursorID');
		if (demoCursor) demoCursor.style.display = "block";

		let targetEl = $(param.element);
		if (!targetEl) return;

		// Native bounding box tracking offsets replacement
		const rect = targetEl.getBoundingClientRect();
		const locEl = {
			top: rect.top + window.scrollY,
			left: rect.left + window.scrollX
		};

		// using tranform, we don't need integer number of pixels 
		let leftPos = locEl.left - param.offset.x;
		let topPos = locEl.top + param.offset.y;

		// since we turn on/off the cursor for now, no smooth transition for now... 
		if (demoCursor) {
			demoCursor.style.left = leftPos + 'px';
			demoCursor.style.top = topPos + 'px';
		}

		if ("focus" == param.action) {
			// focus shows off what it looks like when user clicks on input element 
			targetEl.focus();
		} else if ("click" == param.action) {
			// Invokes fixed click routine (triggers real clicks)
			targetEl.click();
		}
		// else its do nothing or unimplemented 
	}

	// we can't create a click event on a link that will bring up a modal, need to show modal explicitely 
	showModal(param) {
		let currID = param.element;
		let modalEl = document.getElementById(currID);

		if (modalEl) { // item exists 
			this.ModalWindow = modalEl; // save so we can hide it later 

			// Framework-free replacement: utilizes native HTML5 dialog show methods cleanly
			if (typeof modalEl.showModal === 'function') {
				modalEl.showModal();
			} else if (typeof modalEl.show === 'function') {
				modalEl.show();
			} else {
				modalEl.style.display = 'block';
			}
		} else {
			console.log('FAILURE in showModal, element #' + currID + ' was not found in the DOM.');
		}
	}

	// remove the big fake cursor 
	removeActOnElement(param = null) {
		// get rid of demo cursor ID 
		let demoCursor = $('#demoCursorID');
		if (demoCursor) demoCursor.style.display = "none";

		// remove focus on element, will do nothing if not in focus 
		if (null !== param) {
			let targetEl = document.querySelector(param.element);
			if (targetEl && 'undefined' !== typeof param.action) {
				if ('focus' == param.action) {
					targetEl.blur();
				} else if ('click' == param.action) {
					// delayed action click 
					targetEl.click();
				}
				// else do nothing 
			}
		}
	}

	changeValOnSliderElement(param = null) {
		// The user is able to click on various points of slider and change value but have to fake it for demo 
		// pull out the special demo cursor icon and place on proper location 
		let $demoCursor = $('#demoCursorID');
		if ($demoCursor) $demoCursor.style.display = "block";

		let targetEl = document.getElementById(param.element);
		if (!targetEl) return;

		let rect = targetEl.getBoundingClientRect();
		let locEl = {
			top: rect.top + window.scrollY,
			left: rect.left + window.scrollX
		};

		let leftPos = locEl.left - param.offset.x;
		let topPos = locEl.top + param.offset.y;

		if ($demoCursor) {
			$demoCursor.style.left = leftPos + 'px';
			$demoCursor.style.top = topPos + 'px';
		}

		// change the value on slider 
		targetEl.value = param.value;

		// now fire off an event to be detected onchange 
		// Native syntax dispatch tracking wrapper replaces jQuery .trigger()
		let changeEvent = new Event('change', { bubbles: true });
		targetEl.dispatchEvent(changeEvent);
	}

	changeSubtopicsOnIntroPage(param = null) {
		// idToGo is the text we want to replace temporarily for demo 
		// NEED TO save the old stuff here and put it back when done 
		let $container = $('#' + param.idToGo);
		if (!$container) return;

		this.oldText = $container.innerHTML;
		// get rid of old text and put up the new fake subtopics 
		// I dont know why I cant use the data feather here with music note like I did in subtopics.html but 
		// this is the "real" location of the icon from the browser 
		let musicNote = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-music"><path d="M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm12-2h-4a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"></path><polyline points="9 17 9 5 21 3 21 15"></polyline></svg>';
		let fakeSubtopics = '<ul class="nav flex-column">' +
			'<p id="headerForSubtopics"> Subtopics </p>' +
			'<li class="nav-item">' +
			'<a class="nav-link" id="firstFakePage">' + musicNote + '1. Introduction' + '</a>' +
			'</li>' +
			'<li class="nav-item">' +
			'<a class="nav-link" id="secondFakePage">' + musicNote + "2. HEEEELP! I'm lost" + '</a>' +
			'</li>' +
			'<li class="nav-item">' +
			'<a class="nav-link" id="thirdFakePage">' + musicNote + "3. Hey, I'm getting this" + '</a>' +
			'</li>' +
			'<li class="nav-item">' +
			'<a class="nav-link" id="fourthFakePage">' + musicNote + '4. Summary' + '</a>' +
			'</li>' +
			'</ul>';

		$container.innerHTML = '';
		$container.insertAdjacentHTML('beforeend', fakeSubtopics);
	}

	revertSubtopicsOnIntroPage(param = null) {
		// idToGo is the text we want to replace temporarily for demo 
		let $container = $('#' + param.idToGo);
		if ($container) {
			$container.innerHTML = '';
			$container.insertAdjacentHTML('beforeend', this.oldText);
		}
	}

	//**************************************** 
	// play specified segment of the script 
	//****************************************


	// So audio generally starts first and is longer than the cursor demo.  So we start audio, then wait segment.headStartForAudioMillisec
	// and start the timed cursor demo	
	doTheSegmentAction(activity, nextItemBeginTime, annotateInd) {
		let temp;
		let thisObj = this;
		let anIndex = annotateInd;
		let nextItemStartTime = nextItemBeginTime;
		switch (activity.segmentActivity) {
			case ("PLAY_AUDIO"):
				// PLAY_AUDIO, assume we start this first with no delay
				this.playAudio(activity.segmentParams);
				break;
			case ("ACT_ON_ELEMENT"):
				// ACT_ON_ELEMENT
				//console.log('about to act on element with time ' + nextItemStartTime + 'for activity ' + activity.segmentParams.element);
				temp = setTimeout(function() {
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.actOnElement(activity.segmentParams);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				//console.log('next item starttime updated to ' + nextItemStartTime);
				this.eventLoopPtrs.push(temp);
				break;
			case ("ANNOTATE_ELEMENT"):
				// ANNOTATE element on page
				temp = setTimeout(function() {
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.annotateElement(activity.segmentParams, anIndex);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				anIndex = anIndex + 1;
				break
			case ("REMOVE_ALL_ANNOTATE_ELEMENT"):
				// delete all ANNOTATE elements on page, since we had to add little canvases
				temp = setTimeout(function() {
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.removeAllAnnotateElement(anIndex);
					anIndex = 0; // they are all gone now
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break
			case ("REMOVE_ACT_ON_ELEMENT"):
				// remove cursor from screen,  REMOVE_ACT_ON_ELEMENT
				temp = setTimeout(function() {
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.removeActOnElement(activity.segmentParams);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break
			case ("SHOW_MODAL"):
				// show a modal window, unfortunately, item.click doesn't work for such things
				temp = setTimeout(function() {
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.showModal(activity.segmentParams);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break
			case ("CHANGE_ELEMENT_VALUE"):
				// change value of an element
				temp = setTimeout(function() {
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.changeValOnSliderElement(activity.segmentParams);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break
			case ("FAKE_SUBTOPICS"):
				// change subtopics to a dummy in intro to site						
				temp = setTimeout(function() {
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.changeSubtopicsOnIntroPage(activity.segmentParams);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break;
			case ("REMOVE_FAKE_SUBTOPICS"):
				// change dummy subtopics out to what it was originally					
				temp = setTimeout(function() {
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.revertSubtopicsOnIntroPage(activity.segmentParams);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break;

			default:
				console.error('SW error in autoDemo switch stmt, switch select value was ' + activity.segmentActivity);
				break;
		} // end of switch stmt
		return [nextItemStartTime, anIndex];
	}
	startDemo() {
		let currSeg = this.currSeg;
		let $playBtn = $('#playSegment');
		let $stopBtn = $('#stopSegment');
		let $segNumInput = $('#segNum');
		let $clickCursor = $('#clickHereCursor');

		if ($playBtn) $playBtn.disabled = true;
		if ($stopBtn) $stopBtn.disabled = false;

		if ($segNumInput) {
			this.setCurrSeg(parseInt($segNumInput.value));
		}
		if ($clickCursor) $clickCursor.classList.remove('userHitPlay');

		if ((currSeg >= 0) && (currSeg <= this.fullScript.length)) {
			let segment = this.fullScript[currSeg];
			this.userStopRequest = false;
			let nextItemBeginTime = segment.headStartForAudioMillisec;
			let annotateInd = 0;

			segment.segmentActivities.forEach(activity => {
				if (!this.userStopRequest) {
					[nextItemBeginTime, annotateInd] = this.doTheSegmentAction(activity, nextItemBeginTime, annotateInd);
				}
			});
		} else {
			console.error('Coding Error, incorrect segment number called out in startDemo of ' + currSeg);
		}
	}
}

class AutoDemoWithCanvas extends AutoDemo {
	constructor(multiSegScript, stringIDOfCanvas) {
		super(multiSegScript);
		this.canvasID = '#' + stringIDOfCanvas;
		let ctxDemoCanvas = this.getDemoCtx(this.canvasID);
		this.backgroundPlot = ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height);
	}

	//************* 
	// Handle all canvas related activities 
	//************* 
	getDemoCtx() {
		let ctxDemoCanvas;
		// Native selector replacements instead of jQuery array collections
		let demoCanvas = document.querySelector(this.canvasID);

		if (demoCanvas) {
			ctxDemoCanvas = demoCanvas.getContext('2d');
		} else {
			console.error('Cannot obtain demo canvas context in getDemoCtx under autoDemo.js');
		}
		return { ctx: ctxDemoCanvas, width: demoCanvas ? demoCanvas.width : 0, height: demoCanvas ? demoCanvas.height : 0 };
	}

	drawAnnotation(segmentParams) {
		let ctxDemoCanvas = this.getDemoCtx().ctx;
		if (!ctxDemoCanvas) return;
		ctxDemoCanvas.beginPath();
		ctxDemoCanvas.lineWidth = 3.0;
		ctxDemoCanvas.strokeStyle = segmentParams.color;
		ctxDemoCanvas.arc(segmentParams.circleCenter.x, segmentParams.circleCenter.y, segmentParams.circleCenter.radius, 0, Math.PI * 2, true);
		ctxDemoCanvas.stroke();
	}

	segmentOverCleanup() {
		let ctxDemoCanvas = this.getDemoCtx();
		if (ctxDemoCanvas.ctx) {
			ctxDemoCanvas.ctx.putImageData(this.backgroundPlot, 0, 0);
		}
		super.segmentOverCleanup();

		let canvasEl = document.querySelector(this.canvasID);
		if (canvasEl) {
			canvasEl.style.zIndex = '-1';
		}
	}

	moveCursorImgOnCanvas(segmentParams) {
		let $demoCursor = $('#demoCursorID');
		if ($demoCursor) $demoCursor.style.display = "block";

		// Finds dynamic layout container natively
		const canvas = document.querySelector('canvas');
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const CURSOR_DIM = 40;

		const scaleX = rect.width / canvas.width;
		const scaleY = rect.height / canvas.height;

		const xyPt = segmentParams.xyCoord;
		const screenX = rect.left + window.scrollX + (xyPt.x * scaleX) - CURSOR_DIM;
		const screenY = rect.top + window.scrollY + (xyPt.y * scaleY);

		if ($demoCursor) {
			$demoCursor.style.left = screenX + 'px';
			$demoCursor.style.top = screenY + 'px';
		}

		const clickCanvasPt = new CustomEvent('click', { detail: { xVal: xyPt.x, yVal: xyPt.y }, bubbles: true });
		segmentParams.canvas.dispatchEvent(clickCanvasPt);
	}

	doTheSegmentAction(activity, nextItemBeginTime, annotateInd) {
		let temp;
		let thisObj = this;
		let anIndex = annotateInd;
		let nextItemStartTime = nextItemBeginTime;
		let ctxDemoCanvas = this.getDemoCtx();

		let annotatePlot = ctxDemoCanvas.ctx ? ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height) : null;

		let canvasEl = document.querySelector(this.canvasID);
		if (canvasEl) {
			canvasEl.style.zIndex = '100';
		}

		switch (activity.segmentActivity) {
			case ("CLICK_ON_CANVAS"):
				temp = setTimeout(function() {
					if (nextItemStartTime > nextItemBeginTime && ctxDemoCanvas.ctx) {
						ctxDemoCanvas.ctx.putImageData(annotatePlot, 0, 0);
					}
					thisObj.moveCursorImgOnCanvas(activity.segmentParams);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break;

			case ("ANNOTATION"):
				temp = setTimeout(function() {
					thisObj.drawAnnotation(activity.segmentParams);
					if (ctxDemoCanvas.ctx) {
						annotatePlot = ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height);
					}
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break;

			case ("REMOVE_LAST_CANVAS_ANNOTATION"):
				temp = setTimeout(function() {
					if (ctxDemoCanvas.ctx) {
						ctxDemoCanvas.ctx.putImageData(annotatePlot, 0, 0);
					}
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break;

			default:
				[nextItemStartTime, anIndex] = super.doTheSegmentAction(activity, nextItemBeginTime, annotateInd);
				break;
		}
		return [nextItemStartTime, anIndex];
	}
}

