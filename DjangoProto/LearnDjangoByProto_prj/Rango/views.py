from django.shortcuts import render
from django.http import HttpResponse
from Rango.models import Category
from Rango.models import Page
from tkinter.constants import PAGES
from unicodedata import category

def index(request):
    #order by likes and take top 5. The -likes says sort in descending order, likes is 
    #ascending order
    category_list = Category.objects.order_by('-likes')[:5]
    page_list = Page.objects.order_by('-views')[:5]
    context_dict = {'boldmessage': 'Crunchy, creamy, cookie, candy, cupcake, broccoli!', 
                    'greetingmsg': 'Hey there partner!',
                    'chooseURL': '<a href="/Rango/about/">About</a><br />',
                    'current_angel_kitty': '../static/images/AngelKitty.jpg',
                    'categories': category_list,
                    'pages': page_list,
                    }
    return render(request, 'Rango/index.html', context=context_dict)

def about(request):
#    http_resp = "Rango says this is the about page.  Wanna go " + '<a href = "/Rango/">Home</a>' + "?"
#    return HttpResponse(http_resp)
    context_dict = {'boldmessage': 'Cat Coder did this page', 
                    'greetingmsg': 'This is the ABOUT page',
                    'chooseURL': '<a href="/Rango/">Home</a><br />',
                    'current_angel_kitty': '../../media/Mowgli.jpg',
                    }
    return render(request, 'Rango/index.html', context=context_dict)

def show_category(request, category_name_slug):
    context_dict = {}
    try:
        #Can we find a category name slug with the given name?
        #If we can't, the .get() method raises a DoesNotExist exception
        #The .get() method returns one model instance or raises an exception
        category = Category.objects.get(slug=category_name_slug)
        
        #Retrieve all of the associated pages
        #The filter() will return a list of page objects or an empty list
        pages = Page.objects.filter(category=category).order_by('-views')[:5]
        
        #Adds our results list to the template context under name pages
        context_dict['pages'] = pages
        # We also add the category object from the database to context dict
        #we'll use this in the template to verify that the category exists
        context_dict['category'] = category
    except Category.DoesNotExist:
        #we get here if we didn't find the specified category
        #dont do anything
        # cuz the template will display a 'no category' message for us
        context_dict['category'] = None
        context_dict['pages'] = None
        
    #go forth and render the response and return to client
    return render(request, 'Rango/category.html', context=context_dict)
