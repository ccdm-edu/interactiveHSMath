'''
Created on Jun 11, 2020

@author: CCDM
'''
import logging

import threading
import time
import tkinter as tk
from tkinter import ttk
from tkinter.font import Font
import argparse
import numpy as np
import sounddevice as sd

import matplotlib.pyplot as plot
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
import matplotlib.animation as animation
from matplotlib import style

#--file imports
import ContextSensHelp as csh
import TrigSettings as setting


#want to use same method to plot for audio as graph
def plotSine(outdata, sampleRate, numPts, freq, amp, phase, dcoffset, startTime):   
    t = (startTime + np.arange(numPts)) / sampleRate
    t = t.reshape(-1, 1) 
    outdata[:] = ToneGen.SCALE_FACTOR * (float(amp) *np.sin(2 * np.pi * float(freq) * t + float(phase)) + dcoffset)

         
def runPlayTone(startStopTone, toneFreq, toneAmp, tonePhase):
    logging.info("Entered") 
    #take the default output device and get the default sample rate
    sampleRate = sd.query_devices('output')['default_samplerate']
    start_idx = 0
    currToneFreq = float(toneFreq())
 
    #if choose to do logging here, need to be thread safe
    #play tone while button is pushed, end when "unpushed"
    def callback(outdata, frames, time, status):
        #MUST fill entire butter
        if status:
            #look for underflow or overflow here
            print(f"current status is {status}")
        nonlocal start_idx, currToneFreq
        #time will be a numpy.ndarray of [frames,1] in one particular run, frames was 1136
        #will not send DC offset to speaker since this interface wants 0 offset
        plotSine(outdata, sampleRate, frames, toneFreq(), toneAmp(), tonePhase(), 0, start_idx)
        start_idx += frames

    with sd.OutputStream(channels=1, callback=callback, samplerate = sampleRate):                
        while startStopTone():
            time.sleep(0.25)  
    logging.info("Exited")

            
