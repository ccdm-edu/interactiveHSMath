import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 
                      'tango_with_django_project.settings')
import django
django.setup()
from Rango.models import Category, Page

def populate():
    #first we will create lists of dictionaries containing the pages
    #we want to add into each category
    #Then we will create a dictionary of dictionaries for out categories
    python_pages = [
        {'title': 'Official Python Tutorial',
        'url': 'http://docs.python.org/3/tutorial/', 'views' : 5},
        {'title':'How to Think like a Computer Scientist',
        'url':'http://www.greenteapress.com/thinkpython/', 'views' : 8},
        {'title':'Learn Python in 10 Minutes',
        'url':'http://www.korokithakis.net/tutorials/python/', 'views' : 5}]
    
    django_pages = [
        {'title':'Official Django Tutorial',
        'url':'https://docs.djangoproject.com/en/2.1/intro/tutorial01/', 'views' : 50},
        {'title':'Django Rocks',
        'url':'http://www.djangorocks.com/', 'views' : 15},
        {'title':'How to Tango with Django',
        'url':'http://www.tangowithdjango.com/', 'views' : 3}]
    
    other_pages = [
        {'title': 'Bottle', 
         'url': 'http://bottlepy.org/docs/dev/', 'views' : 2},
        {'title': 'Flask',
         'url':'http://flask.pocoo.org', 'views' : 12}]
    
    cats = {'Python': [{'pages': python_pages}, {'views': 128}, {'likes':64}],
            'Django': [{'pages': django_pages},  {'views': 64}, {'likes':32}],
            'Pascal': [{'pages': []},  {'views': 0}, {'likes':0}],
            'Perl': [{'pages': []},  {'views': 0}, {'likes':0}],
            'PHP': [{'pages': []},  {'views': 0}, {'likes':0}],
            'Prolog': [{'pages': []},  {'views': 0}, {'likes':0}],
            'PostScript': [{'pages': []},  {'views': 0}, {'likes':0}],
            'Programming': [{'pages': []},  {'views': 0}, {'likes':0}],
            'Other Frameworks': [{'pages' : other_pages}, {'views': 32}, {'likes':16}] 
            }
    #iterating through .items means cat is the key and cat_data is the value of 
    #the cats dictionary item
    for cat, cat_data in cats.items():
        c = add_cat(cat, cat_data[1]['views'], cat_data[2]['likes'])
        for p in cat_data[0]['pages']:
            add_page(c,p['title'], p['url'], p['views'])
    
    for c in Category.objects.all():
        for p in Page.objects.filter(category=c):
            print(f'- {c}: {p}')
            
def add_page(cat, title, url, views=0):
    p = Page.objects.get_or_create(category=cat, title=title)[0]
    p.url = url
    p.views = views
    p.save()
    return p

def add_cat(name, views, likes):
    c=Category.objects.get_or_create(name=name)[0]
    c.views = views
    c.likes = likes
    c.setStatusTrue()
    c.save()
    return c

# Start execution here.  Makes this file work as either a module or
#standalone app
if __name__ == '__main__':
    print('Starting Rango population script..')
    populate()
    

