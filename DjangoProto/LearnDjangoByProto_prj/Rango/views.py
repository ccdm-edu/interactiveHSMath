from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from Rango.models import Category
from Rango.models import Page, UserProfile
from tkinter.constants import PAGES
from unicodedata import category
from Rango.forms import  CategoryForm, PageForm, UserForm, UserProfileForm
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from datetime import datetime
from Rango.bing_search import run_query
from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.views import View


class IndexView(View):
    def get(self, request):
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

# old school way to do this, then put this into urls.py under urlpatterns   path('about/', views.about, name='about'),
class AboutView(View):
    def get(self, request):
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
  
class ShowCategoryView(View):  
    def retrieve_cat_pages(self, category_name_slug):
        category = None
        pages = None
        try:
            #Can we find a category name slug with the given name?
            #If we can't, the .get() method raises a DoesNotExist exception
            #The .get() method returns one model instance or raises an exception
            category = Category.objects.get(slug=category_name_slug)
            #My own extra credit, update the views on this category
            category.views += 1
            category.save()
            
            #Retrieve all of the associated pages
            #The filter() will return a list of page objects or an empty list
            pages = Page.objects.filter(category=category).order_by('-views')[:5]
        except Category.DoesNotExist:
            pass
        return (category, pages)


    def get(self, request, category_name_slug):
        context_dict = {}
        result_list = []
        query = ''
        (category, pages)= self.retrieve_cat_pages(category_name_slug)
        #Adds our results list to the template context under name pages
        context_dict['pages'] = pages
        # We also add the category object from the database to context dict
        #we'll use this in the template to verify that the category exists
        context_dict['category'] = category
        context_dict['query'] = query
        context_dict['result_list'] = result_list
        # WSGIRequest: GET '/Rango/category/category_name_slug/
        #go forth and render the response and return to client
        return render(request, 'Rango/category.html', context=context_dict)
        
    def post(self, request, category_name_slug):
        context_dict = {}
        result_list = []
        query = ''
        (category, pages)= self.retrieve_cat_pages(category_name_slug)
        query = request.POST['query'].strip()
        if query:
            # Run our Bing function to get the results list
            result_list = run_query(query)
        #Adds our results list to the template context under name pages
        context_dict['pages'] = pages
        # We also add the category object from the database to context dict
        #we'll use this in the template to verify that the category exists
        context_dict['category'] = category
        context_dict['query'] = query
        context_dict['result_list'] = result_list
        # WSGIRequest: GET '/Rango/category/category_name_slug/
        #go forth and render the response and return to client
        return render(request, 'Rango/category.html', context=context_dict)
            
#This is the old school way to show category, above is class based way 
#def show_category(request, category_name_slug):
#     context_dict = {}
#     result_list = []
#     query = ''
#     try:
#         #Can we find a category name slug with the given name?
#         #If we can't, the .get() method raises a DoesNotExist exception
#         #The .get() method returns one model instance or raises an exception
#         category = Category.objects.get(slug=category_name_slug)
#         #My own extra credit, update the views on this category
#         category.views += 1
#         category.save()
#         
#         #Retrieve all of the associated pages
#         #The filter() will return a list of page objects or an empty list
#         pages = Page.objects.filter(category=category).order_by('-views')[:5]
#         
#         #Adds our results list to the template context under name pages
#         context_dict['pages'] = pages
#         # We also add the category object from the database to context dict
#         #we'll use this in the template to verify that the category exists
#         context_dict['category'] = category
# 
#     except Category.DoesNotExist:
#         #we get here if we didn't find the specified category
#         #dont do anything
#         # cuz the template will display a 'no category' message for us
#         context_dict['category'] = None
#         context_dict['pages'] = None 
#         
#         #put in search results'
#     if request.method == 'POST':
#         query = request.POST['query'].strip()
#         if query:
#             # Run our Bing function to get the results list
#             result_list = run_query(query)
#             
#     context_dict['query'] = query
#     context_dict['result_list'] = result_list
#     # WSGIRequest: GET '/Rango/category/category_name_slug/
#     #go forth and render the response and return to client
#     return render(request, 'Rango/category.html', context=context_dict)
class AddCategoryView(View):
    def get(self, request):
        form = CategoryForm()
        #will handle the bad form, new3 form or no form supplied cases
        #Render the form with error messages (if any).
        return render(request, 'rango/add_category.html', {'form': form})

    def post(self, request):
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
        
