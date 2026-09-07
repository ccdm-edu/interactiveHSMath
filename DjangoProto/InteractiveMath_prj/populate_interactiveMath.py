#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module Name: populate_interactiveMath.py
Description: Populate the database structures with initial values
Author: C De Meyer
Date: 5/4/2026
Version:  (see Git)
"""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 
                        'InteractiveMath_prj.settings')
import django
django.setup()
from int_math.models import Topic, Subtopic, ContactAccesses

def populate():
    
    #first we will create the subtopics for each topic. For trig, we land on the Origin page but then URL constructed relative
    # to that page so need .. to get to pages on same level
    trig_subtopics = [
        {'title': 'Intro to concepts', 'url':'../IntroTrigMusicConcepts', 'icon':'🧠'},
        {'title': 'Trig functions make music', 'url':'../MusicSineIntro', 'icon':'🎹'},
        {'title': 'Sine cosine angles', 'url':'../StaticTrig', 'icon':'📐'},
        {'title':'Sine meets time', 'url':'../DynamicTrig1', 'icon':'⏳'},
        {'title':'Sine goes faster', 'url':'../DynamicTrig2', 'icon':'⚡'},
        {'title': 'Trig tones become audible', 'url':'../ToneTrig', 'icon':'🔊'},
        {'title': 'Trig tones within musical notes', 'url':'../MusicNotesTrig', 'icon':'🎶'},
        {'title': 'Summary of trig in music', 'url':'../MusicSineSummary', 'icon':'🏆'}]
    
    trigIdent_subtopics = [
        {'title': 'Trig identities explained', 'url':'../TrigIdentity'},
        {'title': 'Sum identity tunes your instrument', 'url':'../TrigIdent_Tune'}]
    
    imag_num_subtopics = [
        {'title':'Imag Num topic 1', 'url':'#ImagNumTopic1'},
        {'title':'Imag Num topic 2', 'url':'#ImagNumTopic2'},
        {'title':'Imag Num topic 3', 'url':'#ImagNumTopic3'}]
    
    people_subtopics = [
        {'title': 'Thank You!', 'url': '../acknowledgements'},
        ]
    
    legal_subtopics = [
        {'title': 'Terms Of Use', 'url': '../TermsOfUse'},
        {'title': 'Privacy Policy', 'url': '../Privacy'},
        ]
    
    topics = {'TrigFunct': [{'topic': trig_subtopics}],
              'TrigIdent': [{'topic': trigIdent_subtopics}],
            'Imag_num': [{'topic': imag_num_subtopics}],
            'Thanks': [{'topic': people_subtopics}],
            'Legal': [{'topic': legal_subtopics}],
            }
    #iterating through .items means cat is the key and cat_data is the value of 
    #the cats dictionary item
    for top, top_data in topics.items():
        c = add_top(top)
        for p in top_data[0]['topic']:
            # Use .get('icon', None) so it safely falls back if a topic doesn't have an icon key
            icon_val = p.get('icon', None)
            add_subtop(c,p['title'],p['url'],icon_val)
    
    #check results at build
    for t in Topic.objects.all():
        for s in Subtopic.objects.filter(topic=t):
            print(f'- {t}: {s}')
          
    # Force pk=1 to ensure we only ever have ONE row in this table, does autosave
    numAccesses, created = ContactAccesses.objects.get_or_create(
        pk=1, 
        defaults={
            'monthLastUpdated': 0, 
            'numTimesRecaptchaAccessedPerMonth': 0, 
            'numTimesSmtpAccessedPerMonth': 0, 
            'numClientsDeniedPerMonth': 0
        }
    )
    
    if created:
        print("Created new ContactAccesses record.")
    else:
        print("ContactAccesses record already exists; values were not reset.")

    
            
def add_subtop(topic, title, url, icon):
    s = Subtopic.objects.get_or_create(topic=topic, title=title, url=url, defaults={'icon': icon})[0]
    if s.icon != icon:
        s.icon = icon
    s.save()
    return s

def add_top(name):
    c=Topic.objects.get_or_create(name=name)[0]
    c.save()
    return c
                                                               

# Start execution here.  Makes this file work as either a module or
#standalone app
if __name__ == '__main__':
    print('Starting Interactive Math population script..')
    populate()
    

