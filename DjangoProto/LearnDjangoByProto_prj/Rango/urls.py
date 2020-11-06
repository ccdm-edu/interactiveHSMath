from django.urls import path
from Rango import views


app_name = 'Rango'

#item from first parameter is passed to method in second parameter
urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('about/', views.AboutView.as_view(), name='about'),
    path('category/<slug:category_name_slug>/',
         views.ShowCategoryView.as_view(), name='show_category'),
    path('add_category/', views.AddCategoryView.as_view(), name='add_category'),
    #the first time the url gets called, it goes to views.add_page but its not a POST 
    # so it just puts up the form. When user hits submit, it becomes a POST event and it 
    # goes to the URL in the .html page for POST event
    path('category/<slug:category_name_slug>/add_page/', views.AddPageView.as_view(), name='add_page'),
    # path('register/', views.register, name='register'),
    # path('login/', views.user_login, name='login'), 
    path('restricted/', views.RestrictedView.as_view(), name='restricted'),
    # path('logout/', views.user_logout, name='logout'),
    #path('search/', views.search, name='search'),
    path('goto/', views.GoToURLView.as_view(), name = 'goto'),
    path('register_profile/', views.RegisterProfileView.as_view(), name='register_profile'),
    #path('register_profile/', views.register_profile, name='register_profile'),
    # this is the old school way to do it
    #path('profile/<username>/', views.profile, name="profile"),
    # this way assumes a get() and post() method in View
    path('profile/<username>/', views.ProfileView.as_view(), name="profile"),
    path('users_profiles/', views.UsersProfileView.as_view(), name="users_profiles"),
    path('like_category/', views.LikeCategoryView.as_view(), name='like_category'),
    path('suggest/', views.CategorySuggestionView.as_view(), name='suggest'),
    
    
]