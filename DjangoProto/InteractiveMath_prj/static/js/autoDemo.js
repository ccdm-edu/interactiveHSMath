//**** This javascript implements an automated demo on each page.  It takes in a set of segments and executes
//**** each segment of audio/click activity/annotations to make the material on each page more understandable.
//**** It is the "instructional" part of each page
'use strict'

class AutoDemo {
	constructor(multiSegScript) {
		// This script is made up of many segments, which can be run independently.  Each segment has
		// several steps consisting of (maybe) audio, event clicking, annotations etc
		this.fullScript = multiSegScript;

		this.currSeg = 0;  // start at beginnning unless user chooses otherwise.  Autodemo runs from 0 to Max-1 but user thinks its 1 to max
		this.helpAudio;  // placeholder, need access to this for start/stop/pause
		// keep track of all events put on event loop so if we have to abort a segment, we can empty the event loop
		this.eventLoopPtrs = [];
		// audio done doesn't know if it just finished or user hit stop, need to keep track
		this.userStopRequest = false;
		// How far we need to move elements to acomodate the AutoDemo controls box
		this.MOVE_RIGHT_AUTODEMO_ACTIVE = 200;
		this.MOVE_DOWN_AUTODEMO_ACTIVE = 65;
	}
	//***********This is more prep for Autodemo than actually doing it yet */
	// Move the the html element id specified to the right to accomodate AUTODEMO being active
	moveToRightForAutoDemo($elementToMove){
		// read current value of "left" attribute, pull off the px part of string
		let currentLeftVal = parseInt($elementToMove.css('left').slice(0,-2));
		let newLeftVal = currentLeftVal + this.MOVE_RIGHT_AUTODEMO_ACTIVE;
		$elementToMove.css('left', newLeftVal + 'px')
	}
	// Move the html element id specified back to the left now that AUTODEMO is over.
	moveToLeftForAutoDemo($elementToMove){
		let currentLeftVal = parseInt($elementToMove.css('left').slice(0,-2));
		let newLeftVal = currentLeftVal - this.MOVE_RIGHT_AUTODEMO_ACTIVE;
		$elementToMove.css('left', newLeftVal + 'px')
	}
	// move element down for autodemo controls box
	moveDownForAutoDemo($elementToMove){
		// read current value of "left" attribute, pull off the px part of string
		let currentTopVal = parseInt($elementToMove.css('top').slice(0,-2));
		let newTopVal = currentTopVal + this.MOVE_DOWN_AUTODEMO_ACTIVE;
		$elementToMove.css('top', newTopVal + 'px')
	}
	// Move the html element id specified back to the left now that AUTODEMO is over.
	moveBackUpForAutoDemo($elementToMove){
		// read current value of "left" attribute, pull off the px part of string
		let currentTopVal = parseInt($elementToMove.css('top').slice(0,-2));
		let newTopVal = currentTopVal - this.MOVE_DOWN_AUTODEMO_ACTIVE;
		$elementToMove.css('top', newTopVal + 'px')
	}
	//***********End of prep for autodemo */
	
	setCurrSeg(newCurrSeg) {
		// value newCurrSeg will be what user sees which is 1 to max.  value of this.currSeg is what we use 0 to max-1
		// should always come in as an int but better to be sure and pull off the minus 1
		if ($.isNumeric(newCurrSeg)) {
			let temp = newCurrSeg - 1;			
			// should never be an issue but better to check another time, otherwise, do nothing
			if ( (temp >= 0) && (temp <= (this.fullScript.length - 1)) ) {
				this.currSeg = temp;  // saved as integer
				// ensure the text in input matches the new value
				$('#segNum').val((this.currSeg+ 1).toString());
			} 
		} else {
			console.log(" CODING ERROR, setCurrSeg assumes input param is an integer but it is not");
		}
		let newLabel = this.fullScript[this.currSeg].segmentName;
		$('#segName').html('<b>' + newLabel + '</b>');
	}
	
	getCurrSeg() { 
		return this.currSeg; // will be value from 0 to max-1 
	}
	
