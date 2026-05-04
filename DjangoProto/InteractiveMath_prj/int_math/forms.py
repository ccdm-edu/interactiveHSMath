#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module Name: forms.py
Description: Create the forms that the user needs to interact with server
Author: C De Meyer (and Gemini AI)
Date: 5/4/2026
Version: 1.0.0
"""
from django import forms
from django.utils.safestring import mark_safe # Needed for your help_text HTML

class contactForm(forms.Form):
    # Using a CSS class instead of <font> tags is better practice for 5.2
    # But if you want to keep the HTML here, use mark_safe:
    help_not_required = mark_safe("<span style='color:DarkTurquoise; font-style:italic;'>Not required</span>")
    help_reply_only = mark_safe("<span style='color:DarkTurquoise; font-style:italic;'>Required only for reply</span>")

    name = forms.CharField(
        label="", 
        widget=forms.TextInput(attrs={'placeholder': 'Name, 40 char max'}), 
        max_length=40, 
        required=False, 
        help_text=help_not_required
    )

    email = forms.EmailField(
        label="", 
        widget=forms.EmailInput(attrs={'placeholder': 'Email, 50 char max'}), # Use EmailInput widget
        max_length=50, 
        required=False, 
        help_text=help_reply_only
    )

    REASONS_TO_CONTACT = [
        ('Legal', "problem with legal documents"),
        ('Bug', 'website bug found'),
        ('Idea', 'idea for future'),
        ('ConceptError', 'error in learning materials'),
        ('Improvement', "suggested improvement"),
        ('Other', "something else..."),
    ]
    subject = forms.ChoiceField(choices=REASONS_TO_CONTACT)

    message = forms.CharField(
        label="", 
        max_length=2000, 
        widget=forms.Textarea(attrs={
            'placeholder': 'Your message, 2000 char max, plain text only, no newline characters or html',
            'rows': 4 # Good to specify size for better UI
        })
    )

    clickwrap_accept = forms.BooleanField(
        required=True, 
        initial=False, 
        label='' # A much longer label will be in html doc
    )

    g_recaptcha_response = forms.CharField(
        required=False, 
        widget=forms.HiddenInput() # Ensure this is hidden
    )

    pooh_food_test = forms.BooleanField(
        required=False, 
        initial=False, 
        widget=forms.HiddenInput(attrs={'aria-hidden': 'true', 'tabindex': '-1'}), 
        label=''
    )
    
