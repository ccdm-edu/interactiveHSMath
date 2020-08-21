from django.urls import path
from Rango import views

app_name = 'Rango'

#item from first parameter is passed to method in second parameter
urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('category/<slug:category_name_slug>/',
         views.show_category, name='show_category'),
]