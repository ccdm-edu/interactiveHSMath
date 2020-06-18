'''
Created on Jun 11, 2020

@author: CCDM
'''

import tkinter as tk
from tkinter import ttk
from tkinter.font import Font
import ContextSensHelp as csh
import TrigSettings as setting
     
class ToneGen:
    def amplitudeChanged(self):
        print(f"new amp is {self.currAmp.get()}")
    
    
    def mouseLocation(self,event):
        if event.widget in self.widgetToCSH:
            #print(f'should go off to correct csh for amp {self.widgetToCSH.get(event.widget)}')
            self.widgetToCSH[event.widget].audioHelp()
        #otherwise, do nothing
        
        
    def __init__(self, currFrame, currSettings):
        self.currFrame = currFrame
        self.currFrame.bind_all('<Enter>', self.mouseLocation)
        #create a dictionary of context sens help associated with each such widget
        self.widgetToCSH = {}
        
        '''Initialize:
        Set up tone amplitude access
        Set up tone frequency access
        '''
        minAmp = 0
        maxAmp = 100
        self.amplitudeLabel = tk.Label(self.currFrame,
                                       text=f"Amplitude {minAmp} - {maxAmp}",
                                       font=Font(family='Helvetica', size=18, weight='bold'))
        self.amplitudeLabel.grid(row=0, column = 0)
        self.currAmp = tk.IntVar()
        #problem is that the amplitudeChanged doesnt hit if user types in new val and hits ret
        #readonly means no keystrokes allowed, if allow this, need to validate to know when changed-- DO LATER
        #dont think we want read only
        self.amplitudeAdjust = tk.Spinbox(self.currFrame, 
                                          from_=minAmp, 
                                          to=maxAmp, 
                                          textvariable = self.currAmp, 
                                          state = 'readonly', 
                                          command=self.amplitudeChanged, 
                                          width=3,
                                          font=Font(family='Helvetica', size=36, weight='bold'))
        self.amplitudeAdjust.grid(row=1, column = 0)
        ampInits = csh.ContextSensHelpInitable("Amplitude changes loudness of tone, when played.", 
                                               ["C:\Cathy\PythonDev\AudioHelp\Amp_csh1_eng.mp3",
                                               "C:\Cathy\PythonDev\AudioHelp\Amp_csh1_esp.mp3"])
        self.amplitude_csh = csh.ContextSensHelp(self.currFrame, self.amplitudeAdjust, currSettings, ampInits)
        self.widgetToCSH[self.amplitudeAdjust] = self.amplitude_csh


        

    








