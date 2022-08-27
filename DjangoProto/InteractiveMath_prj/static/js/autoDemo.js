//**** This javascript implements an automated demo on each page.  It takes in a set of segments and executes
//**** each segment of audio/click activity/annotations to make the material on each page more understandable.
//**** It is the "instructional" part of each page
'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
const demoEventTypes = ["CLICK_ON_CANVAS", "PLAY_AUDIO", "CLICK_ON_ELEMENT", "ANNOTATION"];

class AutoDemo {
	constructor(multiSegScript) {
		// This script is made up of many segments, which can be run independently.  Each segment has
		// several steps consisting of (maybe) audio, event clicking, annotations etc
		this.fullScript = multiSegScript;
		let ctxDemoCanvas = this.getDemoCtx();
		// background plot is the appearance before this segment operates and will return to this value			
		this.backgroundPlot = ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height);
		
	}
	
	// get the context of the canvas used for the demo
	getDemoCtx() {
		let ctxDemoCanvas;
		let demoCanvas =  $("#funTutorial_DT1").get(0);  // later on, this will be used to clear the canvas
		// get ready to start drawing on this canvas, first get the context
		if ( $("#funTutorial_DT1").length ) {
	    	ctxDemoCanvas = $("#funTutorial_DT1").get(0).getContext('2d');
		} else {
	    	console.log('Cannot obtain demo canvas context');
		}
		return {ctx: ctxDemoCanvas, width: demoCanvas.width, height: demoCanvas.height};
	}
	
	//****************************************
	// functions to implement possible actions in the demo
	//****************************************
	// Move the cursor to new location on demo canvas
	moveCursorImgOnCanvas(segmentParams){
	
		// pull up the canvas that overlays all activity for the demo
		let ctxDemoCanvas = this.getDemoCtx().ctx;
		
		// pull out the special demo cursor icon and place on proper location
		let demoCursor = new Image();
		demoCursor.src = '../../static/images/DemoCursor.svg';
		demoCursor.id = 'demoCursorID';
		let xyPt = segmentParams.xyCoord;
		demoCursor.onload = function() {
			// here we rely on the fact that demo canvas sits exactly on top of the canvas whose points we want to hit
			const CURSOR_DIM = 40;
			ctxDemoCanvas.drawImage(demoCursor, xyPt.x - CURSOR_DIM, xyPt.y, CURSOR_DIM,CURSOR_DIM);
		};
		
		// click on the event 
		let rect = segmentParams.canvas.getBoundingClientRect();  // need to create mouse event on canvas that correxponds to dot on associated canvas
		const clickCanvasPt = new CustomEvent('click', {detail: {xVal:xyPt.x, yVal: xyPt.y }});
		//execute event on element
		segmentParams.canvas.dispatchEvent(clickCanvasPt);
	}
	
	// play an audio clip
	playAudio(segmentParams){
		let context;
		// Safari has implemented AudioContext as webkitAudioContext so need next LOC
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();	
		let audioURL = segmentParams.filenameURL;
		console.log('playing ' + audioURL);	
		let helpAudio;	
		let thisObj = this; // done and onended will think 'this' is the Window, need to tell it its the instantiation of AutoDemo
		
		// I don't think we need a csrf token for this ajax post.  1.  there is already a session ID required for this
		// request 2.  Nothing is stored to database, request must be a code for filename we have or else get error back
		// DO:  look into putting a loading spinner icon to show progress in bringing over file (see bootstrap lib)
	    $.ajax({url:  audioURL,
	    		type: 'GET',
	    	  	// if all is ok, return a blob, which we will convert to arrayBuffer, else return text cuz its an error
	    	  	xhr: function () {
	    			let xhr = new XMLHttpRequest();
	    			xhr.onreadystatechange = function () {
	            		if (xhr.readyState == 2) {
	            			// send() was called and headers and status are returned
	                		if (xhr.status == 200) {
	                    		xhr.responseType = "blob";
	                		} else {
	                    		xhr.responseType = "text";
	                		}
	            		}
	    			};
	    			return xhr;
				},
			})
			.done(function(data, statusText, jqXHR) {
				// DO, rewrite this with promise syntax  https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
				// By definition, to get here means request is done and successful, (status = 4 and 200)
				let blobTune = new Blob([data], { 'type': 'audio/mpeg' });  // this must match what we send over
				//console.log('file size is ' + blobTune.size + ' type is ' + blobTune.type);				
		
				blobTune.arrayBuffer().then(blob2array => 
					{ // done converting blob to arrayBuffer, promise complete, convert blob2array to buffer
					context.decodeAudioData(blob2array, function(buffer) {
						// to get here means asynchronous mp3 decode is complete and successful
						//console.log("finished decoding mp3");
						try {
							//console.log(" buffer length is " + buffer.length + " buffer sample rate is " + buffer.sampleRate );
							helpAudio = context.createBufferSource();
							helpAudio.buffer = buffer;
							helpAudio.connect(context.destination);
							// auto play the recording
							helpAudio.start(0);
							// this just needs to be somewhere where helpAudio is defined to be saved for later
							helpAudio.onended = () => 
							{
								// no longer playing the audio intro, either by user stop or natural completion
								console.log('audio clip is over now, executing return to normal screen');
								let ctxDemoCanvas = thisObj.getDemoCtx();
								ctxDemoCanvas.ctx.putImageData(thisObj.backgroundPlot, 0, 0);
								// when done, ensure demo canvas is back to background so user can interact with dots again
								$('#funTutorial_DT1').css('z-index',-1);
							};
						} catch(e) {
							// most likely not enough space to createBuffer
							console.error(e);
							alert("Failed audio help setup, error is " + e);
						}
																									
						// decodeAudioData is async and doesn't support promises, can't use try/catch for errors
						},function(err) { alert("err(decodeAudioData) on file" + audioURL + " error =" + err); } )
					}, reason => {
						console.error("conversion of blob to arraybuffer failed");
				});
	
			})  // done with success (done) function
			.fail(function(jqXHR, exception) {
					if (jqXHR.status == 403) {
						alert("Need to pass bot test to access server file.  No file for YOU!");  
					} else if (jqXHR.status == 404) {
						alert("File not found.  See Administrator");
					} else {
						alert("ERROR:  return status is " + jqXHR.status );
						console.error(jqXHR)
					}
			});   // done with ajax
		// leave things as they were when user first started, all is in beginning state
	}
	
	// make annotation on canvas to draw clients attention to object
	drawAnnotation(segmentParams) {
		// pull up the canvas that overlays all activity for the demo
		let ctxDemoCanvas = this.getDemoCtx().ctx;
		ctxDemoCanvas.beginPath();
		ctxDemoCanvas.lineWidth = 3.0
		ctxDemoCanvas.strokeStyle = segmentParams.color;
		// put circle up at numeric count down timer
	    ctxDemoCanvas.arc(segmentParams.circleCenter.x, segmentParams.circleCenter.y, segmentParams.circleCenter.radius, 0, Math.PI * 2, true); 
	    ctxDemoCanvas.stroke();
	}
	
	//****************************************
	// play specified segment of the script
	//****************************************
	// So audio generally starts first and is longer than the cursor demo.  So we start audio, then wait segment.headStartForAudioMillisec
	// and start the timed cursor demo	
	startDemo(currSeg) {
		if ((currSeg >= 0) && (currSeg <= this.fullScript.length)) {
			// valid segment number
			let segment = this.fullScript[currSeg];
			console.log('name of segment ' + currSeg + ' is ' + segment.segmentName);
			let delIndex = 0;  // delay index, index of items that need ever increasing delay
			let ctxDemoCanvas = this.getDemoCtx();
			let annotatePlot = ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height);  // this is used during the segment
			// make sure the canvas for demo is at top layer so all activity is visible
			$('#funTutorial_DT1').css('z-index',100);
			segment.segmentActivities.forEach(activity => {
				let thisObj = this;
				switch (activity.segmentActivity) {
					case (demoEventTypes[0]):
						// CLICK_ON_CANVAS
						// all these actions get sent to the EventLoop simultaneously, want to slow down for user
						setTimeout(function(){
							if (delIndex > 0) {
								// get rid of old cursor, we are adding a new one
								ctxDemoCanvas.ctx.putImageData(annotatePlot, 0, 0);
							};
							// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
							thisObj.moveCursorImgOnCanvas(activity.segmentParams);
						}, delIndex * activity.segmentParams.waitTimeMillisec + segment.headStartForAudioMillisec);
						delIndex = delIndex + 1;
						break;
					case (demoEventTypes[1]):
						// PLAY_AUDIO
						this.playAudio(activity.segmentParams);
						break;
					case (demoEventTypes[2]):
						// CLICK_ON_ELEMENT
						break;
					case (demoEventTypes[3]):
						// ANNOTATION
						setTimeout(function(){
							// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
							thisObj.drawAnnotation(activity.segmentParams);
							// want to keep annotation for awhile so save it
							annotatePlot = ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height);
						}, segment.headStartForAudioMillisec);					
						break;
					default:
						console.log('SW error in autoDemo switch stmt');
						break;
				} // end of switch stmt
			});  // end of forEach activity
		} else {console.log('Coding Error, incorrect segment number called out in startDemo of ' + currSeg)};
	}
};


 	
