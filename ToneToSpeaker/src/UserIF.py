'''
Created on Apr 26, 2020

@author: Owner
'''
from tkinter import *
import numpy as np
import matplotlib.pyplot as plot
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
from tkinter.constants import HORIZONTAL
import matplotlib.animation as animation
from matplotlib import style
import sounddevice as sd

#initial values
currAmp = 20
currFreq = 1000
FSAMP_DIV_TONE_FREQ = 10
fsamp = currFreq*FSAMP_DIV_TONE_FREQ
# updates per second in animation
animationUpdateRate = 100
animationPeriod = 1/animationUpdateRate

class Window(Frame):
    def __init__(self,master = None):
        Frame.__init__(self,master)
        self.master = master
        self.init_window()
        
    def init_window(self):
        self.master.title("Sine/Cosine as audio waveform")
        
    def client_exit(self):
        exit()
            
def amplitudeChanged(val):
    global currAmp
    currAmp = int(val)
    
def freqChanged(val):
    global currFreq, fsamp
    currFreq = int(val)
    fsamp = currFreq*FSAMP_DIV_TONE_FREQ
    
def animate(i):
    maxNPeriods = np.trunc(currFreq*(animationPeriod - 1/fsamp))
    maxTimeNPeriods = maxNPeriods/currFreq + 1/fsamp
    time        = np.arange(0, maxTimeNPeriods, 1/fsamp);
    amplitude   = currAmp * np.sin(2*np.pi*currFreq*time)
    sinPlot.clear()
    sinPlot.plot(time,amplitude)
    sinPlot.title.set_text("Real Time Sine plot")
    sinPlot.set_ylabel("Amplitude*sin(2*pi*Frequency*time)")
    sinPlot.set_xlabel("time (ms)")
    sinPlot.grid()
    sd.play(amplitude,samplerate=fsamp,loop=TRUE)
root = Tk()

app=Window(root)

##Allow user input
#--amplitude, default length is 100
amplitudeAdjust = Scale(root,from_=0, to=100,orient=HORIZONTAL, label="Amplitude", command=amplitudeChanged)
amplitudeAdjust.set(currAmp)
amplitudeAdjust.grid(row=0, column = 1)
#--frequency
freqAdjust = Scale(root,from_=10, to=20000, orient=HORIZONTAL, label="Frequency", command=freqChanged)
freqAdjust.config(length=500)
freqAdjust.set(currFreq)

freqAdjust.grid(row=0, column = 2)

f = Figure(figsize=(5,5), dpi=100)
sinPlot = f.add_subplot(111)
maxNPeriods = np.trunc(currFreq*(animationPeriod - 1/fsamp))
maxTimeNPeriods = maxNPeriods/currFreq + 1/fsamp
time        = np.arange(0, maxTimeNPeriods, 1/fsamp);
# Amplitude of the sine wave is sine of a variable like time
amplitude   = currAmp * np.sin(2*np.pi*currFreq*time)

#Plot a sine wave using time and amplitude obtained for the sine wave
#sinPlot.plot(time[:100], amplitude[:100])
sinPlot.plot(time, amplitude)
sinPlot.title.set_text("Real Time Sine plot")
sinPlot.set_ylabel("Amplitude*sin(2*pi*Frequency*time)")
sinPlot.set_xlabel("time (ms)")
sinPlot.grid()
canvas = FigureCanvasTkAgg(f,root)
canvas.get_tk_widget().grid(row = 1, column = 1, columnspan = 2)


liveSine = animation.FuncAnimation(f,animate,interval = 100)
root.mainloop()