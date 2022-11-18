from django.urls import path
from int_math import views


app_name = 'int_math'

#First parameter is the path that will show up in topmost browser location box
# next param is how to handle this path (included html page rendering)
#  and the third  parameter is what will be called in the django.  the name is for 
# avoiding hardcoding {%url 'Rango:name' %}
urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
#Trig functions
    path('MusicSineIntro/', views.MusicTrigView.as_view(), name='MusicSineIntro'),
    path('StaticTrig/', views.StaticTrigView.as_view(), name='StaticTrig'),
    path('DynamicTrig1/', views.DynamicTrig1View.as_view(), name='DynamicTrig1'),
    path('DynamicTrig2/', views.DynamicTrig2View.as_view(), name='DynamicTrig2'),
    path('ToneTrig/', views.ToneTrigView.as_view(), name='ToneTrig'),
    path('MusicSineSummary/', views.TrigSummaryView.as_view(), name='MusicSineSummary'),
#Trig Identities
    path('TrigIdentity/', views.TrigIDView.as_view(), name="TrigID"),
    path('TrigIdent_Tune/', views.TrigIDTuneView.as_view(), name="TrigIdent_Tune"),
#imag num
    path('imag_num/', views.ImagNumView.as_view(), name='imag_num'),
#You page
    path('UserData/', views.PeopleView.as_view(), name='user_contrib'),
    path('acknowledgements/', views.AckView.as_view(), name='acknowledgements'),
#utility stuff that serves many pages potentially
    path('bot_check/', views.ChkUsrIsRobotView.as_view(), name='bot_check'),
    path('give_file/', views.VerifyClientGiveFile.as_view(), name='give_file'),
    path('TermsOfUse/', views.Legal_TermsOfUse.as_view(), name='TermsOfUse'),
    path('Privacy/', views.Legal_Privacy.as_view(), name='Privacy'),
    path('Cookie/', views.Legal_Cookie.as_view(), name='Cookie'),    
    path('Contact_me/', views.ContactMe.as_view(), name='Contact_me'),    
]