	// shut down the current segment as quickly as possible and stay on this segment number.  Will restart
	// when replay from begin of segment.  Since AutoDemo class can be created without control box, 
	// when we stop a segment, we don't always want to kill a control box
	stopThisSegment(killTheAutoDemoCtlBox = true) {
		this.userStopRequest = true;  // dont add any new activity segments to pile
		// clear EventLoop of all time queued demo events, if all events are already done, no biggie
		this.eventLoopPtrs.forEach(timedEvent => {
			clearTimeout(timedEvent);
		});
		// turn off the audio, need to tell code user is doing this and it is not "naturally finished" via userStopRequest
		if (this.helpAudio) this.helpAudio.stop(0);
		
		// change icons so play is now enabled and stop is disabled
    	$('#stopSegment').prop('disabled', true);  // disable play once playing
    	$('#playSegment').prop('disabled', false);  // reactivate play
    	
		// get rid of controls box, go back to small image  
		if (killTheAutoDemoCtlBox) {	
			$('#startAutoDemo').css('display', 'inline-block');
			$('#autoDemoCtls').css('display', 'none');
			// remove the class so the click here animation will work on next page, cant do this until animation completes
	    	$('#clickHereCursor').removeClass('userHitPlay');
    	}
	}

	// the segment is over when the audio is over, time to clean up our toys to allow user to use site or play next seg
	segmentOverCleanup(){	
		// demo isn't over until audio is done, update to next segment
		// increment segment value here and on screen.  User can change if they want
		if (!this.userStopRequest) {
			// audio completed without user intervention, setCurrSeg takes an input segment number of
			// what user sees(1 to max), which is one higher than we keep internally (0 to max-1).
			// next segment must be one higher still, setCurrSeg will ensure we dont go over max avail
			this.setCurrSeg(this.currSeg + 1 + 1);  // since user sees 1 to max, not 0 to max-1
		}
		// turn on play button and turn off pause button
		$('#playSegment').prop('disabled', false);  
		$('#stopSegment').prop('disabled', true);  
		this.removeActOnElement();  // get rid of fake cursor on an element if it exists
		if ('undefined' !== typeof this.ModalWindow) {this.ModalWindow.modal('hide');	}	// if a modal is showing, get rid of it
		
		// remove the class so the animation will work on next page
    	$('#clickHereCursor').removeClass('userHitPlay');
	}
	
	//****************************************
	// functions to implement possible actions in the demo
	//****************************************
	
