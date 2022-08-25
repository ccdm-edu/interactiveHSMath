//**** This javascript implements an automated demo on each page.  It takes in a set of segments and executes
//**** each segment of audio/click activity/annotations to make the material on each page more understandable.
//**** It is the "instructional" part of each page
'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
const demoEventTypes = ["CLICK_ON_CANVAS", "PLAY_AUDIO", "CLICK_ON_ELEMENT", "ANNOTATION"];

function startDemo(scriptOfDemo) {
	let currentSegment = 0;
	scriptOfDemo.forEach(segment => {
		console.log('name of segment ' + currentSegment + ' is ' + segment.segmentName);
		segment.segmentActivities.forEach(activity => {
			switch (activity.segmentActivity) {
				case (demoEventTypes[0]):
					moveCursorImgOnCanvas(activity.segmentParams);
					break;
				case (demoEventTypes[1]):
					playAudio(activity.segmentParams);
					break;
				default:
			}
		});
	});
};

function moveCursorImgOnCanvas(segmentParams){
	
	// pull up the canvas that overlays all activity for the demo
	let ctxDemoCanvas;
	let demoCanvas =  $("#funTutorial_DT1").get(0);  // later on, this will be used to clear the canvas
	// get ready to start drawing on this canvas, first get the context
	if ( $("#funTutorial_DT1").length ) {
    	ctxDemoCanvas = $("#funTutorial_DT1").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain demo canvas context');
	}
	
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
	
	// click on the event and wait a second to mimic a user doing this so its not too fast for demo
	let rect = segmentParams.canvas.getBoundingClientRect();  // need to create mouse event on canvas that correxponds to dot on associated canvas
	console.log('inside autodemo, client x is ' + (xyPt.x + rect.left) + 'rect.left is ' + rect.left);
	const clickCanvasPt = new CustomEvent('click', {detail: {xVal:xyPt.x, yVal: xyPt.y }});
	//execute event on element
	segmentParams.canvas.dispatchEvent(clickCanvasPt);


};

function playAudio(segmentParams){
	let context;
	// Safari has implemented AudioContext as webkitAudioContext so need next LOC
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();	
	let audioURL = segmentParams.filenameURL;
	console.log('playing ' + audioURL);	
	let helpAudio;	

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
			console.log('file size is ' + blobTune.size + ' type is ' + blobTune.type);				
	
			blobTune.arrayBuffer().then(blob2array => 
				{ // done converting blob to arrayBuffer, promise complete, convert blob2array to buffer
				context.decodeAudioData(blob2array, function(buffer) {
					// to get here means asynchronous mp3 decode is complete and successful
					console.log("finished decoding mp3");
					try {
						console.log(" buffer length is " + buffer.length + " buffer sample rate is " + buffer.sampleRate );
						helpAudio = context.createBufferSource();
						helpAudio.buffer = buffer;
						helpAudio.connect(context.destination);
						// auto play the recording
						helpAudio.start(0);
						// this just needs to be somewhere where helpAudio is defined to be saved for later
						helpAudio.onended = () => 
						{
							// no longer playing the audio intro, either by user stop or natural completion
							console.log('audio clip is over now');
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
};
    	
