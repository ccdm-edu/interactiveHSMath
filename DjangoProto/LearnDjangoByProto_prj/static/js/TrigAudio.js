'use strict'
// implement the Tone sounding and chart tools
var currFreq = document.getElementById("in-range-freq");
var currAmp = document.getElementById("in-range-amp");
var currPhase = document.getElementById("in-range-phase")

var ToneIsOnNow = false;
var osc = new Tone.Oscillator(); 

// yeah, shouldn't just update global variables but need to tackle issue of namespaces
var timeMsLo = [];
var ampLo = [];
var timeMsHi = [];
var ampHi = [];

var ctxLo = document.getElementById('sine_plotsLo').getContext("2d");
var ctxHi = document.getElementById('sine_plotsHi').getContext("2d");

//if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
const CHART_OPTIONS = {
	maintainAspectRatio: false,  //uses the size it is given
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

var currTitle = {display: true, text: 'y = ' + currAmp.value + ' * sin{ 2 * pi * (' + currFreq.value + ' * t + ' + currPhase.value + '/360) }'};

const TOP_CHART = {...CHART_OPTIONS, title: currTitle };
var sine_plot_100_1k = new Chart(ctxLo, {
    type: 'line',
    data: {
    	labels: timeMsLo,
        datasets: [{
            label: 'Tone Graph',
            data: ampLo,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            }]
    },
    options: TOP_CHART
 }
);
// if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
var sine_plot_1k_10k = new Chart(ctxHi, {
    type: 'line',
    data: {
    	labels: timeMsHi,
        datasets: [{
            label: 'Tone Graph',
            data: ampHi,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            }]
    },
    options: CHART_OPTIONS
 }
);

// NOTE, this function uses WebAudio in library Tone.js.  At this time, it does not work in IE Edge
function changeFreq()
{
	//min and max freq chosen depends on audio speakers used, my speakers can just barely respond at 100 Hz
	currFreq= document.getElementById("in-range-freq")
	document.getElementById("currFreq").textContent = currFreq.value;
	if (ToneIsOnNow==true) {
		osc.frequency.value = currFreq.value;
		// if tone isn't on, don't have to change anything...
	}
};
function changeAmp()
{
	currAmp = document.getElementById("in-range-amp")
	document.getElementById("currAmp").textContent = currAmp.value;
	if (ToneIsOnNow==true) {
		var tonejs_dB = -40 + 20.0 * Math.log10(currAmp.value);
		osc.volume.value = tonejs_dB;
		// if tone isn't on, don't have to change anything...
	}
};
function changePhase()
{
	currPhase = document.getElementById("in-range-phase")
	document.getElementById("currPhase").textContent = currPhase.value;
	// LATER:  look to improve the pop up from alert to something better looking
	switch (parseInt(currPhase.value)) {
		case 180:
			alert('Hey Look!  phase = 180 is a negative sine wave! \nsin(a+180) = sin(a)cos(180) + cos(a)sin(180)\n                  = sin(a) * -1       + cos(a) * 0 \n                  = -sin(a)');
			break;
		case 270:
			alert('Hey Look!  phase = 270 is a negative cosine wave! \nsin(a+270) = sin(a)cos(270) + cos(a)sin(270)\n                  = sin(a) * 0       + cos(a) * -1 \n                  = -cos(a)');
			break;
		case 360:
			alert('Hey Look!  phase = 360 = 0 is a sine wave! \nWhy?  Because 360 degrees = 2 pi takes you back to the beginning at zero');
			break;
	}
	if (ToneIsOnNow==true) {
		osc.phase = currPhase.value;
		// if tone isn't on, don't have to change anything...
	}
};
function startStopTone()
{	
	if (typeof ToneIsOnNow == "undefined")  {
		// First time in, 
		ToneIsOnNow = false;
	};
	// convert amplitude to what tone.js calls decibels.  In tone.js, -40 dB is very quiet
	// and 0 dB is plenty loud enough.  I know this isn't the music industry definition (decibel SPL where 0 dB
	// is the quietest sound one can hear and 100 dB will cause hearing damage) so I will say Amplitude = 1
	// is min audible and amplitude 40 dB higher (40 = 20log(A1/A0) or A1=100 if A0 = 1) is max we want to put out
	var tonejs_dB = -40 + 20.0 * Math.log10(currAmp.value);
	if (ToneIsOnNow==false) {
		// currently false, clicked by user and about to be true 
		osc = new Tone.Oscillator({
				frequency: currFreq.value, 
				volume: tonejs_dB,
				phase: currPhase.value,
				type:"sine"});
		osc.toDestination().start();	
		document.getElementById("start-stop-button").value = "Stop Tone";
		ToneIsOnNow = true;
	} else {
		osc.toDestination().stop();
		document.getElementById("start-stop-button").value = "Start Tone";
		ToneIsOnNow = false;
	}
	
};
function drawTone()
{

	fillInArrays();
	// CHART js hint:  update time, need to add the new and THEN remove the old.  X axis doesn't like to be empty...
	
    // update tone, remove old (although for now, just one data set), add new
    sine_plot_100_1k.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    sine_plot_100_1k.data.datasets.forEach((dataset) => {
        dataset.data.push(ampLo);
    });	   
    // update title to match new parameters
    // http://www.javascripter.net/faq/greekletters.htm added pi in as greek letter
    var currTitleText = 'y = ' + currAmp.value + ' * sin{ 2 * \u03C0 * (' + currFreq.value + ' * t + ' + currPhase.value + '/360) }';
    sine_plot_100_1k.options.title.text = currTitleText;
    // make all these changes happen
    sine_plot_100_1k.update();
    
    // update tone, remove old (although for now, just one data set), add new
    sine_plot_1k_10k.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    sine_plot_1k_10k.data.datasets.forEach((dataset) => {
        dataset.data.push(ampHi);
    });	                
    sine_plot_1k_10k.update();
    
};
//want to round but leave value as number, not string, so toFixed() is out. 
//If x axis is a number, chart js will figure out grid lines/step size as needed
function roundFP(number, prec) {
    var tempnumber = number * Math.pow(10, prec);
    tempnumber = Math.round(tempnumber);
    return tempnumber / Math.pow(10, prec);
};
function fillInArrays(){
	const NUM_PTS_PLOT = 200;
	const NUM_PTS_PLOT_LO = 1000;
	const DURATION_LO_PLOT_MS = 10;
	const DURATION_HI_PLOT_MS = 1;
	//sample period in sec
	var samplePeriodLo = DURATION_LO_PLOT_MS/(1000 * NUM_PTS_PLOT_LO);
	var samplePeriodHi = DURATION_HI_PLOT_MS/(1000 * NUM_PTS_PLOT);
	var i;
	for (i=0; i<=NUM_PTS_PLOT_LO; i++) {
		ampLo[i] = currAmp.value * Math.sin(2 * Math.PI * (currFreq.value * i * samplePeriodLo + currPhase.value / 360.0) );
		timeMsLo[i] = roundFP(i * samplePeriodLo * 1000, 2);
	}
	for (i=0; i<=NUM_PTS_PLOT; i++) {
		ampHi[i] = currAmp.value * Math.sin(2 * Math.PI * (currFreq.value * i * samplePeriodHi + currPhase.value / 360.0) );
		timeMsHi[i] = roundFP(i * samplePeriodHi * 1000, 2);
	}	
};



// draw line between the charts----------------------------------------------------------------------------------
//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
var ctxExpandTime = document.getElementById('timeExpand').getContext("2d");

// CONSTANTS FOR DRAWING LINES BETWEEN GRAPHS
const ZERO = 20;  // about where the zero axis ends up on the canvas
const ONE_MS = 48;
const CNV_W = ctxExpandTime.canvas.scrollWidth; //ctxExpandTime.canvas.clientWidth;
const CNV_H = ctxExpandTime.canvas.scrollHeight; //ctxExpandTime.canvas.clientHeight;
// I have no idea why I need this crazy fudge factor on  width of canvas, but it works
// I think javascript and css treat sizes differently
const END = CNV_W /2.69;
const ARW = 5; 
console.log("between graph canvas is sized " + "(" + CNV_W + " , " + CNV_H + ")");
ctxExpandTime.lineWidth = 1;

// draw a line from 0 ms to 0 ms
ctxExpandTime.beginPath();
ctxExpandTime.moveTo(ZERO, 0);
ctxExpandTime.lineTo(ZERO, CNV_H);
// left arrow
ctxExpandTime.moveTo(ZERO - ARW, CNV_H - ARW);
ctxExpandTime.lineTo(ZERO, CNV_H);
// right arrow
ctxExpandTime.moveTo(ZERO + ARW, CNV_H - ARW);
ctxExpandTime.lineTo(ZERO, CNV_H);


// draw line from 1 ms to 1 ms
ctxExpandTime.moveTo(ONE_MS, 0);
ctxExpandTime.lineTo(END, CNV_H - ARW);
// bottom arrow
ctxExpandTime.moveTo(END - ARW, CNV_H);
ctxExpandTime.lineTo(END, CNV_H - ARW)
//top arrow
ctxExpandTime.moveTo(END - ARW, CNV_H - 3*ARW)
ctxExpandTime.lineTo(END, CNV_H - ARW)
ctxExpandTime.stroke();
ctxExpandTime.closePath();

ctxExpandTime.font = "20px Arial";
ctxExpandTime.fillText("1ms", 40, CNV_H/2.5);
ctxExpandTime.fillText("expanded", 40, CNV_H/2.5 + 20);
//--------------------------------------------------------------------------------------------------------------------


//initialize default values for tone
fillInArrays();
drawTone();
document.getElementById("currFreq").textContent = document.getElementById("in-range-freq").value;
document.getElementById("currAmp").textContent = document.getElementById("in-range-amp").value;
document.getElementById("currPhase").textContent = document.getElementById("in-range-phase").value;


// set up observers who react to user change
var toneChangeUpdt = document.getElementById("toneChanges");
toneChangeUpdt.addEventListener('input', drawTone, false);
var freqUpdt = document.getElementById("in-range-freq");
freqUpdt.addEventListener('input', changeFreq, false);
var ampUpdt = document.getElementById("in-range-amp");
ampUpdt.addEventListener('input', changeAmp, false);
var phaseUpdt = document.getElementById("in-range-phase");
phaseUpdt.addEventListener('input', changePhase, false);
var onOffUpdt = document.getElementById("start-stop-button");
onOffUpdt.addEventListener('click', startStopTone, false);