	// play an audio clip
	playAudio(segmentParams){

		let context;
		// Safari has implemented AudioContext as webkitAudioContext so need next LOC
		// Do we have Web Audio API? if not, alert user to failure
		try {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			context = new AudioContext();
		} catch (e) {
			alert('Web Audio API is not supported in this browser');
		}
	
		let audioURL = segmentParams.filenameURL;
		console.log('playing ' + audioURL);	
		let thisObj = this; // done and onended will think 'this' is the Window, need to tell it its the instantiation of AutoDemo
		
		// I don't think we need a csrf token for this ajax post.  1.  there is already a session ID required for this
		// request 2.  Nothing is stored to database, request must be a code for filename we have or else get error back
		// DO:  look into putting a loading spinner icon to show progress in bringing over file (see bootstrap lib)
		spinner.className = "show";  // turn on the spinner in middle of autodemo box
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
				spinner.className = spinner.className.replace("show", "");  // turn off spinner, server part is done
				blobTune.arrayBuffer().then(blob2array => 
				{ // done converting blob to arrayBuffer, promise complete, convert blob2array to buffer
					context.decodeAudioData(blob2array, function(buffer) {
						// to get here means asynchronous mp3 decode is complete and successful
						//console.log("finished decoding mp3");
						try {
							//console.log(" buffer length is " + buffer.length + " buffer sample rate is " + buffer.sampleRate );
							thisObj.helpAudio = context.createBufferSource();
							thisObj.helpAudio.buffer = buffer;
							thisObj.helpAudio.connect(context.destination);
							// auto play the recording
							thisObj.helpAudio.start(0);							
							thisObj.helpAudio.onended = () => 
							{
								// no longer playing the audio intro, either by user stop or natural completion
								console.log('audio clip is over now, executing return to normal screen');
								thisObj.segmentOverCleanup();
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
				spinner.className = spinner.className.replace("show", "");  // turn off spinner
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
	
	// make annotation on an element of the page.  Cant just change border or add border, that changes the element itself and
	// can make an input element look like a label
	annotateElement(param, ind) {
	    let locEl = $('#' + param.element).offset();
	    // location of item to be annotated is at locEl.top and locEl.left
    	const MARGIN = 10;
    	// this is the only way to set the logical size of the canvas.  The physical size of canvas is set in css	
    	let currentID = 'annotateElement' + ind; // so multiple annotations get unique ID
		let $newCanvas = $('<canvas/>',{'id': currentID, 'width':'70px', 'height':'40px'}).prop({width:70,height:40});
		console.log('annotate canvas id is ' + currentID);
		// debug only, if you want to see canvas
		//$newCanvas.attr('style',"border:1px solid #000000;");		
		
		let topOffsetStr = Math.round(locEl.top - MARGIN).toString() + 'px';
		let leftOffsetStr = Math.round(locEl.left - MARGIN).toString() + 'px';
		
		$newCanvas.css('position', 'absolute')
		$newCanvas.css('top', topOffsetStr);
		$newCanvas.css('left', leftOffsetStr);
		$newCanvas.css('z-index', 10000);  // will make sure the annotation is on top of other elements
				
		$newCanvas.appendTo("body");
		// ensure the new little canvas was added properly, else this will fail
		let newCanvasCtx = $('#' + currentID).get(0).getContext('2d');
		newCanvasCtx.beginPath();
		newCanvasCtx.lineWidth = 2.0
		newCanvasCtx.strokeStyle = param.color;
		// put circle annotation in canvas
	    newCanvasCtx.arc(20, 20, 20, 0, 2 * Math.PI); 
	    newCanvasCtx.stroke();
	    newCanvasCtx.closePath();
	    
	}
	// go through all possible indices before this one and try to remove any canvases used to annotate
	removeAllAnnotateElement(ind){
		for (let i = 0; i <= ind; i++) {
			// yes, we are trying to knock out alot of canvases that don't exist but no harm in that with jquery
			let currentID = '#annotateElement' + i;
			$(currentID).remove();
		}	
	}
	// fake cursor to DOM element and allow focus on that element.
	actOnElement(param) {
		// pull out the special demo cursor icon and place on proper location
		let $demoCursor = $('<img>',{id:'demoCursorElID',src:'../../static/images/DemoCursor.svg'});
		$demoCursor.css('position', 'absolute');		
		$demoCursor.css('zIndex', '2000');  // make sure cursor sits on top, bootstrap dropdown-menu show makes z index of 1000
		$demoCursor.appendTo("body");
		let locEl = $(param.element).offset();
	    // location of item to be annotated is at locEl.top and locEl.left
	    let leftPos = Math.round(locEl.left) - param.offset.x;
	    let topPos = Math.round(locEl.top) + param.offset.y;
	    //console.log("act on element: leftPos=" + leftPos + " top pos= " + topPos);
	    $('#demoCursorElID').css({ 'left': leftPos + 'px', 'top': topPos + 'px' });
	    let currID = param.element;
		if ("focus" == param.action) {
			// focus shows off what it looks like when user clicks on input element
			$(currID).focus();
		} else if ("click" == param.action) {
			// click
			$(currID).click();
		} // else its do nothing or unimplemented
	}
	// we can't create a click event on a link that will bring up a modal, need to show modal explicitely
	showModal(param) {
		let currID = '#' + param.element;
		if ($(currID).length > 0) {
			// item exists
			this.ModalWindow = $(currID);  // save so we can hide it later
			$(currID).modal({backdrop: false});  // this stops the background from going dark when do modal show
			$(currID).modal('show');  // only thing that works
		} else {
			console.log('FAILURE in showModal, element ' + currID + 'has length is ' + $(currID).length);
		}
	}
	// remove the big fake cursor
	removeActOnElement(param = null) {
		// get rid of demo cursor ID
		$('#demoCursorElID').remove();
			// remove focus on element, will do nothing if not in focus
		if (null !== param) {
			if ('undefined' !== param.action) {
				if ('focus' == param.action) {
					$(param.element).blur();
				} else if ('click' == param.action) {
					// delayed action click
					$(param.element).click();
					//console.log('clicking on ' + '#' + param.element);
				}  // else do nothing
			}
		}
	}
	
	changeValOnSliderElement(param=null) {
		// The user is able to click on various points of slider and change value but have to fake it for demo
		// pull out the special demo cursor icon and place on proper location
		let $demoCursor = $('<img>',{id:'demoCursorElID',src:'../../static/images/DemoCursor.svg'});
		$demoCursor.css('position', 'absolute');		
		$demoCursor.css('zIndex', '2000');  // make sure cursor sits on top, bootstrap dropdown-menu show makes z index of 1000
		$demoCursor.appendTo("body");
		let locEl = $('#' + param.element).offset();
	    // location of item to be annotated is at locEl.top and locEl.left
	    let leftPos = Math.round(locEl.left) - param.offset.x;
	    let topPos = Math.round(locEl.top) + param.offset.y;
	    //console.log("act on element: leftPos=" + leftPos + " top pos= " + topPos);
	    // set position of fake big red cursor that wanders through documants
	    $('#demoCursorElID').css({ 'left': leftPos + 'px', 'top': topPos + 'px' });
		
		// change the value on slider
		let $elToUpdt = $('#' + param.element);
		$elToUpdt.prop("value", param.value);
		//console.log('value of ' + param.element + 'is now ' + $elToUpdt.val());
		// now fire off an event to be detected onchange
		let event = new Event('change');
		// Dispatch it.
		$elToUpdt.trigger('change');
		
	}
	
	changeSubtopicsOnIntroPage(param=null) {
		// idToGo is the text we want to replace temporarily for demo
		// NEED TO save the old stuff here and put it back when done
		this.oldText = $('#' + param.idToGo).html();
		
		// get rid of old text and put up the new fake subtopics
		// I dont know why I cant use the data feather here with music note like I did in subtopics.html but 
		// this is the "real" location of the icon from the browser
		let musicNote = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-music"><path d="M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm12-2h-4a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"></path><polyline points="9 17 9 5 21 3 21 15"></polyline></svg>';
		let fakeSubtopics = '<ul class="nav flex-column">' +
							'<p id="headerForSubtopics"> Subtopics </p>' +
							'<li class="nav-item">' +
								'<a class="nav-link" id="firstFakePage">' +
								musicNote + 
								'1. Introduction' +
								'</a>' +
							'</li>' +
							'<li class="nav-item">' +
								'<a class="nav-link" id="secondFakePage">' +
								musicNote +
								"2. HEEEELP! I'm lost" +
								'</a>' +
							'</li>'+
							'<li class="nav-item">' +
								'<a class="nav-link" id="thirdFakePage">' +
								musicNote +
								"3. Hey, I'm getting this" +
								'</a>' +
							'</li>' +
							'<li class="nav-item">' +
								'<a class="nav-link" id="fourthFakePage">' +
								musicNote +
								'4. Summary' +
								'</a>' +
							'</li>' +
						'</ul>';
		$('#' + param.idToGo).empty().append(fakeSubtopics);
	}
	revertSubtopicsOnIntroPage(param=null) {
		// idToGo is the text we want to replace temporarily for demo
		$('#' + param.idToGo).empty().append(this.oldText);
	}		
	//****************************************
	// play specified segment of the script
	//****************************************
	// prepare the Auto Demo controls for user to interact with
	prepDemoControls(){
		// flash a "click here" image to get them to hit play
	    $('#clickHereCursor').addClass('userHitPlay'); 
	    	
		//first get rid of "lets do the demo" image and put up the demo controls
		$('#startAutoDemo').css('display', 'none');
		$('#autoDemoCtls').css('display', 'inline-block');
		$('#autoDemoCtls').css('visibility', 'visible');
		// fill in the controls properly
		$('#totalSeg').text('/' + this.fullScript.length);
		// add all the choices allowed for this set of segments of AutoDemo
		if (this.fullScript.length > 1)
		{
			for (var i = 1; i < this.fullScript.length; i++) {
	    		let newVal = (i+1).toString();
	    		let newOption = $("<option>", {
    				value: newVal,
    				text: newVal
  				});
    			$('#segNum').append(newOption);			
			}
		}
	
		this.setCurrSeg(1);  // default start at begin
		$('#stopSegment').prop('disabled', true);  // when first start up, can only hit play
	}
	// So audio generally starts first and is longer than the cursor demo.  So we start audio, then wait segment.headStartForAudioMillisec
	// and start the timed cursor demo	
	doTheSegmentAction(activity, nextItemBeginTime, annotateInd){
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
				console.log('about to act on element with time ' + nextItemStartTime + 'for activity ' + activity.segmentParams.element);
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.actOnElement(activity.segmentParams);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				console.log('next item starttime updated to ' + nextItemStartTime);
				this.eventLoopPtrs.push(temp);				
				break;
			case ("ANNOTATE_ELEMENT"):
				// ANNOTATE element on page
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.annotateElement(activity.segmentParams, anIndex);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);	
				anIndex = anIndex +1;
				break
			case ("REMOVE_ALL_ANNOTATE_ELEMENT"):
				// delete all ANNOTATE elements on page, since we had to add little canvases
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.removeAllAnnotateElement(anIndex);
					anIndex = 0; // they are all gone now
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);	
				break
			case ("REMOVE_ACT_ON_ELEMENT"):
				// remove cursor from screen,  REMOVE_ACT_ON_ELEMENT
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.removeActOnElement(activity.segmentParams);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);	
				break
			case ("SHOW_MODAL"):
				// show a modal window, unfortunately, item.click doesn't work for such things
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.showModal(activity.segmentParams);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);	
				break
			case ("CHANGE_ELEMENT_VALUE"):
				// change value of an element
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.changeValOnSliderElement(activity.segmentParams);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);	
				break
			case ("FAKE_SUBTOPICS"):
				// change subtopics to a dummy in intro to site						
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.changeSubtopicsOnIntroPage(activity.segmentParams);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break;
			case ("REMOVE_FAKE_SUBTOPICS"):
				// change dummy subtopics out to what it was originally					
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.revertSubtopicsOnIntroPage(activity.segmentParams);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break;
			
			default:
				console.log('SW error in autoDemo switch stmt, switch select value was ' + activity.segmentActivity);
				break;
		} // end of switch stmt
		return [nextItemStartTime, anIndex]; 
	}
	startDemo() {
		let currSeg = this.currSeg;
		// activate pause and disable play
	    $('#playSegment').prop('disabled', true);  // disable play once playing
	    $('#stopSegment').prop('disabled', false);  // reactivate pause
	    this.setCurrSeg(parseInt($('#segNum').val()));
	    // remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay'); 
		if ((currSeg >= 0) && (currSeg <= this.fullScript.length)) {
			// valid segment number
			let segment = this.fullScript[currSeg];
			//console.log('name of segment ' + currSeg + ' is ' + segment.segmentName);
			this.userStopRequest = false;  // in case coming here from a previous stop, user stop is history, lets play
			let nextItemBeginTime = segment.headStartForAudioMillisec;  // delay index, index of items that need ever increasing delay
			let annotateInd = 0;

			segment.segmentActivities.forEach(activity => {
				// this will almost certainly not pause the demo as all the activities will be launched off  immediately
				// and execute when setTimeout expires...  but just in case user pauses immediately...
				if (!this.userStopRequest) {
					console.log('inside base class startDemo, nextItemBeginTime = '  + nextItemBeginTime);
					[nextItemBeginTime, annotateInd] = this.doTheSegmentAction(activity, nextItemBeginTime, annotateInd);
				} // end of if not pause demo
			});  // end of forEach activity
		} else {console.log('Coding Error, incorrect segment number called out in startDemo of ' + currSeg)};
	}
};
class AutoDemoWithCanvas extends AutoDemo {
	constructor(multiSegScript, stringIDOfCanvas) {
	// This script is made up of many segments, which can be run independently.  Each segment has
	// several steps consisting of (maybe) audio, event clicking, annotations etc but we add the ability to move the
	// cursor over canvas elements to show how they work
	super(multiSegScript);
	this.canvasID = '#' + stringIDOfCanvas;
	let ctxDemoCanvas = this.getDemoCtx(this.canvasID);
	// background plot is the appearance before this segment operates and will return to this value			
	this.backgroundPlot = ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height);			
	}
	//************* 
	// Handle all canvas related activities
	//*************
	// get the context of the canvas used for the demo
	getDemoCtx() {
		let ctxDemoCanvas;
		this.canvasID = this.canvasID;
		let demoCanvas =  $(this.canvasID).get(0);  // later on, this will be used to clear the canvas
		// get ready to start drawing on this canvas, first get the context
		if ( $(this.canvasID).length ) {
	    	ctxDemoCanvas = $(this.canvasID).get(0).getContext('2d');
		} else {
	    	console.log('Cannot obtain demo canvas context');
		}
		return {ctx: ctxDemoCanvas, width: demoCanvas.width, height: demoCanvas.height};
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
	
	// the segment is over when the audio is over, time to clean up our toys to allow user to use site or play next seg
	segmentOverCleanup(){	
		let ctxDemoCanvas = this.getDemoCtx();
		ctxDemoCanvas.ctx.putImageData(this.backgroundPlot, 0, 0);
		// go finish up all other stuff
		super.segmentOverCleanup();
		// when done, ensure demo canvas is back to background so user can interact with dots again
		$(this.canvasID).css('z-index',-1);
	}
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
		//console.log('clicking on point (' + xyPt.x + ' , '+ xyPt.y + ')');
		//execute event on element
		segmentParams.canvas.dispatchEvent(clickCanvasPt);
	}

