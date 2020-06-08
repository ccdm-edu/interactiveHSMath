'''
Created on Apr 26, 2020

@author: Owner
'''

#supposedly this line is bad practice
from tkinter import *
#--------------------------------
import tkinter as tk
from tkinter import ttk
import Pmw
from enum import Enum
import numpy as np
import matplotlib.pyplot as plot
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
from tkinter.constants import HORIZONTAL
import matplotlib.animation as animation
from matplotlib import style
import sounddevice as sd
import soundfile as sf

#DO add docstrings before each function and learn how to extract doc strings
#learn the style guide for python as well

#initial values
#amplitude scale factor keeps us from over driving the speaker and saturating
ampScaleFactor = 0.01
currAmp = 20 
currFreq = 1000
FSAMP_DIV_TONE_FREQ = 10
fsamp = currFreq*FSAMP_DIV_TONE_FREQ
# updates per second in animation
animationUpdateRate = 10
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
        
class HelpType(Enum): 
    NO_TYPE = 0, 
    AMP_ADJ_TYPE = 1, 
    FREQ_ADJ_TYPE = 2, 
    GRAPH_ADJ_TYPE = 3

class ContextSensHelp(tk.Tk):
    def __init__(self, root):
        self.topLevel = None
        self.type = HelpType.NO_TYPE
        self.xOrigin = root.winfo_x()
        self.yOrigin = root.winfo_y()
        self.parent = root
        
    def openWindow(self, widgetNeedingHelp):
        #print('window typpe is ', self.type)
        if (widgetNeedingHelp == amplitudeAdjust):
            #print ('put up Amplitude Adjust help')
            if (self.topLevel != None) and (self.type != HelpType.AMP_ADJ_TYPE):
                #we have an old window up
                self.removeWindow()
            if (self.topLevel == None):
                self.topLevel= tk.Toplevel()
                self.topLevel.wm_title("Hints")
                
                #this kinda works,
                #need to understand this better, cant put scrollbar on toplevel window without canvas
                ksbar=Scrollbar(self.topLevel, orient=VERTICAL)
                ksbar.grid(row=0, column=1, sticky="ns")
 
                popCanv = Canvas(self.topLevel, width=200, height = 50,
                          scrollregion=(0,0,180,200)) 
                
                popCanv.grid(row=0, column=0, sticky="nsew") 
                  
                ksbar.config(command=popCanv.yview)
                popCanv.config(yscrollcommand = ksbar.set)
                
                #x = root.winfo_x()
                #y = root.winfo_y()
                #doesn't work when use neg values, location seems relative to absolute win7 location, 
                #not the application master window.  self.xOrigin and self.yOrigin are both 0
                self.topLevel.geometry("%dx%d+%d+%d" % (200,50,100, 100))
                #print(self.topLevel.winfo_width(), self.topLevel.winfo_height())
                #gets rid of the top level window stuff, but dont want to tie users hands
                #self.topLevel.overrideredirect(True)
                
                #need the width to be less than canvas width so have room for scroll bar and it will break
                # up long sentences, width must be less than scroll region width
                popCanv.create_text(0,0,anchor = tk.NW, width=170, text="Here I would write alot of helpful stuff on changing amplitude and even more stuff and evem more stuff still until we fill up all space and need a scroll bar on the side hopefully")

                self.topLevel.rowconfigure(0, weight=1) 
                self.topLevel.columnconfigure(0, weight=1)                         
        
                self.topLevel.protocol('WM_DELETE_WINDOW', self.removeWindow)
                self.type = HelpType.AMP_ADJ_TYPE
                

        elif (widgetNeedingHelp == freqAdjust):
            #print(' put up freq adjust help')
#             if (self.topLevel != None) and (self.type != HelpType.FREQ_ADJ_TYPE):
#                 #we have an old window up
#                 self.removeWindow()
#             if (self.topLevel == None):
#                 self.topLevel= tk.Toplevel()
#                 self.topLevel.wm_title("Hints")
#                 msg = Label(self.topLevel, text="Here I would write alot of helpful\n stuff on changing freq")
#                 msg.pack()
#                 self.topLevel.protocol('WM_DELETE_WINDOW', self.removeWindow)
#                 self.type = HelpType.FREQ_ADJ_TYPE
            data,samplerate = sf.read("C:\Cathy\PythonDev\BalooPurrWavTest.wav")
            sd.play(data,samplerate)
            sd.wait()
        elif (widgetNeedingHelp == canvas.get_tk_widget()):
            #print(' put up canvas help')
            if (self.topLevel != None) and (self.type != HelpType.GRAPH_ADJ_TYPE):
                #we have an old window up
                self.removeWindow()
            if (self.topLevel == None):
                self.topLevel= tk.Toplevel()
                self.topLevel.wm_title("Hints")
                msg = Label(self.topLevel, text="Here I would write alot of helpful\n stuff on graph")
                msg.pack()
                self.topLevel.protocol('WM_DELETE_WINDOW', self.removeWindow)
                self.type = HelpType.GRAPH_ADJ_TYPE
        else:
            print ('widget type is ', widgetNeedingHelp)
            #dont think this is needed.  THIS DOES GET USED, how?  why?
            if (self.topLevel != None):
                self.removeWindow()
            
    def removeWindow(self):
        self.topLevel.destroy()
        self.topLevel = None
            
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
    amplitude   = currAmp * ampScaleFactor * np.sin(2*np.pi*currFreq*time)
    sinPlot.clear()
    sinPlot.plot(time,amplitude)
    sinPlot.title.set_text("Real Time Sine plot")
    sinPlot.set_ylabel("Amplitude*sin(2*pi*Frequency*time)")
    sinPlot.set_xlabel("time (ms)")
    sinPlot.grid()
    #sd.play(amplitude,samplerate=fsamp,loop=TRUE)

def mouseLocation(event):
    csw.openWindow(event.widget)
   
 
root = Tk()
root.bind('<Motion>', mouseLocation)
root.geometry("+%d+%d" % (50, 50))
csw = ContextSensHelp(root)
app=Window(root)

##Allow user input
#--amplitude, default length is 100
amplitudeAdjust = Scale(root,from_=0, to=500,orient=HORIZONTAL, label="Amplitude", command=amplitudeChanged)
amplitudeAdjust.set(currAmp)
amplitudeAdjust.grid(row=0, column = 1)

#--frequency
freqAdjust = Scale(root,from_=10, to=10000, orient=HORIZONTAL, label="Frequency", command=freqChanged)
freqAdjust.config(length=300)
freqAdjust.set(currFreq)
freqAdjust.grid(row=0, column = 2)
freqAdjBalloon = Pmw.Balloon(root)
freqAdjBalloon.bind(freqAdjust, "Here I add some Freq adj things")

f = Figure(figsize=(5,5), dpi=100)
sinPlot = f.add_subplot(111)
maxNPeriods = np.trunc(currFreq*(animationPeriod - 1/fsamp))
maxTimeNPeriods = maxNPeriods/currFreq + 1/fsamp
time        = np.arange(0, maxTimeNPeriods, 1/fsamp);
# Amplitude of the sine wave is sine of a variable like time
amplitude   = currAmp * ampScaleFactor * np.sin(2*np.pi*currFreq*time)

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

