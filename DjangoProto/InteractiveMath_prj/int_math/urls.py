from django.urls import path
from int_math import views


app_name = 'int_math'

#First parameter is the path and the second parameter is what will be called for that path.  the name is for 
# avoiding hardcoding {%url 'Rango:name' %}
urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('StaticTrig/', views.StaticTrigView.as_view(), name='StaticTrig'),
    path('DynamicTrig1/', views.DynamicTrig1View.as_view(), name='DynamicTrig1'),
    path('DynamicTrig2/', views.DynamicTrig2View.as_view(), name='DynamicTrig2'),
    path('ToneTrig/', views.ToneTrigView.as_view(), name='ToneTrig'),
    path('imag_num/', views.ImagNumView.as_view(), name='imag_num'),
    path('user_contrib/', views.PeopleView.as_view(), name='user_contrib'),
    path('acknowledgements/', views.AckView.as_view(), name='acknowledgements'),
    path('bot_check/', views.ChkUsrIsRobotView.as_view(), name='bot_check'),
    path('give_file/', views.VerifyClientGiveFile.as_view(), name='give_file')
    
    
]