	doTheSegmentAction(activity, nextItemBeginTime, annotateInd){
		let temp;
		let thisObj = this;
		let anIndex = annotateInd;
		let nextItemStartTime = nextItemBeginTime;
		let ctxDemoCanvas = this.getDemoCtx();
		let annotatePlot = ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height);  
		// make sure the canvas for demo is at top layer so all activity is visible
		$(this.canvasID).css('z-index',100);
		switch (activity.segmentActivity) {
			case ("CLICK_ON_CANVAS"):
				// CLICK_ON_CANVAS
				// all these actions get sent to the EventLoop simultaneously, want to slow down for user
				temp = setTimeout(function(){
					if (nextItemStartTime > nextItemBeginTime) {
						// We are past first point, get rid of old cursor, we are adding a new one
						ctxDemoCanvas.ctx.putImageData(annotatePlot, 0, 0);
					};
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.moveCursorImgOnCanvas(activity.segmentParams);
				}, nextItemStartTime);
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);
				break;

			case ("ANNOTATION"):
				// ANNOTATION on a canvas
				temp = setTimeout(function(){
					// setTimeout thinks 'this' is Window and not the instantiation of AutoDemo, must tell it explicitely
					thisObj.drawAnnotation(activity.segmentParams);
					// want to keep annotation for awhile so save it for later use
					annotatePlot = ctxDemoCanvas.ctx.getImageData(0, 0, ctxDemoCanvas.width, ctxDemoCanvas.height);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);				
				break;

			case ("REMOVE_LAST_CANVAS_ANNOTATION"):
				// REMOVE_LAST_CANVAS_ANNOTATION, delete an old red cursor that leftover
				temp = setTimeout(function(){
					// remove last annotaton on the canvas
					ctxDemoCanvas.ctx.putImageData(annotatePlot, 0, 0);
				}, nextItemStartTime);	
				nextItemStartTime = nextItemStartTime + activity.segmentParams.waitTimeMillisec;
				this.eventLoopPtrs.push(temp);		
				break;					
			default:
				//This class only handles canvas actions, for all else, go to parent class
				[nextItemStartTime, anIndex] = super.doTheSegmentAction(activity, nextItemBeginTime, annotateInd);
				break;
		} // end of switch stmt
		return [nextItemStartTime, anIndex]; 
	}
}


 	
