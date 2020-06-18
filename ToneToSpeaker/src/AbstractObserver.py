'''
Created on Jun 18, 2020

@author: CCDM
'''
from abc import ABC, abstractmethod

class Subject(ABC):
    '''
    Abstract class for objects updated by GUI and used by many observers.  
    Uses Observer-subject pattern
    '''

    @abstractmethod
    def attach(self, observer) -> None:
        """
        Attach an observer to the subject.
        """
        pass

    @abstractmethod
    def detach(self, observer) -> None:
        """
        Detach an observer from the subject.
        """
        pass

    @abstractmethod
    def notify(self) -> None:
        """
        Notify all observers about an event.
        """
        pass
    
class Observer(ABC):
    """
    The Observer interface declares the update method, used by subjects.
    """

    @abstractmethod
    def update(self, subject: Subject) -> None:
        """
        Receive update from subject.
        """
        pass
