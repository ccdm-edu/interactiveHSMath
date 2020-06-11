""" This class provides context sensitive help to the requesting widget.
"""
import tkinter as tk
from tkinter import ttk
import Pmw

ENGLISH = 0
SPANISH = 1

class ContextSensHelpInitable:
    def __init__(self, englishBalloonText, listOfAudio):
        self.engBalloonText = englishBalloonText
        self.listOfAudio = listOfAudio
        
class Settings:
    #should make this a singleton
    def __init__(self):
        self.language = ENGLISH
        self.useBalloons = True
        self.useAudioHelp = True
    def __str__(self):
        return("language is" + str(self.language) + "Balloon help is " + str(self.useBalloons) + "Audio help is" + str(self.useAudioHelp_)) 
    def update(self, language, useBalloons, useAudioHelp, toneIsOff):
        if language == ENGLISH or  language == SPANISH:
            self.language = language
            self.useBalloons = useBalloons
            self.useAudioHelp = useAudioHelp
        else:
            #put up pop up box that user says"ok" to informing that only these two languages are supported
            #kill the print stmt below
            print("only English and Spanish currently supported")
            
class ContextSensHelp(tk.Tk):
    def __init__(self, root, initSettihgs, initables):
        self.englishBalloonText = initables.engBalloonText
        self.toneIsOff = True
    #def mouseMotionToWidget(self):
    """
        This method provides sound, if so requested, to explain concepts
    """
    def settingUpdate(self, currSettings):
        self.currContSensHelp = currSettings
        
    def toneChange(self, toneIsOff):
        #put up msg box that when this is true, audio gets turned off
        self.toneIsOff = toneIsOff
