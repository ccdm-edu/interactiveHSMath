from django.shortcuts import render
from django.http import HttpResponse
from Rango.models import Category
from Rango.models import Page
from tkinter.constants import PAGES
from unicodedata import category
from Rango.forms import  CategoryForm, PageForm, UserForm, UserProfileForm
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from datetime import datetime

def index(request):
    #order by likes and take top 5. The -likes says sort in descending order, likes is 
    #ascending order
    category_list = Category.objects.order_by('-likes')[:5]
    page_list = Page.objects.order_by('-views')[:5]
    
    #Call the helper function to handle the cookies
    #visitor_cookie_handler(request)
    
    #numVisits = int(request.COOKIES.get('visits', '1'))
    # move to server side cookies
    #numVisits = int(request.session['visits'])
    context_dict = {'boldmessage': 'Crunchy, creamy, cookie, candy, cupcake, broccoli!', 
                    'current_angel_kitty': '../static/images/AngelKitty.jpg',
                    'page_tab_header': 'Index',
                    'categories': category_list,
                    'pages': page_list,
                    #'visits': numVisits,
                    'index_page': True,
                    }
    #request.session.set_test_cookie()
    
    response = render(request, 'Rango/index.html', context=context_dict)
    return response

def about(request):
#    http_resp = "Rango says this is the about page.  Wanna go " + '<a href = "/Rango/">Home</a>' + "?"
#    return HttpResponse(http_resp)

    #Call the helper function to handle the cookies
    visitor_cookie_handler(request)
    # move to server side cookies
    numVisits = int(request.session['visits'])
    
    context_dict = {'boldmessage': 'Cat Coder did this page', 
                    'greetingmsg': 'This is the ABOUT page',
                    'current_angel_kitty': '../../media/Mowgli.jpg',
                    'page_tab_header': 'About',
                    'visits': numVisits,
                    'index_page': False
                    }
    #if request.session.test_cookie_worked():
    #    print("TEST COOKIE WAS TASTY (and it worked)")
    #    request.session.delete_test_cookie()
    return render(request, 'Rango/index.html', context=context_dict)

# helper method for server side cookies
def get_server_side_cookie(request, cookie, default_val=None):
    val = request.session.get(cookie)
    if not val:
        val = default_val
    return val

#def visitor_cookie_handler(request, response):
def visitor_cookie_handler(request):
    #Get the number of visits to the site
    # we use the COOKIES.get() function to obtain the visits cookie.
    # if the cookie exists, the value returned is casted to an integer
    # if the cookie doesn't exist, then the default value of 1 is used
    #visits = int(request.COOKIES.get('visits', '1'))
    # move to server side cookie
    visits = int(get_server_side_cookie(request, 'visits', '1'))
    #every time page is updated, this will incrment visits and last visit
    #last_visit_cookie = request.COOKIES.get('last_visit', str(datetime.now()))
    # moove to server side cookies
    last_visit_cookie = get_server_side_cookie(request, 'last_visit',
                                               str(datetime.now()))
    
    last_visit_time = datetime.strptime(last_visit_cookie[:-7],
                                        '%Y-%m-%d %H:%M:%S')
    #If its been more than 3 sec since last visit
    if (datetime.now() - last_visit_time).seconds > 0:
        visits = visits + 1
        #Update the last visit cookie now that we have updated the count
        #response.set_cookie('last_visit', str(datetime.now()))
        # move to server side cookie
        request.session['last_visit'] = str(datetime.now())
    else:
        #response.set_cookie('last_visit', last_visit_cookie)
        request.session['last_visit'] = last_visit_cookie
    
    #response.set_cookie('visits', visits)
    #update/set the visits cookie
    
    #do a server side cookie
    request.session['visits'] = visits
    
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

# def register(request):
#     # A boolean value for telling the template
#     # whether the registration was sucessful.  
#     # set to false initially.  Cod changes value to True when 
#     # registration succeeds.
#     registered = False
#     
#     #If its a HTTP POST, we're interested in processing form data.
#     if request.method == 'POST':
#         # Attempt to grab info from the raw form information.
#         # Note that we make use of both UserForm and UserProfileForm.
#         user_form = UserForm(request.POST)
#         profile_form = UserProfileForm(request.POST)
#         
#         # if the two forms are valid...
#         if user_form.is_valid() and profile_form.is_valid():
#             #Save the user's form data to the database
#             user = user_form.save()
#             
#             # Now we hash the password with the set_password method
#             # Once hashed, we can update the user object.
#             user.set_password(user.password)
#             user.save()
#             
#             # Now sort out the UserProfile instance
#             # Since we need to set the user attribute ourselves
#             # we set commit=False.  This delays saving the model
#             # until we are ready to avoid integrity problems
#             profile = profile_form.save(commit=False)
#             profile.user = user
#             
#             #Did the user provide a profile picture?  if so we need to get it from the input form and 
#             # put it in the UserProfile model.
#             if 'picture' in request.FILES:
#                 profile.picture = request.FILES['picture']
#                 
#             #Now we save the UserProvile model instance
#             profile.save()
#             
#             # Update our variable to indicate that the template 
#             # registration was successful
#             registered = True
#         else:
#             # Invalid form or forms - mistakes or something else?
#             #print problems to the terminal
#             print(user_form.errors, profile_form.errors)
#     else:
#         # Not a HTTP POST, so we render our form using two ModelForm instances.
#         # These forms will be blank, ready for user input.
#         user_form = UserForm()
#         profile_form = UserProfileForm()
#     
#     #Render the template depending on the context.
#     return render(request,
#                   'Rango/register.html',
#                   context = {'user_form': user_form,
#                              'profile_form': profile_form,
#                              'registered': registered})
#     
# def user_login(request):
#     # If the request is a HTTP POST, try to pull out the relevant info
#     if request.method == 'POST':
#         # Gather the username and password provided by the user.
#         # This info is obtained from the login form
#         # we use request.POST.get('<variable>') as opposed to request.POST['<variable>'] because
#         # the former returns None if the value does not exist while the latter will
#         # raise a Key Error exception
#         username = request.POST.get('username')
#         password = request.POST.get('password')
#         
#         # use Django's machinery to attempt to see if the username password combo is valid
#         # a user ojbect is returned if it is
#         user = authenticate(username=username, password=password)
#         
#         #if we have a User object, the details are correct.  If None (pythons way of saying absence of value)
#         # then no user with matching credentials was found
#         if user:
#             # is the acct active?  it could have been disabled
#             if user.is_active:
#                 # if acct is valid and active, we can log user in
#                 # we'll send user back to homepage
#                 login(request, user)
#                 return redirect(reverse('Rango:index'))
#             else:
#                 # An inactive account was used - no logging in
#                 return HttpResponse("Your Rango account is disabled.")
#         else:
#             # Bad login details were provided.  So we can't log the user in.
#             print(f"Invalid login details:  {username}, {password}")
#             return HttpResponse("Invalid login details supplied.")
#     # The request is not a HTTP POST, so display the login form
#     # This scenario would most likely be a HTTP GET
#     else:
#         # No context variables to pass to the template system, hence the
#         # blank dictionary object..
#         return render(request, 'Rango/login.html')
    
@login_required
def restricted(request):
    context_dict = {'boldmessage': 'Since you are logged in, you can go for it', 
                    'page_tab_header': 'Restricted',
                    }
    return render(request, 'Rango/restricted.html', context=context_dict)

# @login_required
# def user_logout(request):
#     #Since we know the user is logged in, we can now just log them out.
#     logout(request)
#     #Take the user back to the homepage.
#     return redirect(reverse('Rango:index'))
            
    
    
            
    

