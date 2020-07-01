'''
Created on Jun 12, 2020

@author: CCDM
'''
from typing import List
import AbstractObserver as ao

ENGLISH = 0
SPANISH = 1

class TrigSettings(ao.Subject):
    """
    The Subject owns some important state and notifies observers when the state
    changes.
    """

    _state: int = None
    """
    For the sake of simplicity, the Subject's state, essential to all
    subscribers, is stored in this variable.
    """

    _observers: List[ao.Observer] = []
    """
    List of subscribers. In real life, the list of subscribers can be stored
    more comprehensively (categorized by event type, etc.).
    """

    def attach(self, observer) -> None:
        self._observers.append(observer)

    def detach(self, observer) -> None:
        self._observers.remove(observer)

    """
    The subscription management methods.
    """

    def notify(self) -> None:
        """
        Trigger an update in each subscriber.
        """
        for observer in self._observers:
            observer.update(self)
            
    #should make this a singleton
    def __init__(self):
        self.language = ENGLISH
        self.useBalloons = True
        self.useAudioHelp = True
        
    def __str__(self):
        return("language is" + str(self.language) + 
               "Balloon help is " + str(self.useBalloons) + 
               "Audio help is" + str(self.useAudioHelp_)) 
        
    def update(self, language, useBalloons, useAudioHelp):
        if language == ENGLISH or  language == SPANISH:
            self.language = language
            self.useBalloons = useBalloons
            self.useAudioHelp = useAudioHelp
        else:
            #put up pop up box that user says"ok" to informing that only these two languages are supported
            #kill the print stmt below
            print("only English and Spanish currently supported")  
        # tell observers that a change was made by user and to update themselves   
        self.notify()