'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	// put up autodemo image to introduce to students for future pages
	$("#startAutoDemo").css('display', 'inline-block');
		
	let musicCanvas =  $("#ClefWithNotes").get(0);  // foreground to detect user clicks
	let bkgdMusicCanvas = $("#NotesFilledIn").get(0);   // background to color in the notes when clicked
	// get ready to start drawing on this canvas, first get the context
	let ctxMusicCanvas;
	if ( $("#ClefWithNotes").length ) {
    	ctxMusicCanvas = $("#ClefWithNotes").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Trumpet b flat notes context');
	}
	let ctxBkgdMusicCanvas;
	if ( $("#NotesFilledIn").length ) {
    	ctxBkgdMusicCanvas = $("#NotesFilledIn").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain Trumpet b flat background notes context');
	}
	
	// put up the horizontal lines for notes
	const LEFT_X = 20;
	const RIGHT_X = 1000; 
	const START_Y = 20;
	const DELTA_Y = 40; 
	for (let ind = 0; ind<5; ind++) {
		ctxMusicCanvas.beginPath();
		ctxMusicCanvas.moveTo(LEFT_X, START_Y + ind*DELTA_Y);
		ctxMusicCanvas.lineTo(RIGHT_X, START_Y + ind*DELTA_Y);
		ctxMusicCanvas.stroke();
		ctxMusicCanvas.closePath();
	}
	//Add small line at bottom of low C
	ctxMusicCanvas.beginPath();
	ctxMusicCanvas.moveTo(LEFT_X + 150, START_Y + 5 * DELTA_Y);
	ctxMusicCanvas.lineTo(LEFT_X + 220, START_Y + 5 * DELTA_Y);
	ctxMusicCanvas.stroke();
	ctxMusicCanvas.closePath();	
	
	// fill in the note when user selects it and set up freq/equation
	var root = document.querySelector(':root');
	var rootStyles = window.getComputedStyle(root);
	// go to CSS, pull out scales values and pull off px suffix and convert to numbers
	const SCALES_HIGHEST_Y = parseInt(rootStyles.getPropertyValue('--HIGHEST_Y').replace('px',''));
	const SCALES_LOWEST_X = parseInt(rootStyles.getPropertyValue('--LOWEST_X').replace('px',''));
	const SCALES_DELTA_Y = parseInt(rootStyles.getPropertyValue('--DELTA_Y').replace('px',''));
	const SCALES_DELTA_X = parseInt(rootStyles.getPropertyValue('--DELTA_X').replace('px',''));
	const SCALES_IMAGE_X_OFFSET = 5;  // location of image is about this much off of center of note in x in pixels
	const SCALES_IMAGE_Y_OFFSET = 15; // location of image is about this much off of center of note in y in pixels

	// frequencies (freqHz) based on http://www.bitbrothers.com/~pbrown/Musical_Instruments/Trumpet/Trumpet_Tuning_Chart.pdf
	// notes and info from http://openmusictheory.com/pitches.html and https://bbtrumpet.com/blogs/Theory/naming-the-cs
	const trumpetNotes = [
		{
			// lowest C
			notePlayed: "C4",
			freqHz: 233.08,
			// position of center
			x: SCALES_LOWEST_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'red',	
		},
		{
			// D
			notePlayed: "D4",
			freqHz: 261.83,
			// position of center
			x: SCALES_LOWEST_X + SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'fuchsia',	
		},
		{
			// E
			notePlayed: "E4",
			freqHz: 293.67,
			// position of center
			x: SCALES_LOWEST_X + 2 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 2 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'orange',	
		},
		{
			// F
			notePlayed: "F4",
			freqHz: 311.13,
			// position of center
			x: SCALES_LOWEST_X + 3 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 3 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'gold',	
		},
		{
			// G
			notePlayed: "G4",
			freqHz: 349.23,
			// position of center
			x: SCALES_LOWEST_X + 4 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 4 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'chartreuse',	
		},
		{
			// A
			notePlayed: "A4",
			freqHz: 392.0,
			// position of center
			x: SCALES_LOWEST_X + 5 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 5 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'cyan',	
		},
		{
			// B
			notePlayed: "B4",
			freqHz: 440.0,
			// position of center
			x: SCALES_LOWEST_X + 6 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 6 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'dodgerblue',	
		},
		{
			// C
			notePlayed: "C5",
			freqHz: 466.16,
			// position of center
			x: SCALES_LOWEST_X + 7 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 7 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'mediumorchid',	
		},
		
	];
	// Add text on the staff for the proper note		
	$('#LowCNote').text(trumpetNotes[0].notePlayed);
	$('#DNote').text(trumpetNotes[1].notePlayed);
	$('#ENote').text(trumpetNotes[2].notePlayed);
	$('#FNote').text(trumpetNotes[3].notePlayed);
	$('#GNote').text(trumpetNotes[4].notePlayed);
	$('#ANote').text(trumpetNotes[5].notePlayed);
	$('#BNote').text(trumpetNotes[6].notePlayed);
	$('#CNote').text(trumpetNotes[7].notePlayed);
	
	// set up for outputing a tone of proper freq
	let osc = new Tone.Oscillator(); 
	// all tones have the following in common
	osc.type = "sine";
	
	// NOW we have the background image done.  As users click on a point and new stuff happens, we always come back to 
	// this point, so we save it to go back to it when we want to start over
	let bkgdPlotNotes = ctxBkgdMusicCanvas.getImageData(0, 0, bkgdMusicCanvas.width, bkgdMusicCanvas.height);

	//***********************************
	// this code is used to draw the sine waves on a graph
	//***********************************
	let timeMsLong = [];
	let ampLong = [];

	const NUM_PTS_PLOT_LONG = 1000;
	const DURATION_LONG_PLOT_MS = 10;	
	//sample period in sec
	// yes, these are ridiculously high rates, didn't want to have ANY sampling artifacts in plots...
	const samplePeriodLong = DURATION_LONG_PLOT_MS/(1000 * NUM_PTS_PLOT_LONG);
	
	function fillInArrays(){
		let i;
		for (i=0; i<=NUM_PTS_PLOT_LONG; i++) {
			ampLong[i] = Math.sin(2 * Math.PI * (selectedNote.freqHz * i * samplePeriodLong) );
			timeMsLong[i] = roundFP(i * samplePeriodLong * 1000, 2);		
		}

	};
	function drawTone()
	{
		// CHART js hint:  update time, need to add the new and THEN remove the old.  X axis doesn't like to be empty...
		// actually, I decided to never change time
		
	    // update tone, remove old (although for now, just one data set)
	    sine_plot_100_1k.data.datasets.forEach((dataset) => {
	    	// somehow, this pop changes the length of ampLong, so best to refill arrays afterwards to get full length
	    	// seems like a library bug? but one we can get around
	        dataset.data.pop();
	    });
				
	    // update title to match new parameters
	    // http://www.javascripter.net/faq/greekletters.htm added pi in as greek letter
	    sine_plot_100_1k.options.title.text = "y = sin(2 " + MULT_DOT + PI +  MULT_DOT + selectedNote.freqHz + MULT_DOT + " t)";
	    
		// now fill the arrays and push them to the plots
		fillInArrays();   
		// update 10 ms plot
		sine_plot_100_1k.data.datasets[0].data.push(ampLong);	
		sine_plot_100_1k.data.datasets[0].borderColor = selectedNote.noteColor;
		
	    // make all these changes happen
	    sine_plot_100_1k.update();	                    
	};
	
	let pitchGraphCanvas =  $("#PitchGraph").get(0);  
	let ctxPitchGraphCanvas;
	if ( $("#PitchGraph").length ) {
    	ctxPitchGraphCanvas = $("#PitchGraph").get(0).getContext('2d');
	} else {
    	console.log('Cannot obtain tone graph context');
	}
	//if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
	const CHART_OPTIONS = {
//		maintainAspectRatio: false,  //uses the size it is given.  For some reason, this doesn't work here
		responsive: true,
	    legend: {
	        display: false // gets rid of dataset label/legend
	     },
		elements:{
			point:{
				radius: 1     // to get rid of individual points
			}
		},
		scales: {
			xAxes: [{
				scaleLabel: {
					display: true,
					labelString: 't (milliseconds)'
				},
			}],
			yAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'y amplitude'
				}
			}]
		}
	};
	let currTitle = {display: true, text: ''};
	
	const TOP_CHART = {...CHART_OPTIONS, title: currTitle };
	Object.freeze(TOP_CHART);
	let sine_plot_100_1k = new Chart(ctxPitchGraphCanvas, {
	    type: 'line',
	    data: {
	    	labels: timeMsLong,
	        datasets: [{
	            label: 'Tone Graph',
	            data: ampLong,
	            fill: false,
	            borderColor: 'gold',
	            }]
	    },
	    options: TOP_CHART
	});

	
	//***********************************
	// user interacts with the trumpet notes
	//***********************************
	// Radius of whole note is 10px, this gives a little slop.  Users said 20 wasn't quite enough, especially for 
	// touch screen.  Can't go any larger else notes will overlap.
	const NOTE_RADIUS = 30;  
	const COLOR_RADIUS = 8; 
	let selectedNote = null;
    musicCanvas.addEventListener('click', (e) => {
		// need to convert canvas coord into bitmap coord
		let rect = musicCanvas.getBoundingClientRect();
		let pos;
		if (e instanceof CustomEvent) {
			// user is running automated demo
			pos = {
				x: e.detail.xVal,
				y: e.detail.yVal
			}
		}
		else if (e instanceof PointerEvent) {
			// user clicked on the circle
			pos = {
			  x: e.clientX - rect.left,
			  y: e.clientY - rect.top
			};	
		} else { console.log('ERROR:  unexpected event: ' + e);}
		Object.freeze(pos);
		let cntr = 0;
		
		trumpetNotes.forEach(note => {
			// not sure yet which dot the user clicked on, must search all
			if (isInside(pos, note, NOTE_RADIUS)) {
				// turn off colors of previously selected notes
				//clear any old drawings before we put up the new stuff, take it back to the background image
				ctxBkgdMusicCanvas.putImageData(bkgdPlotNotes, 0, 0);
				// turn note the new color on the bottommost layer of canvases
				ctxBkgdMusicCanvas.beginPath();
				ctxBkgdMusicCanvas.arc(note.x, note.y, COLOR_RADIUS, 0, 2 * Math.PI, true);
				ctxBkgdMusicCanvas.fillStyle = note.noteColor;
				ctxBkgdMusicCanvas.fill();
				ctxBkgdMusicCanvas.stroke();
				ctxBkgdMusicCanvas.closePath();
				// put up the freq info and equation and play note
				$("#noteSelectVal").text(note.notePlayed);
				$("#FreqOfNoteVal").text(note.freqHz + " Hz");
				// we want a blip between notes as user "plays a simple song", 
				osc.toDestination().stop(); // turn off existing tone to add a "blip" into the sound 
				osc.frequency.value = note.freqHz;
				setTimeout(function(){
					// put a blip in the note change
					if (!volumeOff) {
						//play only if volume is on, we know note is selected
						osc.toDestination().start();
					}	
				},100);
				selectedNote = note;
				$("#VolOnOff").prop("title", "");  // note is selected, no need to pester the user
				drawTone();
			}
		});
		// Now that user is getting into page, put up the audio intro "click me" verbiage
		$("#verbalIntro").css('visibility', 'visible');
	});	
	//***********************************
	// user adjusts volume, start out with default values
	//***********************************
	let $currVolume = $("#noteVol");
	$("#noteVolValue").text($currVolume.val());
	let tonejs_dB = -40 + 20.0 * Math.log10($currVolume.val());
	osc.volume.value = tonejs_dB;

	// allow for user changes
	$('#noteVol').on('input', function(){
		$currVolume = $("#noteVol");
		$("#noteVolValue").text($currVolume.val());
		tonejs_dB = -40 + 20.0 * Math.log10($currVolume.val());
		osc.volume.value = tonejs_dB;
	});
	//***********************************
	// user turns on and off sound
	//***********************************
	let volumeOff = false;
	const TURN_SOUND_OFF = "Silence";
	const TURN_SOUND_ON = "Sound";
	const SILENT_COLOR = "Lavender";
	const SOUND_COLOR = "LavenderBlush";
	// at powerup, button is a mute for volume
	$("#VolOnOff").prop("value", TURN_SOUND_OFF);
	$("#VolOnOff").css('background-color',SILENT_COLOR);
	// Handle user button interaction
	$('#VolOnOff').on('click', function(event){
		// if sound is on, button will say TURN_SOUND_OFF and vice versa
		volumeOff = (TURN_SOUND_OFF == $('#VolOnOff').attr("value")) ? false: true;
		if (null != selectedNote) {
			// user has selected note, let volume be on/off
			if (volumeOff) {
				// turn on tone				
				osc.toDestination().start();
				// here we change color/text on button
				$("#VolOnOff").prop("value", TURN_SOUND_OFF);
				$("#VolOnOff").css('background-color',SILENT_COLOR);
				volumeOff = false;
			} else {
				// sound is on, we turn it off, leave sliders alone
				osc.toDestination().stop();
				// here we change color/text on button
				$("#VolOnOff").prop("value", TURN_SOUND_ON);
				$("#VolOnOff").css('background-color', SOUND_COLOR);
				volumeOff = true;
			}
		} else {
			//user has not selected a note yet, since cursor over volume button, tell them to select a note
			$("#VolOnOff").prop("title", "Select note from above scales first");
		}	
	});
		
			
	//***********************************
	// user selects a song and code puts up notes to hit on staff
	//***********************************	
	$( "#Song1" ).click(function() {
  		//Twinkle Twinkle little star, how I wonder where you are
  		$('#notesToPlay').text("C4,C4,G4,G4,A4,A4,G4 - F4,F4,E4,E4,D4,D4,C4");
  		$('#notesToPlay').height('20px');
  		$('#notesToPlay').show();
  		$('#notesToPlayLabel').text("Notes For Twinkle Twinkle tune:");
  		// make the notes come out of trumpet to get the users attention at this point
		$("#trumpetersNotes").css('visibility', 'visible');
	});
	$( "#Song2" ).click(function() {
  		//Happy Birthday to you, Happy Birthday to you, Happy birthday dear 
  		$('#notesToPlay').text("C4,C4,D4,C4,F4,E4 - C4,C4,D4,C4,G4,F4 - C4,C4,C5,A4,F4,E4,D4");
  		$('#notesToPlay').height('40px');
  		$('#notesToPlay').show();
  		$('#notesToPlayLabel').text("Notes For Happy Birthday tune:");
  		// make the notes come out of trumpet to get the users attention at this point
		$("#trumpetersNotes").css('visibility', 'visible');
	});
	$( "#Song3" ).click(function() {
  		//Jingle Bells Jingle Bells, Jingle all the way
  		$('#notesToPlay').text("E4,E4,E4,E4,E4,E4,E4,G4,C4,D4,E4");
  		$('#notesToPlay').height('20px');
  		$('#notesToPlay').show();
  		$('#notesToPlayLabel').text("Notes For Jingle Bells tune:");
  		// make the notes come out of trumpet to get the users attention at this point
		$("#trumpetersNotes").css('visibility', 'visible');
	});
	//***********************************
	// User clicks on either image or the words around the image to get the audio intro
	//***********************************
	let helpAudio;	
	function playVerbalIntro() {
		// turn off whatever note is already playing  and set up staff to initial state
		osc.toDestination().stop();
		// deselect note
		ctxBkgdMusicCanvas.putImageData(bkgdPlotNotes, 0, 0);
		$("#noteSelectVal").text("");
		$("#FreqOfNoteVal").text("");
		// clear out graph and associated equation
		sine_plot_100_1k.options.title.text = "";
		ampLong.length = 0;  // zero out data and push to graph
		sine_plot_100_1k.data.datasets[0].data.push(ampLong);
		sine_plot_100_1k.update();	
		selectedNote = null;  // dont want to play any notes since notes deselected
				
		let context;
		// Safari has implemented AudioContext as webkitAudioContext so need next LOC
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();			

		// I don't think we need a csrf token for this ajax post.  1.  there is already a session ID required for this
		// request 2.  Nothing is stored to database, request must be a code for filename we have or else get error back
		// DO:  look into putting a loading spinner icon to show progress in bringing over file (see bootstrap lib)
	    $.ajax({url:  '../../static/AudioExpln/SineMusicIntro.mp3',
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
								verbalIntroIsPlaying = false;
								$("#verbalIntro").html("Click on me,<br><br>I've got something to say.");
							};
						} catch(e) {
							// most likely not enough space to createBuffer
							console.error(e);
							alert("Failed note file setup, error is " + e);
						}
																									
						// decodeAudioData is async and doesn't support promises, can't use try/catch for errors
						},function(err) { alert("err(decodeAudioData) on file for: Audio help for music trig intro" + " error =" + err); } )
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
    let verbalIntroIsPlaying = false;
    function playOrStopVerbalIntro(){
    	// dont want to play multiple time delayed versions of audio with multiple clicks
		if (!verbalIntroIsPlaying) {
			$("#verbalIntro").html("Click on me<br><br> to stop talking");
			playVerbalIntro();
			verbalIntroIsPlaying = true;
		} else {
			// turn off the existing audio
			helpAudio.stop(0);
			verbalIntroIsPlaying = false;
			$("#verbalIntro").html("Click on me,<br><br>I've got something to say.");
		}

	};

	$("#staticTrumpeter").click(function() {
		playOrStopVerbalIntro();
	});
	$("#verbalIntro").click(function() {
		playOrStopVerbalIntro();
	});
	
	//need to not have every css load on every page, when that is fixed, can get rid of this
	$('a[href="#AdvancedTopics"]').css('display', 'none');

    //********************************************************
	// create a "script" for the auto-demo tutorial, by now, all variables should be set
	//********************************************************	
    
	const SCRIPT_AUTO_DEMO = [
	{ segmentName: "Intro to Auto Demo",
	  headStartForAudioMillisec: 10000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: '../../static/AudioExpln/SineMusicIntro_Seg0.mp3',
			 	waitTimeMillisec: 0}
			},
			{segmentActivity: "ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{element: 'segNum', 
			 	 color: "red",
			 	 waitTimeMillisec: 5000}
			},
			{segmentActivity: "ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{element: 'totalSeg', 
			 	 color: "green",
			 	 waitTimeMillisec: 8000}
			},
			{segmentActivity: "REMOVE_ALL_ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{waitTimeMillisec: 1000}
			},
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'segNum',
			 	 action: "focus",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 16000}  // this is wait before you go on to next item
			},
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'segNum',
			 	 action: "focus",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	waitTimeMillisec: 8000}
			},
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'AdvancedTopics',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest", so neg x is south east
			 	 offset: {x: -200, y: 60},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			{segmentActivity: "SHOW_MODAL",
			 segmentParams:
			 	{element: 'AdvancedTopics',
			 	waitTimeMillisec: 0},  // wait time doesn't matter here
			 },
			 
	  ]
	},
	{ segmentName: "Sine waves sound great",
	  headStartForAudioMillisec: 15000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: '../../static/AudioExpln/SineMusicIntro_Seg1.mp3'}
			},
			// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
			// this of course relys on fact that demo canvas exactly overlays the canvas we plan to annotate
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: trumpetNotes[0],   // has an x y embedded with other stuff
			 	 canvas: ClefWithNotes,
			 	 waitTimeMillisec: 2000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: trumpetNotes[1],   // has an x y embedded with other stuff
			 	 canvas: ClefWithNotes,
			 	 waitTimeMillisec: 2000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: trumpetNotes[2],   // has an x y embedded with other stuff
			 	 canvas: ClefWithNotes,
			 	 waitTimeMillisec: 2000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: trumpetNotes[3],   // has an x y embedded with other stuff
			 	 canvas: ClefWithNotes,
			 	 waitTimeMillisec: 2000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: trumpetNotes[4],   // has an x y embedded with other stuff
			 	 canvas: ClefWithNotes,
			 	 waitTimeMillisec: 2000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: trumpetNotes[5],   // has an x y embedded with other stuff
			 	 canvas: ClefWithNotes,
			 	 waitTimeMillisec: 2000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: trumpetNotes[6],   // has an x y embedded with other stuff
			 	 canvas: ClefWithNotes,
			 	 waitTimeMillisec: 2000}
			},
			{segmentActivity: "CLICK_ON_CANVAS",
			 segmentParams: 
			 	{xyCoord: trumpetNotes[7],   // has an x y embedded with other stuff
			 	 canvas: ClefWithNotes,
			 	 waitTimeMillisec: 22000}
			},

			// here we click on play a tune and bring up twinkle twinkle notes
			// first bring up drop down menu
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'dropdownMenuSong',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'dropdownMenuSong',
			 	 action: "nothing",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	waitTimeMillisec: 1000}
			},

			// select desired song
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'Song1',
			 	 action: "focus",  // linger a bit here so user sees what to do
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'Song1',
			 	 action: "click",
			 	waitTimeMillisec: 8000}
			},
	  ]
	}
	];
		
    //****************************************************************************
    // User initiates autoDemo activity
    //****************************************************************************   
	//*** user clicks the start demo image, iniitalize everything
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO, 'funTutorial_MSIntro');  // give the demo the full script
    $('#startAutoDemo').on('click', function(event) {
		//first get rid of "lets do the demo" image and put up the demo controls
		$('#startAutoDemo').css('display', 'none');
		$('#autoDemoCtls').css('display', 'inline-block');
		$('#autoDemoCtls').css('visibility', 'visible');
		// fill in the controls properly
		$('#segName').html('<b>' + SCRIPT_AUTO_DEMO[0].segmentName + '</b>');
		$('#totalSeg').text('/' + SCRIPT_AUTO_DEMO.length);
		$('#segNum').attr('max', SCRIPT_AUTO_DEMO.length);
		demo.setCurrSeg(1);  // default start at begin
		$('#stopSegment').prop('disabled', true);  // when first start up, can only hit play
		
		// if, perchance, the trumpet player is speaking and introducint the section, turn it off
		playOrStopVerbalIntro();
		
		// here is where we get to push the titles up to the far right and squish them 
		// in to give more graph room
		$('#MusicIntroHeaders').css('left', '400px');

		
    });
    	
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************

	// User has selected play
    $('#playSegment').on('click', function(){	
    	// activate pause and disable play
    	$(this).prop('disabled', true);  // disable play once playing
    	$('#stopSegment').prop('disabled', false);  // reactivate pause
    	// this is only true for this pages demo...
    	let currSeg = parseInt($('#segNum').val());
    	if (1 == currSeg) {
    		//we are doing intro to demos, show what advanced topic link looks like 
    		$('a[href="#AdvancedTopics"]').css('display', 'block');
    	} else {
    		$('a[href="#AdvancedTopics"]').css('display', 'none');
    	}
    	demo.setCurrSeg(currSeg);
    	demo.startDemo();
    });
    
    $('#stopSegment').on('click', function(){	
    	demo.stopThisSegment();
    	// get rid of adv topics link, was for demo only
    	$('a[href="#AdvancedTopics"]').css('display', 'none');
    	// change icons so play is now enabled and stop is disabled
    	$(this).prop('disabled', true);  // disable play once playing
    	$('#playSegment').prop('disabled', false);  // reactivate play 
    });
    
    $('#dismissAutoDemo').on('click', function(){	
    	// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen
    	demo.stopThisSegment();  // may or may not be needed
    	
		$('#startAutoDemo').css('display', 'inline-block');
		$('#autoDemoCtls').css('display', 'none');
		
		// put the page back the way it was
		$('#MusicIntroHeaders').css('left', '130px');
		
    });
 
 
})
