'''
Created on Jun 11, 2020

@author: CCDM
'''


#### do i need this?   why?
#if __name__ == '__main__':
#    pass

import tkinter as tk
from tkinter import ttk
import ToneGen as tg
import TrigSettings as setting


root = tk.Tk()
root.title("Interactive Trig")
#root.geometry("+%d+%d" % (50, 50))
root.geometry("700x700+50+50")
tabBook = ttk.Notebook(root)
#define a grid matrix NOT SURE WHY THIS IS NEEDED

currSettings = setting.TrigSettings()

#do i really need to do this?  what does it do?
rows = 0
while rows < 50:
    root.rowconfigure(rows, weight=1)
    root.columnconfigure(rows, weight=1)
    rows += 1
    
#row 0 is used for tabs
tabBook.grid(row = 1, column = 0, columnspan=50,rowspan=49, sticky = 'NESW')
toneGenFrame = tk.Frame(tabBook)
tabBook.add(toneGenFrame ,text = "Tone Gen")
tonGenPage = tg.ToneGen(toneGenFrame,currSettings)

root.mainloop()
