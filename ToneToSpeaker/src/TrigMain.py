'''
Created on Jun 11, 2020

@author: CCDM
'''


import tkinter as tk
from tkinter import ttk
from tkinter import scrolledtext
import ToneGen as tg
import TrigSettings as setting

#these need to be global
root = tk.Tk()
tabBook = ttk.Notebook(root)
currSettings = setting.TrigSettings()

class PreferenceSelect:
    
    def __init__(self):
        global currSettings
        
        self.topLevel= tk.Toplevel()
        self.topLevel.wm_title("Preferences")
        
        #language select
        self.langChoice = tk.IntVar()
        tk.Label(self.topLevel, text="Language").grid(row=0, columnspan = 2)
        englishButton = tk.Radiobutton(self.topLevel, text="English", 
                       variable=self.langChoice, value=0)
        englishButton.grid(row = 1, column = 0)
        espanolButton = tk.Radiobutton(self.topLevel, text="Espanol", 
                       variable=self.langChoice, value=1)
        espanolButton.grid(row = 1, column = 1)
        if currSettings.language == setting.ENGLISH:
            englishButton.select()
        else:
            espanolButton.select()
        
        #context sensitive help select
        self.useBalloonSelect = tk.IntVar()
        self.useAudioSelect = tk.IntVar()
        tk.Label(self.topLevel, text="Context Sensitive Help").grid(row=2, columnspan = 2)
        useBalloonButton = tk.Checkbutton(self.topLevel, text="Text Help Near Entry Items", 
                       variable=self.useBalloonSelect)
        useBalloonButton.grid(row = 3, column = 0)
        if currSettings.useBalloons:
            useBalloonButton.select()
        useAudioHelpButton= tk.Checkbutton(self.topLevel, text="Audio Help Near Entry Items", 
                       variable=self.useAudioSelect)
        useAudioHelpButton.grid(row = 3, column = 1)
        if currSettings.useAudioHelp:
            useAudioHelpButton.select()
            
        #user completion of window
        saveButton = tk.Button(self.topLevel, text='Save', command=self.saveAndExit)
        saveButton.grid(row=4, column = 0)
        cancelButton = tk.Button(self.topLevel, text="Cancel", command=self.topLevel.destroy)
        cancelButton.grid(row=4, column = 1)
        
    def saveAndExit(self):
        global currSettings
        currSettings.update(self.langChoice.get(), 
                            self.useBalloonSelect.get(), 
                            self.useAudioSelect.get())

        self.topLevel.destroy()
                   


def helpPopUp():
    #NOTE, this has to know which tab is active and put up appropriate text
    # DOO pull this under tab creation class
    topLevel = tk.Toplevel()
    activeTabNum = tabBook.index(tabBook.select())
    if activeTabNum == 0:
        topLevel.wm_title("Help on Tone Generator")
        helpTxt = scrolledtext.ScrolledText(topLevel,width=30, height = 8)
        helpTxt.grid(column = 0, padx = 10, pady = 10)
        helpTxt.focus()
        #need to have more lines than size to get scrollbar
        helpTxt.insert(tk.INSERT, 'well\n now\n here\n is a\n bunch\n of helpie\n text\n 1\n 2\n 3\n 4\n 5\n')
        # read only text here
        helpTxt.configure(state='disabled')
    elif activeTabNum == 1:
        topLevel.wm_title("Help on Next App")
     
class TabCreation:
    def __init__(self):
        global tabBook, currSettings
        self.toneGenFrame = tk.Frame(tabBook)
        tabBook.add(self.toneGenFrame ,text = "Tone Gen")
        self.toneGenPage = tg.ToneGen(self.toneGenFrame,currSettings)
    
        self.nextAppFrame = tk.Frame(tabBook)
        tabBook.add(self.nextAppFrame, text = "next thing")
        self.prevTabNum = 0
      
    def userSelectsTab(self,event):
        #event has event.widget.tab(event.widget.select(), 'text') to get tab text if wanted
        self.currTabNum = tabBook.index(tabBook.select())
        
        #entering new tab, kill activity on old tab.  DO A BETTER JOB HERE
        if self.prevTabNum == 0:
            self.toneGenPage.endTabActions()
        self.prevTabNum = self.currTabNum
            
        if self.currTabNum == 0:
            #NEED TO DO BETTER HERE tying this to thetab and class
            self.toneGenPage.doTabActions()
        
        #elif activeTabNum == 1:    
        else:
            #put out an error here
            print(f"Error, tab {self.currTabNum} not handled")
            
    def getFirstFrame(self):
        return self.toneGenFrame
    
def main():
    def preferencePopUp():
        prefSelect = PreferenceSelect()
    
    root.title("Interactive Trig")
    #root.geometry("+%d+%d" % (50, 50))
    root.geometry("700x700+50+50")
    
    #define a grid matrix NOT SURE WHY THIS IS NEEDED
    #do i really need to do this?  what does it do?
    rows = 0
    while rows < 50:
        root.rowconfigure(rows, weight=1)
        root.columnconfigure(rows, weight=1)
        rows += 1
    
    menubar = tk.Menu(root)
    settingMenu = tk.Menu(menubar)
    settingMenu.add_command(label="Preferences", command=preferencePopUp)
    menubar.add_cascade(label="Settings", menu=settingMenu)
    menubar.add_command(label="Help", command=helpPopUp)
    menubar.add_command(label="Exit", command=root.quit)
    #display the menu
    root.config(menu=menubar)
    
    #row 0 is used for tabs
    tabBook.grid(row = 1, column = 0, columnspan=50, rowspan=49, sticky = 'NESW')
    
    #create and initialize all the objects on the pages
    tabEx = TabCreation()

    #pick where we want to start out the user, first page is best
    tabBook.select(tabEx.getFirstFrame())
    #allow user to traverse tabs with keyboard, not just mouse
    tabBook.enable_traversal()
    #bind user tab changes to program action and class selection
    tabBook.bind("<<NotebookTabChanged>>", tabEx.userSelectsTab)
    
    root.mainloop()
    
    
if __name__ == '__main__':
    main()
