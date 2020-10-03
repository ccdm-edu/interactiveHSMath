from django.urls import path
from Rango import views


app_name = 'Rango'


#item from first parameter is passed to method in second parameter
urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('category/<slug:category_name_slug>/',
         views.show_category, name='show_category'),
    path('add_category/', views.add_category, name='add_category'),
    #the first time the url gets called, it goes to views.add_page but its not a POST 
    # so it just puts up the form. When user hits submit, it becomes a POST event and it 
    # goes to the URL in the .html page for POST event
    path('category/<slug:category_name_slug>/add_page/', views.add_page, name='add_page'),
    # path('register/', views.register, name='register'),
    # path('login/', views.user_login, name='login'), 
    path('restricted/', views.restricted, name='restricted'),
    # path('logout/', views.user_logout, name='logout'),
    path('search/', views.search, name='search'),
    path('goto/', views.goto_url, name = 'goto'),
    path('register_profile/', views.register_profile, name='register_profile'),
    
    
]