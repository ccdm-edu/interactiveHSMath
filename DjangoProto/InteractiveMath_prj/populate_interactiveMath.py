import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 
#                      'tango_with_django_project.settings')
                        'InteractiveMath_prj.settings')
import django
django.setup()
from int_math.models import Topic, Subtopic

def populate():
    
    #first we will create the subtopics for each topic
    trig_subtopics = [
        {'title': 'Origin of trig functions', 'url':'#top'},
        {'title': 'Sine Cosine Tones and Musical Notes', 'url':'#SineCosID'},
        {'title':'Next Trig topic 1', 'url':'#NextTrigTopic1'},
        {'title':'Next Trig Topic 2', 'url':'#NextTrigTopic1'}]
    
    imag_num_subtopics = [
        {'title':'Imag Num topic 1', 'url':'#ImagNumTopic1'},
        {'title':'Imag Num topic 2', 'url':'#ImagNumTopic2'},
        {'title':'Imag Num topic 3', 'url':'#ImagNumTopic3'}]
    

    
    topics = {'Trig': [{'topic': trig_subtopics}],
            'Imag_num': [{'topic': imag_num_subtopics}]
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
    

