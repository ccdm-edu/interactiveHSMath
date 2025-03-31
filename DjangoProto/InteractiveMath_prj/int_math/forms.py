from django import forms
     
class contactForm(forms.Form):   
    #Using widget with placeholder gives you help/label that can be overwritten and ins't default
    name = forms.CharField(label = "", widget=forms.TextInput(attrs={'placeholder': 'Name, 40 char max'}), max_length=40, required=False, help_text="<font color='DarkTurquoise'><i>Not required</i></font>")
    #enforce proper format for emails, uses emailValidator to ensure its valid, allow email to be blank if desired
    email = forms.EmailField(label = "", widget=forms.TextInput(attrs={'placeholder': 'Email, 50 char max'}), max_length=50, required=False, help_text="<font color='DarkTurquoise'><i>Required only for reply</i></font>")
    #this will be a drop down menu
    REASONS_TO_CONTACT = [ 
        ('Legal', "problem with legal documents"),
        ('Bug', 'website bug found'), 
        ('Idea', 'idea for future'), 
        ('ConceptError', 'error in learning materials'), 
        ('Improvement', "suggested improvement"), 
        ('Other', "something else..."),]
    subject = forms.ChoiceField(choices=REASONS_TO_CONTACT)  
    #need to force text interpretation only so no code embedded, ensure max length is enforced
    message = forms.CharField(label = "", max_length=2000, widget=forms.Textarea(attrs={'placeholder': 'Your message, 2000 char max, plain text only, no newline characters or html'}))
    #forcing consent to terms before submit makes this "clickwrap" which is considered legally more solid
    clickwrap_accept = forms.BooleanField(required=True,
                                        initial=False,
                                        label='')
    #This is both a honeypot to capture bots and a way to fill in recaptcha token response for legit users, will be hidden
    g_recaptcha_response = forms.CharField(required = False, label='')
    pooh_food_test = forms.BooleanField(required=False,
                                        initial=False,
                                        label='')
    
