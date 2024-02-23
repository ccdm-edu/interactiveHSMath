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
    path('IntroTrigMusicConcepts/', views.MusicTrigConceptIntroView.as_view(), name='IntroTrigMusicConcepts'),
    path('MusicSineIntro/', views.MusicTrigView.as_view(), name='MusicSineIntro'),
    path('StaticTrig/', views.StaticTrigView.as_view(), name='StaticTrig'),
    path('DynamicTrig1/', views.DynamicTrig1View.as_view(), name='DynamicTrig1'),
    path('DynamicTrig2/', views.DynamicTrig2View.as_view(), name='DynamicTrig2'),
    path('ToneTrig/', views.ToneTrigView.as_view(), name='ToneTrig'),
    path('MusicNotesTrig/', views.MusicNotesTrigView.as_view(), name='MusicNotesTrig'),
    path('MusicSineSummary/', views.TrigSummaryView.as_view(), name='MusicSineSummary'),
#Trig Identities
    path('TrigIdentity/', views.TrigIDView.as_view(), name="TrigID"),
    path('TrigIdent_Tune/', views.TrigIDTuneView.as_view(), name="TrigIdent_Tune"),
#imag num
    path('imag_num/', views.ImagNumView.as_view(), name='imag_num'),
#You page
    path('acknowledgements/', views.AckView.as_view(), name='acknowledgements'),
#legal
    path('TermsOfUse/', views.Legal_TermsOfUse.as_view(), name='TermsOfUse'),
    path('Privacy/', views.Legal_Privacy.as_view(), name='Privacy'),
#contact me email sending  
    path('Contact_me/', views.ContactMe.as_view(), name='Contact_me'),   
    path('ProcessContact_me/', views.ProcessContactPage.as_view(), name='ProcessContact_me'), 
# for teachers only
    path('TeacherStds/', views.TeacherStandardsView.as_view(), name='TeacherStds'),
]