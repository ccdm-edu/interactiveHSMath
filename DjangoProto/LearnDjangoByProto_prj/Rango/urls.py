from django.urls import path
from Rango import views

app_name = 'Rango'

urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about')
]