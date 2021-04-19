
// NOTE, this function uses WebAudio in library Tone.js.  At this time, it does not work in IE Edge
var currFreq = document.getElementById("in-range-freq");
var currAmp = document.getElementById("in-range-amp");
var currPhase = document.getElementById("in-range-phase")

// effectively, this is a singleton, a static class
class ToneHandler {
	
	static ToneIsOnNow = false;
	static osc = new Tone.Oscillator(); 


	
	constructor() {
		// initialize the value boxes for each element
		// using innerHTML allows use of XSS hack since the input would be interpreted as HTML and executed.  Here, we just
		// take the text only and put in label box
		document.getElementById("currFreq").textContent = document.getElementById("in-range-freq").value;
		document.getElementById("currAmp").textContent = document.getElementById("in-range-amp").value;
		document.getElementById("currPhase").textContent = document.getElementById("in-range-phase").value;
		
	}
	
	static ChangeFreq()
	{
		//min and max freq chosen depends on audio speakers used, my speakers can just barely respond at 100 Hz
		currFreq= document.getElementById("in-range-freq")
		document.getElementById("currFreq").textContent = currFreq.value;
		if (this.ToneIsOnNow==true) {
			this.osc.frequency.value = currFreq.value;
			// if tone isn't on, don't have to change anything...
		}
	}
	static ChangeAmp()
	{
		currAmp = document.getElementById("in-range-amp")
		document.getElementById("currAmp").textContent = currAmp.value;
		if (this.ToneIsOnNow==true) {
			var tonejs_dB = -40 + 20.0 * Math.log10(currAmp.value);
			this.osc.volume.value = tonejs_dB;
			// if tone isn't on, don't have to change anything...
		}
	}
	static ChangePhase()
	{
		currPhase = document.getElementById("in-range-phase")
		document.getElementById("currPhase").textContent = currPhase.value;
		if (this.ToneIsOnNow==true) {
			this.osc.phase = currPhase.value;
			console.log("current phase is " + currPhase.value)
			// if tone isn't on, don't have to change anything...
		}
	}
	
	static StartStopTone()
	{	
		if (typeof this.ToneIsOnNow == "undefined")  {
			// First time in, 
			this.ToneIsOnNow = false;
		};
		// convert amplitude to what tone.js calls decibels.  In tone.js, -40 dB is very quiet
		// and 0 dB is plenty loud enough.  I know this isn't the music industry definition (decibel SPL where 0 dB
		// is the quietest sound one can hear and 100 dB will cause hearing damage) so I will say Amplitude = 1
		// is min audible and amplitude 40 dB higher (40 = 20log(A1/A0) or A1=100 if A0 = 1) is max we want to put out
		var tonejs_dB = -40 + 20.0 * Math.log10(currAmp.value);
		if (this.ToneIsOnNow==false) {
			// currently false, clicked by user and about to be true 
			this.osc = new Tone.Oscillator({
					frequency: currFreq.value, 
					volume: tonejs_dB,
					phase: currPhase.value,
					type:"sine"});
			this.osc.toDestination().start();	
			document.getElementById("start-stop-button").value = "Stop Tone";
			this.ToneIsOnNow = true;
		} else {
			this.osc.toDestination().stop();
			document.getElementById("start-stop-button").value = "Start Tone";
			this.ToneIsOnNow = false;
		}
		
	}
	

 
}
//want to round but leave value as number, not string, so toFixed() is out. 
//If x axis is a number, chart js will figure out grid lines/step size as needed
function roundFP(number, prec) {
    var tempnumber = number * Math.pow(10, prec);
    tempnumber = Math.round(tempnumber);
    return tempnumber / Math.pow(10, prec);
}

var timeMsLo = [];
var ampLo = [];
var timeMsHi = [];
var ampHi = [];

var ctxLo = document.getElementById('sine_plotsLo').getContext("2d");;
var ctxHi = document.getElementById('sine_plotsHi').getContext("2d");;
const NUM_PTS_PLOT = 200;
const DURATION_LO_PLOT_MS = 10
const DURATION_HI_PLOT_MS = 1
// sample period in sec
var samplePeriodLo = DURATION_LO_PLOT_MS/(1000 * NUM_PTS_PLOT);
var samplePeriodHi = DURATION_HI_PLOT_MS/(1000 * NUM_PTS_PLOT);
var i;
for (i=0; i<=NUM_PTS_PLOT; i++) {
	ampLo[i] = currAmp.value * Math.sin(2 * Math.PI * (currFreq.value * i * samplePeriodLo + currPhase.value / 360.0) );
	timeMsLo[i] = roundFP(i * samplePeriodLo * 1000, 2);
	ampHi[i] = currAmp.value * Math.sin(2 * Math.PI * (currFreq.value * i * samplePeriodHi + currPhase.value / 360.0) );
	timeMsHi[i] = roundFP(i * samplePeriodHi * 1000, 2);
	//console.log("freq = " + currFreq.value + " i = " + i + " time = " + time[i] + " sine = " + amp[i])
}

//if x and y axis labels don't show, probably chart size isn't big enough and they get clipped out
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
    options: {
    	responsive: true,
		title: {
			display: true,
			text: 'Sine Wave Amplitude as function of time (in millisec)'
		},
		scales: {

			xAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'milliseconds'
				},

			}],
			yAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'amplitude'
				}
			}]
		}
	}
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
    options: {
    	responsive: true,

		scales: {

			xAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'milliseconds'
				},

			}],
			yAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'amplitude'
				}
			}]
		}
	}
 }
);

function drawTone()
{
	for (i=0; i<=NUM_PTS_PLOT; i++) {
		ampLo[i] = currAmp.value * Math.sin(2 * Math.PI * (currFreq.value * i * samplePeriodLo + currPhase.value / 360.0) );
		//timeMsLo[i] = roundFP(i * samplePeriodLo * 1000, 2);
		ampHi[i] = currAmp.value * Math.sin(2 * Math.PI * (currFreq.value * i * samplePeriodHi + currPhase.value / 360.0) );
		//timeMsHi[i] = roundFP(i * samplePeriodHi * 1000, 2);
		//console.log("freq = " + currFreq.value + " i = " + i + " time = " + time[i] + " sine = " + amp[i])
	}
	// update time, need to add the new and THEN remove the old.  X axis doesn't like to be empty...
    //sine_plot_100_1k.data.labels.push(timeMsLo);
	//sine_plot_100_1k.data.labels.pop();
	
    // update tone, remove old (although for now, just one data set), add new
    sine_plot_100_1k.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    sine_plot_100_1k.data.datasets.forEach((dataset) => {
        dataset.data.push(ampLo);
    });	                
    //sine_plot.options.scales.xAxes[0].ticks.minRotation = 45;
    sine_plot_100_1k.update();
    
    // update tone, remove old (although for now, just one data set), add new
    sine_plot_1k_10k.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    sine_plot_1k_10k.data.datasets.forEach((dataset) => {
        dataset.data.push(ampHi);
    });	                
    //sine_plot.options.scales.xAxes[0].ticks.minRotation = 45;
    sine_plot_1k_10k.update();
    
}

//purpose is to fill in labels for initial settings, not used thereafter
var myTone = new ToneHandler;
var toneChangeUpdt = document.getElementById("toneChanges");
toneChangeUpdt.addEventListener('input', drawTone, false);

