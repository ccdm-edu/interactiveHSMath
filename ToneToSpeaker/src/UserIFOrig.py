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

#SIZE_X = 1200
#SIZE_Y = 600

currAmp = 0
currFreq = 0

class Window(Frame):
    def __init__(self,master = None):
        Frame.__init__(self,master)
        self.master = master
        self.init_window()
    def init_window(self):
        self.master.title("Sine/Cosine as audio waveform")
        #self.pack(fill=BOTH, expand=1)
        quitButton = Button(self,text="Quit")
        #put quit button in lower right corner
        #quitButton.place(x=SIZE_X - 0.1 * SIZE_X,y=SIZE_Y - 0.1 * SIZE_Y)
        #self.matplotlibCanvas()
        
    #def matplotlibCanvas(self):
        #f = Figure(figsize=(5,5), dpi=100)
        #a= f.add_subplot(111)
        #time        = np.arange(0, 10, 0.1);
        # Amplitude of the sine wave is sine of a variable like time
        #amplitude   = np.sin(time)
        #Plot a sine wave using time and amplitude obtained for the sine wave
        #plot.plot(time, amplitude)
        #a.plot(time, amplitude)
        #canvas = FigureCanvasTkAgg(f,self)
        #canvas.show()
        #canvas.get_tk_widget().pack(side=BOTTOM, fill = BOTH, expand = True)
        #graphToolbar = NavigationToolbar2Tk(canvas, self)
        #graphToolbar.update()
        #canvas._tkcanvas.pack(side=BOTTOM, fill = BOTH, expand = True)
        #canvas._tkcanvas.place(x= 100, y = 200)
        
    def client_exit(self):
        exit()
            
def amplitudeChanged(val):
    currAmp = val
def freqChanged(val):
    currFreq = val
    
root = Tk()
#declare master window size
#root.geometry(str(SIZE_X) + 'x' + str(SIZE_Y))

app=Window(root)

##Allow user input
#--amplitude, default length is 100
amplitudeAdjust = Scale(root,from_=0, to=100,orient=HORIZONTAL, label="Amplitude", command=amplitudeChanged)
#amplitudeAdjust.place(x=0.1 * SIZE_X,y= 0.1 * SIZE_Y)
#amplitudeAdjust.pack(side= LEFT, fill=BOTH, expand = True)
amplitudeAdjust.grid(row=0, column = 1)
#--frequency
freqAdjust = Scale(root,from_=10, to=20000, orient=HORIZONTAL, label="Frequency", command=freqChanged)
freqAdjust.config(length=500)
#freqAdjust.place(x=0.3 * SIZE_X,y= 0.1 * SIZE_Y)
#freqAdjust.pack(side= LEFT, fill=BOTH, expand = True)
freqAdjust.grid(row=0, column = 2)

f = Figure(figsize=(5,5), dpi=100)
sinPlot= f.add_subplot(111)
time        = np.arange(0, 10, 0.1);
# Amplitude of the sine wave is sine of a variable like time
amplitude   = np.sin(time)
#Plot a sine wave using time and amplitude obtained for the sine wave
sinPlot.plot(time, amplitude)
sinPlot.title.set_text("Real Time Sine plot")
sinPlot.set_ylabel("Amplitude*sin(2*pi*Frequency*time)")
sinPlot.set_xlabel("time (ms)")
sinPlot.grid()
canvas = FigureCanvasTkAgg(f,root)
#canvas.get_tk_widget().pack(side=TOP, fill = BOTH, expand = True)
canvas.get_tk_widget().grid(row = 1, column = 1, columnspan = 2)
#graphToolbar = NavigationToolbar2Tk(canvas, self)
#graphToolbar.update()
#canvas._tkcanvas.pack(side=BOTTOM, fill = BOTH, expand = True)

#canvas._tkcanvas.place(x= 100, y = 200)
# Give a title for the sine wave plot
#plot.title('Sine wave')
# Give x axis label for the sine wave plot
#plot.xlabel('Time')
# Give y axis label for the sine wave plot
#plot.ylabel('Amplitude = sin(time)')
#plot.grid(True, which='both')
#plot.axhline(y=0, color='k')
#plot.show()


root.mainloop()