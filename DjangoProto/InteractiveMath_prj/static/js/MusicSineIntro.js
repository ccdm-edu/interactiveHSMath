'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
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
	var rootStyles = getComputedStyle(root);
	// go to CSS, pull out scales values and pull off px suffix and convert to numbers
	const SCALES_HIGHEST_Y = parseInt(rootStyles.getPropertyValue('--HIGHEST_Y').replace('px',''));
	const SCALES_LOWEST_X = parseInt(rootStyles.getPropertyValue('--LOWEST_X').replace('px',''));
	const SCALES_DELTA_Y = parseInt(rootStyles.getPropertyValue('--DELTA_Y').replace('px',''));
	const SCALES_DELTA_X = parseInt(rootStyles.getPropertyValue('--DELTA_X').replace('px',''));
	const SCALES_IMAGE_X_OFFSET = 5;  // location of image is about this much off of center of note in x in pixels
	const SCALES_IMAGE_Y_OFFSET = 15; // location of image is about this much off of center of note in y in pixels

	// frequencies (freqHz) based on http://www.bitbrothers.com/~pbrown/Musical_Instruments/Trumpet/Trumpet_Tuning_Chart.pdf
	const trumpetNotes = [
		{
			// lowest C
			notePlayed: "C3",
			freqHz: 311.13,
			// position of center
			x: SCALES_LOWEST_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'red',	
		},
		{
			// D
			notePlayed: "D3",
			freqHz: 329.63,
			// position of center
			x: SCALES_LOWEST_X + SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'fuchsia',	
		},
		{
			// E
			notePlayed: "E3",
			freqHz: 349.23,
			// position of center
			x: SCALES_LOWEST_X + 2 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 2 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'orange',	
		},
		{
			// F
			notePlayed: "F3",
			freqHz: 369.99,
			// position of center
			x: SCALES_LOWEST_X + 3 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 3 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'gold',	
		},
		{
			// G
			notePlayed: "G3",
			freqHz: 392.0,
			// position of center
			x: SCALES_LOWEST_X + 4 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 4 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'chartreuse',	
		},
		{
			// A
			notePlayed: "A3",
			freqHz: 415.3,
			// position of center
			x: SCALES_LOWEST_X + 5 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 5 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'cyan',	
		},
		{
			// B
			notePlayed: "B3",
			freqHz: 440.0,
			// position of center
			x: SCALES_LOWEST_X + 6 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 6 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'dodgerblue',	
		},
		{
			// C
			notePlayed: "C4",
			freqHz: 466.16,
			// position of center
			x: SCALES_LOWEST_X + 7 * SCALES_DELTA_X + SCALES_IMAGE_X_OFFSET,
			y: SCALES_HIGHEST_Y - 7 * SCALES_DELTA_Y + SCALES_IMAGE_Y_OFFSET,
			noteColor: 'mediumorchid',	
		},
		
	];
	// set up for outputing a tone of proper freq
	let osc = new Tone.Oscillator(); 
	
	// NOW we have the background image done.  As users click on a point and new stuff happens, we always come back to 
	// this point, so we save it to go back to it when we want to start over
	let bkgdPlotNotes = ctxBkgdMusicCanvas.getImageData(0, 0, bkgdMusicCanvas.width, bkgdMusicCanvas.height);
	
	//***********************************
	// this code is used as user interacts with the trumpet notes
	//***********************************
	const NOTE_RADIUS = 20;  // radius of whole note is 10px, this gives a little slop
	const COLOR_RADIUS = 8; 
    musicCanvas.addEventListener('click', (e) => {
		// need to convert canvas coord into bitmap coord
		let rect = musicCanvas.getBoundingClientRect();
		const pos = {
		  x: e.clientX - rect.left,
		  y: e.clientY - rect.top
		};	
		Object.freeze(pos);
		let cntr = 0;
		
		trumpetNotes.forEach(note => {
			// not sure yet which dot the user clicked on, must search all
			console.log('note is at (' + note.x + ' , ' + note.y + ') ');
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
				osc.toDestination().stop(); // turn off existing tone
				if ('0' != $currVolume.val()) {
					osc = new Tone.Oscillator({
						frequency: note.freqHz, 
						volume: tonejs_dB,
						phase: 0,
						type:"sine"});
					osc.toDestination().start();
				}

					
				$("#EqtnOfNote").text("y = sin(2 " + MULT_DOT + " " + PI + " " + MULT_DOT + " " + note.freqHz + " " + MULT_DOT + " t)");
			}
		});
	});	
	//***********************************
	// this code is used as user adjusts volume, start out with default values
	//***********************************
	let $currVolume = $("#noteVol");
	$("#noteVolValue").text($currVolume.val());
	let tonejs_dB = -40 + 20.0 * Math.log10($currVolume.val());

	// allow for user changes
	$('#noteVol').on('input', function(){
		$currVolume = $("#noteVol")
		if ('0' === $currVolume.val()) {
			$("#noteVolValue").text("Mute");
			osc.toDestination().stop();
		}
		else {
			$("#noteVolValue").text($currVolume.val());
			tonejs_dB = -40 + 20.0 * Math.log10($currVolume.val());
			osc.volume.value = tonejs_dB;
		}
	});
})
