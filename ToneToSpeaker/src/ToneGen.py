'''
Created on Jun 11, 2020

@author: CCDM
'''

import tkinter as tk
from tkinter import ttk
import ContextSensHelp

class Window(tk.Frame):
    def __init__(self,master = None):
        tk.Frame.__init__(self,master)
        self.master = master
        self.init_window()
        
    def init_window(self):
        self.master.title("Sine/Cosine as audio waveform")
        
    def client_exit(self):
        exit()
        
def amplitudeChanged():
    print(f"new amp is {currAmp.get()}")
    
def freqChanged(val):
    print("new freq is ", str(val))
    
def mouseLocation(event):
    print("mouse moved, do cshelp")
    
root = tk.Tk()
root.bind('<Motion>', mouseLocation)
root.geometry("+%d+%d" % (50, 50))
app=Window(root)

minAmp = 0
maxAmp = 100
amplitudeLabel = tk.Label(root,text=f"Amplitude {minAmp} - {maxAmp}")
amplitudeLabel.grid(row=0, column = 0)
currAmp = tk.IntVar()
#problem is that the amplitudeChanged doesnt hit if user types in new val and hits ret
#readonly means no keystrokes allowed, if allow this, need to validate to know when changed-- DO LATER
amplitudeAdjust = tk.Spinbox(root,from_=minAmp, to=maxAmp, textvariable = currAmp, state = 'readonly', command=amplitudeChanged)
amplitudeAdjust.grid(row=1, column = 0)


root.mainloop()

