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
#--file imports
import ContextSensHelp as csh
import TrigSettings as setting
   
              
def runPlayTone(startStopTone, toneFreq, toneAmp):
    logging.info("Entered") 
    #take the default output device and get the default sample rate
    samplerate = sd.query_devices('output')['default_samplerate']
    start_idx = 0
    #adding a scale factor keeps us from overdriving the output speakers, which would produce distortion
    SCALE_FACTOR = 0.01
    #if choose to do logging here, need to be thread safe
    #play tone while button is pushed, end when "unpushed"
    def callback(outdata, frames, time, status):
        #MUST fill entire butter
        if status:
            #look for underflow or overflow here
            print(f"current status is {status}")
        nonlocal start_idx
        t = (start_idx + np.arange(frames)) / samplerate
        t = t.reshape(-1, 1)
        outdata[:] = float(toneAmp()) * SCALE_FACTOR * np.sin(2 * np.pi * float(toneFreq()) * t)
        start_idx += frames

    with sd.OutputStream(channels=1, callback=callback, samplerate=samplerate):                
        while startStopTone():
            time.sleep(0.25)  
    logging.info("Exited")

            
class ToneGen:
    
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
        
    def correct_amp_input(self, text):
        logging.info("Entered")
        #if this returns false, value is not changed
        valid = False
        if text.isdigit():
            if (int(text) <= self.maxAmp and int(text) >= self.minAmp):
                valid = True
        logging.info("Exited")
        return valid   
         
    def correct_freq_input(self, text):
        logging.info("Entered")
        #if this returns false, value is not changed
        valid = False
        if text.isdigit():
            if (int(text) <= self.maxFreq and int(text) >= self.minFreq):
                valid = True
        logging.info("Exited")
        return valid  
    
    def correct_DC_input(self, text):  
        logging.info("Entered")
        #if this returns false, value is not changed
        valid = False
        if text.isdigit():
            if (int(text) <= self.maxDC and int(text) >= self.minDC):
                valid = True
        logging.info("Exited")
        return valid  
 
    def correct_Phase_input(self, text):  
        logging.info("Entered")
        #if this returns false, value is not changed
        valid = False
        if text.isdigit():
            if (int(text) <= self.maxPhase and int(text) >= self.minPhase):
                valid = True
        logging.info("Exited")
        return valid  
           
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
                                                      lambda : self.toneAmp) ) 
            self.toneThread.start() 
        else:
            #user stops tone, end the thread
            self.toneThread.join()
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
        
        '''
        Initialize:
        Set up tone amplitude access
        '''
        self.minAmp = 0
        self.toneAmp = 20
        self.maxAmp = 100
        self.amplitudeLabel = tk.Label(self.currFrame,
                                       text=f"Amplitude\n({self.minAmp} mV - {self.maxAmp} mV)",
                                       font=Font(family='Helvetica', size=15, weight='normal'))
        self.amplitudeLabel.grid(row=0, column = 0)
        self.currAmp = tk.IntVar(value = self.toneAmp)
        #problem is that the amplitudeChanged doesnt hit if user types in new val and hits ret
        validate_amp_input = (self.currFrame.register(self.correct_amp_input), '%P')
        self.amplitudeAdjust = tk.Spinbox(self.currFrame, 
                                          from_=self.minAmp, 
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
                                       text=f"Frequency\n({self.minFreq} Hz - {self.maxFreq} Hz)",
                                       font=Font(family='Helvetica', size=15, weight='normal'))
        self.freqLabel.grid(row=0, column = 1)
        self.currFreq = tk.IntVar(value = self.toneFreq)
        validate_freq_input = (self.currFrame.register(self.correct_freq_input), '%Q')
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
                                       text=f"DC Offset\n({self.minDC} mV - {self.maxDC} mV )",
                                       font=Font(family='Helvetica', size=15, weight='normal'))
        self.dcLabel.grid(row=0, column = 2)
        self.currDC = tk.IntVar(value = self.toneDC)
        validate_DC_input = (self.currFrame.register(self.correct_DC_input), '%Q')
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
        validate_Phase_input = (self.currFrame.register(self.correct_Phase_input), '%Q')
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
        
        logging.info("Exited")
        
    def endTabActions(self):
        self.currTabActive = False
            
    def doTabActions(self):
        self.currTabActive = True


