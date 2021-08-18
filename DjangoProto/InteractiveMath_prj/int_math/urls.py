from django.urls import path
from int_math import views


app_name = 'int_math'

#First parameter is the path and the second parameter is what will be called for that path.  the name is for 
# avoiding hardcoding {%url 'Rango:name' %}
urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),

    
]