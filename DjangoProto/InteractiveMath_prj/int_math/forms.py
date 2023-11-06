from .models import BotChkResults
from django import forms
from bootstrap_modal_forms.forms import BSModalForm

class BotChkForm(BSModalForm):
    math_test = forms.IntegerField(label="7 + five = ", help_text = "Enter a number")
    g_recaptcha_response = forms.CharField(required = False)
     
class contactForm(forms.Form):   
    #Using widget with placeholder gives you help/label that can be overwritten and ins't default
    name = forms.CharField(label = "", widget=forms.TextInput(attrs={'placeholder': 'Name, 20 char max'}), max_length=20, required=False)
    #enforce proper format for emails, uses emailValidator to ensure its valid, allow email to be blank if desired
    email = forms.EmailField(label = "", widget=forms.TextInput(attrs={'placeholder': 'Email, 20 char max'}), max_length=20, required=False)
    #this will be a drop down menu
    REASONS_TO_CONTACT = [ 
        ('PL', "problem with legal documents"),
        ('WB', 'website bug found'), 
        ('IF', 'idea for future'), 
        ('EL', 'error in learning materials'), 
        ('SI', "suggested improvement"), 
        ('SE', "something else..."),]
    subject = forms.ChoiceField(choices=REASONS_TO_CONTACT)  
    #need to force text interpretation only so no code embedded, ensure max length is enforced
    message = forms.CharField(label = "", max_length=2000, widget=forms.Textarea(attrs={'placeholder': 'Your message, 2000 char max'}))
    #This is both a honeypot to capture bots and a way to fill in recaptcha token response for legit users, will be hidden
    g_recaptcha_response = forms.CharField(required = False, label='')
    pooh_food_test = forms.BooleanField(required=False,
                                        initial=False,
                                        label='')
    
