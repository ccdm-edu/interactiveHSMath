import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 
                        'InteractiveMath_prj.settings')
import django
django.setup()
from int_math.models import Topic, Subtopic

def populate():
    
    #first we will create the subtopics for each topic. For trig, we land on the Origin page but then URL constructed relative
    # to that page so need .. to get to pages on same level
    trig_subtopics = [
        {'title': '1. Intro to concepts', 'url':'../IntroTrigMusicConcepts'},
        {'title': '2. Trig functions make music', 'url':'../MusicSineIntro'},
        {'title': '3. Simple sine cosine', 'url':'../StaticTrig'},
        {'title':'4. Sine meets time', 'url':'../DynamicTrig1'},
        {'title':'5. Sine goes faster', 'url':'../DynamicTrig2'},
        {'title': '6. Trig tones become audible', 'url':'../ToneTrig'},
        {'title': '7. Trig tones within musical notes', 'url':'../MusicNotesTrig'},
        {'title': '8. Summary of trig in music', 'url':'../MusicSineSummary'}]
    
    trigIdent_subtopics = [
        {'title': 'Trig identities explained', 'url':'../TrigIdentity'},
        {'title': 'Sum identity tunes your instrument', 'url':'../TrigIdent_Tune'}]
    
    imag_num_subtopics = [
        {'title':'Imag Num topic 1', 'url':'#ImagNumTopic1'},
        {'title':'Imag Num topic 2', 'url':'#ImagNumTopic2'},
        {'title':'Imag Num topic 3', 'url':'#ImagNumTopic3'}]
    
    people_subtopics = [
        {'title': 'Info Collected', 'url': '../UserData'},
        {'title': 'Thank You!', 'url': '../acknowledgements'},
        ]
    
    legal_subtopics = [
        {'title': 'Terms Of Use', 'url': '../TermsOfUse'},
        {'title': 'Privacy Policy', 'url': '../Privacy'},
        {'title': 'Cookie Policy', 'url': '../Cookie'},
        ]
    
    topics = {'TrigFunct': [{'topic': trig_subtopics}],
              'TrigIdent': [{'topic': trigIdent_subtopics}],
            'Imag_num': [{'topic': imag_num_subtopics}],
            'You': [{'topic': people_subtopics}],
            'Legal': [{'topic': legal_subtopics}],
            }
    #iterating through .items means cat is the key and cat_data is the value of 
    #the cats dictionary item
    for top, top_data in topics.items():
        c = add_top(top)
        for p in top_data[0]['topic']:
            add_subtop(c,p['title'],p['url'])
    
    for t in Topic.objects.all():
        for s in Subtopic.objects.filter(topic=t):
            print(f'- {t}: {s}')
    
            
def add_subtop(topic, title, url):
    s = Subtopic.objects.get_or_create(topic=topic, title=title, url=url)[0]
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
    

