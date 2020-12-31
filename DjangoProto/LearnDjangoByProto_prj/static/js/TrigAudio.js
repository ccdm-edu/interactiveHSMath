
// NOTE, this function uses WebAudio in library Tone.js.  At this time, it does not work in IE Edge

// effectively, this is a singleton, a static class
class ToneHandler {
	
	static ToneIsOnNow = false;
	static currFreq = document.getElementById("in-range-freq")
	static currAmp = document.getElementById("in-range-amp")
	static currPhase = document.getElementById("in-range-phase")
	static osc = new Tone.Oscillator(); 
	
	constructor() {
		// initialize the value boxes for each element
		document.getElementById("currFreq").innerHTML = document.getElementById("in-range-freq").value;
		document.getElementById("currAmp").innerHTML = document.getElementById("in-range-amp").value;
		document.getElementById("currPhase").innerHTML = document.getElementById("in-range-phase").value;
	}
	
	static ChangeFreq()
	{
		//min and max freq chosen depends on audio speakers used, my speakers can just barely respond at 100 Hz
		this.currFreq= document.getElementById("in-range-freq")
		document.getElementById("currFreq").innerHTML = this.currFreq.value;
		if (this.ToneIsOnNow==true) {
			this.osc.frequency.value = this.currFreq.value;
			// if tone isn't on, don't have to change anything...
		}
	}
	static ChangeAmp()
	{
		this.currAmp = document.getElementById("in-range-amp")
		document.getElementById("currAmp").innerHTML = this.currAmp.value;
		if (this.ToneIsOnNow==true) {
			var tonejs_dB = -40 + 20.0 * Math.log10(this.currAmp.value);
			this.osc.volume.value = tonejs_dB;
			// if tone isn't on, don't have to change anything...
		}
	}
	static ChangePhase()
	{
		this.currPhase = document.getElementById("in-range-phase")
		document.getElementById("currPhase").innerHTML = this.currPhase.value;
		if (this.ToneIsOnNow==true) {
			this.osc.phase = this.currPhase.value;
			console.log("current phase is " + this.currPhase.value)
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
		var tonejs_dB = -40 + 20.0 * Math.log10(this.currAmp.value);
		if (this.ToneIsOnNow==false) {
			this.osc = new Tone.Oscillator({
					frequency: this.currFreq.value, 
					volume: tonejs_dB,
					phase: this.currPhase.value,
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


//purpose is to fill in labels for initial settings, not used thereafter
var myTone = new ToneHandler;