class ToneGen:
    SCALE_FACTOR = 0.01
    
    ### dont think all these are needed######################
    def amplitudeChanged(self):
        self.toneAmp = self.currAmp.get()
        
    def freqChanged(self):
        self.toneFreq = self.currFreq.get()
        
    def dcChanged(self):
        self.toneDC = self.currDC.get()

    def phaseChanged(self):
        self.tonePhase = self.currPhase.get()
    
    def mouseLocation(self,event):
        if event.widget in self.widgetToCSH:
            #print(f'should go off to correct csh for amp {self.widgetToCSH.get(event.widget)}')
            self.widgetToCSH[event.widget].audioHelp()
        #otherwise, do nothing
    
    def correct_entry_input(self, text, minVal, maxVal):
        logging.info("Entered")
        #if this returns false, value is not changed
        valid = False
        if text.isdigit(): # or text == "":
            if (int(text) <= maxVal and int(text) >= minVal):
                valid = True
        logging.info("Exited")
        return valid   
        
    def correct_amp_input(self,text):
        return self.correct_entry_input(text, self.minAmp, self.maxAmp)
         
    def correct_freq_input(self, text):
        return self.correct_entry_input(text, self.minFreq, self.maxFreq)
    
    def correct_DC_input(self, text):  
        return self.correct_entry_input(text, self.minDC, self.maxDC)  
 
    def correct_Phase_input(self, text):  
        return self.correct_entry_input(text, self.minPhase, self.maxPhase)
           
    def playOrStopTone(self): 
        logging.info("Entered")
        #toggle the variable assoc with button 
        if self.toneIsOn:
            self.toneIsOn = False
        else:
            self.toneIsOn = True
        # swap the label on the button
        self.playOrStopButtonText.set(self.playToneText[self.toneIsOn])
        #update the context help status so it will/wont play audio help
        for widget_obj in self.widgetToCSH.keys():
            self.widgetToCSH[widget_obj].toneChange(self.toneIsOn)
            
        if self.toneIsOn: 
            #launch tone thread
            self.toneThread = threading.Thread(target = runPlayTone, 
                                               args =(lambda : self.toneIsOn,
                                                      lambda : self.toneFreq, 
                                                      lambda : self.toneAmp,
                                                      lambda : self.tonePhase) ) 
            self.toneThread.start() 
        else:
            #user stops tone, end the thread
            self.toneThread.join()
        logging.info("Exited")
        
        
    def animate(self, i): 
        logging.info("Entered")
        #print(f"entered animate with param {i}")
        frames = 1000   
        #no need to sample at speakers rate, just so it looks good on a plot and is >2*tone freq
        FSAMP_DIV_TONE_FREQ = 100
        sampleRate = self.toneFreq * FSAMP_DIV_TONE_FREQ
        #shape outdata so it looks like same form as playing tone to speaker 
        outdata = []
        time = (self.initGraphPt + np.arange(frames)) / sampleRate
        time = time.reshape(-1, 1) 
        plotSine(outdata, 
                  sampleRate, 
                  frames, 
                  self.toneFreq, 
                  self.toneAmp, 
                  self.tonePhase, 
                  self.toneDC,
                  self.initGraphPt)
        self.initGraphPt += frames 

        self.sinPlot.clear()
        self.sinPlot.plot(time,outdata)
        self.sinPlot.title.set_text(self.GRAPH_LABEL)
        self.sinPlot.set_ylabel(self.GRAPH_X_LABEL)
        self.sinPlot.set_xlabel(self.GRAPH_Y_LABEL)
        self.sinPlot.grid()
        logging.info("Exited")

 
 
        
    def __init__(self, currFrame, currSettings):
        """
        Set up logging for ToneGen
        """
        logging.info("Entered")
        
        #initialize text variables to put in tone button
        self.currTabActive = False
        self.playToneText = ["Play\nTone", "Stop\nTone"]
        self.toneIsOn = False
        
        self.currFrame = currFrame
        self.currFrame.bind_all('<Enter>', self.mouseLocation)
        #create a dictionary of context sens help associated with each such widget
        self.widgetToCSH = {}
        self.initGraphPt = 0
        #constants that never change
        self.GRAPH_LABEL = "DCOffset + Amplitude*sin(2*pi*Frequency*time + phase)"
        self.GRAPH_X_LABEL = "Voltage (mV)"
        self.GRAPH_Y_LABEL = "Time (ms)"
        
        '''
        Initialize:
        Set up tone amplitude access
        '''
        self.minAmp = 0
        self.toneAmp = 20
        self.maxAmp = 100
        self.amplitudeLabel = tk.Label(self.currFrame,
                                       text=f"Amplitude (mV)\n({self.minAmp} - {self.maxAmp})",
                                       font=Font(family='Helvetica', size=15, weight='normal'))
        self.amplitudeLabel.grid(row=0, column = 0)
        self.currAmp = tk.IntVar(value = self.toneAmp)
        #problem is that the amplitudeChanged doesnt hit if user types in new val and hits ret
        validate_amp_input = (self.currFrame.register(self.correct_amp_input), '%P')
        self.amplitudeAdjust = tk.Spinbox(self.currFrame, 
                                          from_= self.minAmp, 
                                          to=self.maxAmp, 
                                          textvariable = self.currAmp, 
                                          validate = 'all',
                                          validatecommand = validate_amp_input,
                                          command=self.amplitudeChanged, 
                                          width=3,
                                          font=Font(family='Helvetica', size=36, weight='bold'))
        self.amplitudeAdjust.grid(row=1, column = 0)
        ampInits = csh.ContextSensHelpInitable("Amplitude changes loudness of tone.", 
                                               ["C:\Cathy\PythonDev\AudioHelp\Amp_csh1_eng.mp3",
                                               "C:\Cathy\PythonDev\AudioHelp\Amp_csh1_esp.mp3"])
        self.amplitude_csh = csh.ContextSensHelp(self.currFrame, self.amplitudeAdjust, currSettings, ampInits)
        self.widgetToCSH[self.amplitudeAdjust] = self.amplitude_csh

        '''
        Initialize:
        Set up tone frequency access
        '''
        self.minFreq = 20
        self.toneFreq = 277  # this is the "start" freq for spinbox
        self.maxFreq = 20000
        self.freqLabel = tk.Label(self.currFrame,
                                       text=f"Frequency (Hz)\n({self.minFreq} - {self.maxFreq})",
                                       font=Font(family='Helvetica', size=15, weight='normal'))
        self.freqLabel.grid(row=0, column = 1)
        self.currFreq = tk.IntVar(value = self.toneFreq)
        validate_freq_input = (self.currFrame.register(self.correct_freq_input), '%P')
        self.freqAdjust = tk.Spinbox(self.currFrame, 
                                          from_=self.minFreq, 
                                          to=self.maxFreq, 
                                          textvariable = self.currFreq, 
                                          validate = 'all',
                                          validatecommand = validate_freq_input,
                                          command=self.freqChanged, 
                                          width=5,
                                          font=Font(family='Helvetica', size=36, weight='bold'))
        self.freqAdjust.grid(row=1, column = 1)
        freqInits = csh.ContextSensHelpInitable("Tone freq changes from clicking through musical notes and beyond.", 
                                               ["C:\Cathy\PythonDev\AudioHelp\Freq_csh1_eng.mp3",
                                               "C:\Cathy\PythonDev\AudioHelp\Freq_csh1_esp.mp3"])
        self.freq_csh = csh.ContextSensHelp(self.currFrame, self.freqAdjust, currSettings, freqInits)
        self.widgetToCSH[self.freqAdjust] = self.freq_csh

        '''
        Initialize:
        Set up tone DC offset
        '''
        self.minDC = 0
        self.toneDC = 0  # this is the "start" DC for spinbox
        self.maxDC = self.maxAmp/2
        self.dcLabel = tk.Label(self.currFrame,
                                       text=f"DC Offset (mV)\n({self.minDC} - {self.maxDC})",
                                       font=Font(family='Helvetica', size=15, weight='normal'))
        self.dcLabel.grid(row=0, column = 2)
        self.currDC = tk.IntVar(value = self.toneDC)
        validate_DC_input = (self.currFrame.register(self.correct_DC_input), '%P')
        self.dcAdjust = tk.Spinbox(self.currFrame, 
                                          from_=self.minDC, 
                                          to=self.maxDC, 
                                          textvariable = self.currDC, 
                                          validate = 'all',
                                          validatecommand = validate_DC_input,
                                          command=self.dcChanged, 
                                          width=3,
                                          font=Font(family='Helvetica', size=36, weight='bold'))
        self.dcAdjust.grid(row=1, column = 2)
        dcInits = csh.ContextSensHelpInitable("Constant offset on sine wave used to set min/max values of curve.", 
                                               ["C:\Cathy\PythonDev\AudioHelp\DCoffset_eng.mp3",
                                               "C:\Cathy\PythonDev\AudioHelp\DCOffset_csh1_esp.mp3"])
        self.dc_csh = csh.ContextSensHelp(self.currFrame, self.dcAdjust, currSettings, dcInits)
        self.widgetToCSH[self.dcAdjust] = self.dc_csh        
        '''
        Initialize:
        Set up tone phase offset
        '''
        self.minPhase = 0
        self.tonePhase = 0  # this is the "start" phase for spinbox
        self.maxPhase = 360
        DEG_SYM = u'\N{DEGREE SIGN}'
        self.phaseLabel = tk.Label(self.currFrame,
                                       text=f"Phase offset\n({self.minDC}{DEG_SYM} - {self.maxDC}{DEG_SYM} )",
                                       font=Font(family='Helvetica', size=15, weight='normal'))
        self.phaseLabel.grid(row=0, column = 3)
        self.currPhase = tk.IntVar(value = self.tonePhase)
        validate_Phase_input = (self.currFrame.register(self.correct_Phase_input), '%P')
        self.phaseAdjust = tk.Spinbox(self.currFrame, 
                                          from_=self.minPhase, 
                                          to=self.maxPhase, 
                                          textvariable = self.currPhase, 
                                          validate = 'all',
                                          validatecommand = validate_Phase_input,
                                          command=self.phaseChanged, 
                                          width=3,
                                          font=Font(family='Helvetica', size=36, weight='bold'))
        self.phaseAdjust.grid(row=1, column = 3)
        phaseInits = csh.ContextSensHelpInitable("Phase Adjust at time=0 sec.", 
                                               ["C:\Cathy\PythonDev\AudioHelp\phase_change_eng.mp3",
                                               "C:\Cathy\PythonDev\AudioHelp\phase.change_mp3"])
        self.phase_csh = csh.ContextSensHelp(self.currFrame, self.phaseAdjust, currSettings, phaseInits)
        self.widgetToCSH[self.phaseAdjust] = self.phase_csh         
            
        '''
        Setup button to allow tone or turn it off
        '''
        self.playOrStopButtonText = tk.StringVar()
        self.playOrStopButtonText.set(self.playToneText[self.toneIsOn])
        self.playToneButton = tk.Button(self.currFrame, 
                                        textvariable=self.playOrStopButtonText, 
                                        command=self.playOrStopTone,
                                        font=Font(family='Helvetica', size=15, weight='bold'))
        playInits = csh.ContextSensHelpInitable("Play (or stop) the tone as setup by you (will turn off audio help)", 
                                               ["C:\Cathy\PythonDev\AudioHelp\Play_StopButton_eng.mp3",
                                               "C:\Cathy\PythonDev\AudioHelp\Play_StopButton_eng.mp3"])
        self.playButton_csh = csh.ContextSensHelp(self.currFrame, self.playToneButton, currSettings, playInits)
        self.widgetToCSH[self.playToneButton] = self.playButton_csh
        self.playToneButton.grid(row=1, column = 4, padx = 10)
        
        '''
        Add in the graph of trig function
        '''

        self.figTone = Figure(figsize=(6,5), dpi=100)
        #111 means 1x1 first subplot, self.sinPlot is an AxesSubplot
        self.sinPlot = self.figTone.add_subplot(111)

         
        self.sinPlot.title.set_text(self.GRAPH_LABEL)
        self.sinPlot.set_ylabel(self.GRAPH_X_LABEL)
        self.sinPlot.set_xlabel(self.GRAPH_Y_LABEL)
        self.sinPlot.grid()
 
        canvas = FigureCanvasTkAgg(self.figTone, currFrame)
        self.graphWidget = canvas.get_tk_widget()
        canvas.get_tk_widget().grid(row = 2, column = 0, columnspan = 5, pady = 20)
        
        graphInits = csh.ContextSensHelpInitable("Real Time pieces of tone selected.", 
                                               ["C:\Cathy\PythonDev\AudioHelp\phase_change_eng.mp3",
                                               "C:\Cathy\PythonDev\AudioHelp\phase.change_mp3"])
        self.graph_csh = csh.ContextSensHelp(self.currFrame, self.graphWidget, currSettings, graphInits)
        self.widgetToCSH[self.graphWidget] = self.graph_csh         
        #not doing blit since we change x and y axis potentially every time and may add new background waveforms   
        self.liveSine = animation.FuncAnimation(self.figTone, 
                                                self.animate, 
                                                interval = 100)
        plot.show()

        logging.info("Exited")
        
    def endTabActions(self):
        self.currTabActive = False
            
    def doTabActions(self):
        self.currTabActive = True