class AddPageView(View):
    def getBasics(self, category_name_slug):
            #Foreign key Category is required to post a page
        try:
            category = Category.objects.get(slug=category_name_slug)
        except Category.DoesNotExist:
            category = None
        return (category)
    
    def get(self, request, category_name_slug):
        category= self.getBasics(category_name_slug)
        form = PageForm()  
        #you cannot add a page to a category that does not exist
        if category is None:
            return redirect('/Rango/')
           #will handle the bad form, new3 form or no form supplied cases
        #Render the form with error messages (if any).
        context_dict = {'form': form, 'category': category}
        return render(request, 'Rango/add_page.html', context=context_dict)
                
    def post(self, request, category_name_slug):
        category= self.getBasics(category_name_slug)
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
    
class RestrictedView(View):
    @method_decorator(login_required)
    def get(self, request):
        context_dict = {'boldmessage': 'Since you are logged in, you can go for it', 
                        'page_tab_header': 'Restricted',
                        }
        # request = WSGIRequest: GET '/Rango/restricted/
        return render(request, 'Rango/restricted.html', context=context_dict)        


# code not used anymore, we don't have separate search page
# def search(request):
#     result_list = []
#     query = ''
#     if request.method == 'POST':
#         query = request.POST['query'].strip()
#         if query:
#             # Run our Bing function to get the results list
#             result_list = run_query(query)
#     # request is WSGIRequest: GET '/Rango/search/
#     return render(request,'Rango/search.html', {'query': query, 'result_list':result_list })

# here we track users clicks on urls in the website, 
class GoToURLView(View):
    def get(self, request):
        page_id = None
        page_id = request.GET.get('page_id')
        req_page = None
        try:
            req_page = Page.objects.get(id = page_id)
            if req_page:
                req_page.views += 1
                req_page.save()
                # send user off to page they wanted, now that we tracked their behavior
                return redirect(req_page.url)
            else:
                print(f'Page with page_id = {page_id} not found')
                return redirect(reverse('Rango:index'))
        except Page.MultipleObjectsReturned:
            print(f'database error, multiple pages found with same page id={page_id}')
        return redirect(reverse('Rango:index'))
    

#using the login_required decorator means user must already be logged in   
class RegisterProfileView(View):
    @method_decorator(login_required)
    def get(self, request):
        # we come here with blank form for user to fill in OR because user has filled out and we post to DB
        form = UserProfileForm()
        #Render the template depending on the context.
        return render(request,
                  'Rango/profile_registration.html',
                  context = {'form': form})
         
    @method_decorator(login_required)
    def post(self, request):
 
        # Attempt to grab info from the raw form information.
        form = UserProfileForm(request.POST, request.FILES)
        print(f"the image filename is {request.FILES}")
          
        # if the two forms are valid...
        if form.is_valid():
 
            # Now sort out the UserProfile instance
            # Since we need to set the user attribute ourselves
            # we set commit=False.  This delays saving the model
            # until we are ready to avoid integrity problems
            user_profile = form.save(commit=False)
            user_profile.user = request.user
              
            #Did the user provide a profile picture?  if so we need to get it from the input form and 
            # put it in the UserProfile model.
            #if 'picture' in request.FILES:
            #    user_profile.picture = request.FILES['picture']
                  
            #Now we save the UserProvile model instance
            user_profile.save()
 
            # registration was successful
            return redirect(reverse('Rango:index'))
        else:
            # Invalid form or forms - mistakes or something else?
            #print problems to the terminal
            print(form.errors)
         
            #Render the template depending on the context.
        return render(request,
                  'Rango/profile_registration.html',
                  context = {'form': form})
