""" This class provides context sensitive help to the requesting widget.
"""
import tkinter as tk
from tkinter import ttk
import Pmw
from pygame import mixer
import AbstractObserver as ao
import TrigSettings as setting


class ContextSensHelpInitable:
    def __init__(self, englishBalloonText, listOfAudio):
        self.engBalloonText = englishBalloonText
        self.listOfAudio = listOfAudio
            
class ContextSensHelp(ao.Observer):
    def weAreInBalloon(self):
        print("Balloon activated")
        
    def __init__(self, currFrame, currWidget, currSettings, initables):
        self.englishBalloonText = initables.engBalloonText
        self.toneIsOff = True
        self.currContSensHelpVisualOn = currSettings.useBalloons
        self.currContSensHelpAudioOn = currSettings.useAudioHelp
        self.currWidget = currWidget
        self.language = currSettings.language
        self.listOfAudio = initables.listOfAudio
        
        self.balloon = Pmw.Balloon(currFrame)
        #useless self.balloon.configure(activatecommand=self.weAreInBalloon)
        #here we would do the translation as needed
        self.balloon.bind(currWidget, self.englishBalloonText)
        #inform settings class that this object wishes to be notified of changes
        currSettings.attach(self)

        
    def update(self, currSettings):
        self.currContSensHelpVisualOn = currSettings.useBalloons
        self.currContSensHelpAudioOn = currSettings.useAudioHelp
        self.language = currSettings.language
        if self.currContSensHelpVisualOn:
            self.balloon.configure(state = 'balloon')
        else:
            self.balloon.configure(state = 'none')
        
    def toneChange(self, toneIsOff):
        #put up msg box that when this is true, audio gets turned off
        self.toneIsOff = toneIsOff
        
    def audioHelp(self):
        """
        This method provides sound, if so requested, to explain concepts
        """
        if self.currContSensHelpAudioOn:
            print(f"language is {self.language} new amp audio file is {self.listOfAudio[self.language]}")
            mixer.init()
            mixer.music.load(self.listOfAudio[self.language])
            mixer.music.play()
            
    def __str__(self):
        return 'Context Sens Help for widget ' + str(self.currWidget) 
            
