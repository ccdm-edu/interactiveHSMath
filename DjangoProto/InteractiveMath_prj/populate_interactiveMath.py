import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 
#                      'tango_with_django_project.settings')
                        'InteractiveMath_prj.settings')
import django
django.setup()
from int_math.models import Topic, Subtopic, BotChkResults

def populate():
    
    #first we will create the subtopics for each topic. For trig, we land on the Origin page but then URL constructed relative
    # to that page so need .. to get to pages on same level
    trig_subtopics = [
        {'title': '1. Trig functions make music', 'url':'../MusicSineIntro'},
        {'title': '2. Simple sine cosine', 'url':'../StaticTrig'},
        {'title':'3. Sine meets time', 'url':'../DynamicTrig1'},
        {'title':'4. Sine goes faster', 'url':'../DynamicTrig2'},
        {'title': '5. Sine/cosine tones and musical notes', 'url':'../ToneTrig'},
        {'title': '6. Summary of sine/cosine in music', 'url':'../MusicSineSummary'}]
    
    trigIdent_subtopics = [
        {'title': 'Trig identities explained', 'url':'../TrigIdentity'},
        {'title': 'Sum identity tunes your instrument', 'url':'../TrigIdent_Tune'}]
    
    imag_num_subtopics = [
        {'title':'Imag Num topic 1', 'url':'#ImagNumTopic1'},
        {'title':'Imag Num topic 2', 'url':'#ImagNumTopic2'},
        {'title':'Imag Num topic 3', 'url':'#ImagNumTopic3'}]
    
    people_subtopics = [
        {'title': 'Robot Results', 'url': '../UserData'},
        {'title': 'Thank You!', 'url': '../acknowledgements'},
        ]
    
    legal_subtopics = [
        {'title': 'Terms Of Use', 'url': '../TermsOfUse'},
        {'title': 'Privacy Policy', 'url': '../Privacy'},
        {'title': 'Cookie Policy', 'url': '../Cookie'},
        ]
    
    all_possible_stats = [
        {'pass_mathtest': False, 'recaptcha_v3_quartile': '1Q'}, 
        {'pass_mathtest': False, 'recaptcha_v3_quartile': '2Q'},
        {'pass_mathtest': False, 'recaptcha_v3_quartile': '3Q'},
        {'pass_mathtest': False, 'recaptcha_v3_quartile': '4Q'},
         
        {'pass_mathtest': True, 'recaptcha_v3_quartile': '1Q'},
        {'pass_mathtest': True, 'recaptcha_v3_quartile': '2Q'},
        {'pass_mathtest': True, 'recaptcha_v3_quartile': '3Q'},
        {'pass_mathtest': True, 'recaptcha_v3_quartile': '4Q'},
         
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
    
    #add user statistics
    for s in all_possible_stats:
        add_stat(s['pass_mathtest'], s['recaptcha_v3_quartile'])
            
def add_subtop(topic, title, url):
    s = Subtopic.objects.get_or_create(topic=topic, title=title, url=url)[0]
    s.save()
    return s

def add_top(name):
    c=Topic.objects.get_or_create(name=name)[0]
    c.save()
    return c
    
def add_stat(pass_mathtest, recaptcha_v3_quartile):
    s = BotChkResults.objects.get_or_create(pass_mathtest=pass_mathtest, 
                                            recaptcha_v3_quartile=recaptcha_v3_quartile)[0]
    # want to zero out count for all possible user interactions
    s.count = 0
    print(f'{s} was added')
    s.save()
    return s                                                              

# Start execution here.  Makes this file work as either a module or
#standalone app
if __name__ == '__main__':
    print('Starting Interactive Math population script..')
    populate()
    