# @login_required
# def register_profile(request):
#      
#     # we come here with blank form for user to fill in OR because user has filled out and we post to DB
#     form = UserProfileForm()
#       
#     #If its a HTTP POST, we're interested in processing form data.
#     if request.method == 'POST':
#         # Attempt to grab info from the raw form information.
#         form = UserProfileForm(request.POST, request.FILES)
#         print(f"the image filename is {request.FILES}")
#           
#         # if the two forms are valid...
#         if form.is_valid():
#  
#             # Now sort out the UserProfile instance
#             # Since we need to set the user attribute ourselves
#             # we set commit=False.  This delays saving the model
#             # until we are ready to avoid integrity problems
#             user_profile = form.save(commit=False)
#             user_profile.user = request.user
#               
#             #Did the user provide a profile picture?  if so we need to get it from the input form and 
#             # put it in the UserProfile model.
#             #if 'picture' in request.FILES:
#             #    user_profile.picture = request.FILES['picture']
#                   
#             #Now we save the UserProvile model instance
#             user_profile.save()
#  
#             # registration was successful
#             return redirect(reverse('Rango:index'))
#         else:
#             # Invalid form or forms - mistakes or something else?
#             #print problems to the terminal
#             print(form.errors)
#          
#       
#     #Render the template depending on the context.
#     return render(request,
#                   'Rango/profile_registration.html',
#                   context = {'form': form})
             
# @login_required
# def profile(request, username):
#     

#         # easier than a try/except block where we have except on DoesNotExist
#         # dont use request.user here, use the User object because the former isn't filled in
#         curr_user = User.objects.get(username=username)
#         #userProfile = get_object_or_404(UserProfile, user=request.user)
#         userProfile = UserProfile.objects.get_or_create(user=curr_user)[0]
#         form = UserProfileForm({'website': userProfile.website,
#                                'picture': userProfile.picture})
#     
#     #THIS is not correct but ok for now
#     context_dict = {'form': form, 'selected_user': curr_user, 'user_profile':userProfile}    
#     return render(request,
#                   'Rango/profile.html',
#                   context = context_dict)       

class ProfileView(View):
    def getUserDetails(self, username):
        # django.contrib.auth.User is an instance from database
        sel_user = get_object_or_404(User, username=username)
        userProfile = UserProfile.objects.get_or_create(user=sel_user)[0]
        form = UserProfileForm({'website': userProfile.website,
                               'picture': userProfile.picture})
        return(sel_user, userProfile, form)
        
    # username variable comes form the link that sent us here.  View uses models and fires off a html doc
    # ensure username shows up in the urls.py list since there will be a different page for each user.
    @method_decorator(login_required)
    def get(self, request, username):
        (sel_user, userProfile, form) = self.getUserDetails(username)
        context_dict = {'form': form, 'selected_user': sel_user, 'user_profile':userProfile}   
        return render(request,
                  'Rango/profile.html',
                  context = context_dict)     
        
    @method_decorator(login_required)
    def post(self, request, username):
        (sel_user, userProfile, form) = self.getUserDetails(username)
        # Now sort out the UserProfile instance
        # we have user attribute so dont need to wait to save.  Take new stuff and put in old form instance
        #this is an update rather than a new save
        form = UserProfileForm(request.POST, request.FILES, instance=userProfile)
        if form.is_valid():
            form.save(commit=True)
            # not clear on why this works, if there is no param, you have to do a reverse ??
            return redirect('Rango:profile', sel_user.username)
        else:
            #not sure how to test this with an incorrect form???
            print(form.errors)
            
        
        context_dict = {'form': form, 'selected_user': sel_user, 'user_profile':userProfile}    
        return render(request,
                  'Rango/profile.html',
                  context = context_dict) 

#using the login_required decorator means user must already be logged in   
#@login_required
# def users_profiles(request):
#     all_users = User.objects.all()
#     context_dict = {'all_users':all_users}
#     return render(request, 
#                   'Rango/users_profiles.html',
#                   context=context_dict)

class UsersProfileView(View):
    @method_decorator(login_required)
    def get(self, request):
        #another way to do this is to UserProfile.objects.all and then you have to dereference to user then to username
        all_users = UserProfile.objects.all()
        context_dict = {'all_users':all_users}
        return render(request, 
                  'Rango/users_profiles.html',
                  context=context_dict)
        