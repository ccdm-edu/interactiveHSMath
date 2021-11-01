from .models import BotChkResults
from django import forms
from bootstrap_modal_forms.forms import BSModalForm

class BotChkForm(BSModalForm):
    math_test = forms.IntegerField(label="7 + five = ", help_text="Enter a number")
    g_recaptcha_response = forms.CharField(required = False)
        