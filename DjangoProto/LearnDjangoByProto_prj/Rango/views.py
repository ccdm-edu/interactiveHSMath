from django.shortcuts import render
from django.http import HttpResponse
from Rango.models import Category
from Rango.models import Page
from tkinter.constants import PAGES
from unicodedata import category
from Rango.forms import  CategoryForm, PageForm
from django.shortcuts import redirect
from django.urls import reverse

def index(request):
    #order by likes and take top 5. The -likes says sort in descending order, likes is 
    #ascending order
    category_list = Category.objects.order_by('-likes')[:5]
    page_list = Page.objects.order_by('-views')[:5]
    context_dict = {'boldmessage': 'Crunchy, creamy, cookie, candy, cupcake, broccoli!', 
                    'greetingmsg': 'Hey there partner!',
                    'current_angel_kitty': '../static/images/AngelKitty.jpg',
                    'page_tab_header': 'Index',
                    'categories': category_list,
                    'pages': page_list,
                    }
    return render(request, 'Rango/index.html', context=context_dict)

def about(request):
#    http_resp = "Rango says this is the about page.  Wanna go " + '<a href = "/Rango/">Home</a>' + "?"
#    return HttpResponse(http_resp)
    context_dict = {'boldmessage': 'Cat Coder did this page', 
                    'greetingmsg': 'This is the ABOUT page',
                    'current_angel_kitty': '../../media/Mowgli.jpg',
                    'page_tab_header': 'About',
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

def add_category(request):
    form = CategoryForm()
    
    # A HTTP POST?
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        
        # have we been provided with a valid form?
        if form.is_valid():
            #save the new category to the database
            form.save(commit=True)
            # Now that the category is saved, we could confirm this.
            # For now, just redirect the user back to the index view
            
            return redirect(f'/Rango/')
        else:
            # the supplied form has errors
            # just print them to the terminal
            print(form.errors)
    #will handle the bad form, new3 form or no form supplied cases
    #Render the form with error messages (if any).
    return render(request, 'rango/add_category.html', {'form': form})

def add_page(request, category_name_slug):
    #Foreign key Category is required to post a page
    try:
        category = Category.objects.get(slug=category_name_slug)
    except Category.DoesNotExist:
        category = None
    
    #you cannot add a page to a category that does not exist
    if category is None:
        return redirect('/Rango/')
    
    form = PageForm()
    
    # A HTTP POST?
    if request.method == 'POST':
        form = PageForm(request.POST)
        
        # have we been provided with a valid form?
        if form.is_valid():
            if category:
                #save the new category to the database
                page = form.save(commit=False)
                page.category = category
                page.views = 0
                page.save()
            # Now that the category is saved, we could confirm this.
            # For now, just redirect the user back to the index view
            return redirect(reverse('Rango:show_category', 
                                    kwargs={'category_name_slug':category_name_slug}))
        else:
            # the supplied form has errors
            # just print them to the terminal
            print(form.errors)
    #will handle the bad form, new3 form or no form supplied cases
    #Render the form with error messages (if any).
    context_dict = {'form': form, 'category': category}
    return render(request, 'Rango/add_page.html', context=context_dict)

