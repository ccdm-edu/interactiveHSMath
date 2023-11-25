from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from int_math.models import Topic, Subtopic, BotChkResults
from django.conf import settings
from django.urls import reverse
from django.contrib.staticfiles.storage import staticfiles_storage
from django.contrib.staticfiles import finders
from django.core.files import File
from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import escape
from user_agents import parse
import urllib.request
import json
import os
#----for modal windows--------
from bootstrap_modal_forms.generic import BSModalFormView
# homegrown stuff
from int_math.forms import BotChkForm, contactForm



#**********************************************************
# Modal window resonse, check if user is a Robot before allowing significant
# server time to client
#**********************************************************
#class ChkUsrIsRobotView(BSModalFormView):
#    template_name = 'int_math/bot_check.html'
#    form_class = BotChkForm
#    success_message = "Passed Test, You can now access server files"

#    def get_success_url(self):
        # we return back to the page that sent us, encoded in html as next parameter, 
        # if that fails, go back to home page (should never happen)
#        return self.request.GET.get('next', reverse('int_math:index'))
        
#    def post(self, request):  
        # check the form validity for basic stuff first
#        form = self.form_class(request.POST) 
#        responseTest = super().form_valid(form)
#        botCheckNeeded = True
#        quartile = '1Q'
        
        # I chose to use django-bootstrap-modal-forms to do generic modal forms.  In retrospect, I should have just
        #done straight bootstrap modal forms with django and skipped this library and I may rewrite things to do that
        # because the django-bootstrap-mopdal-forms pypi library INTENTIONALLY posts twice by design.  Full expln is here
        # https://github.com/trco/django-bootstrap-modal-forms/issues/14.  The first post is ajax, the second is normal post.
        # we can ignore the first post (so we don't get a duplicate token error from recaptcha).  We could also do this in mixins, if
        # I knew how to use mixins which I don't yet.  Another bug in this library is success message is not shown.  Sigh....
#        if not self.request.is_ajax():
#            recaptcha_str = self.request.POST.get('g_recaptcha_response')
#            if recaptcha_str is not None:
                #cant do this on the client since server is the only onw with secret key
#                secret_key = settings.RECAPTCHA_SECRET_KEY
#                payload = {
#                    'response': recaptcha_str,
#                    'secret': secret_key}
#                data = urllib.parse.urlencode(payload).encode()
#                req = urllib.request.Request('https://www.google.com/recaptcha/api/siteverify', data=data)
#                print('finished secret key decoder ring on grecaptcha')
#                response = urllib.request.urlopen(req)
#                result = json.loads(response.read().decode())
                #take action on robot test results
#                if (result['success'] and result['action'] == 'bot_check_form'):
#                    if (result['score'] < 0.25):
#                        quartile = '1Q'
#                    elif (result['score'] < 0.5): 
#                        quartile = '2Q'
#                    elif (result['score'] < 0.75):
#                        quartile = '3Q'
#                    else:
#                        quartile = '4Q'
#                else:
                    # need to throw an exception or do something here
#                    print(f"ERROR, bad recaptcha token, raw result was {result}")
            
            #JS passes back text string, not a bool
#            passChallengeTest = self.request.POST.get('math_test')
#            print('results on math test is ' + passChallengeTest +  " quartile is " + quartile)
            
#            passChallengeTest_bool = False
#            if (('12' == passChallengeTest) and ('4Q' == quartile)):
                #trust this user for the duration of session, no need to retest them as long as client has this cookie
#                request.session['notABot'] = True
#                botCheckNeeded = False
#                passChallengeTest_bool = True
#                print('Bot test PASSED')
#            else:
                # tell server not to trust this client on all subsequent accesses and to retest the user
#                request.session['notABot'] = False
#                botCheckNeeded = True
#                print('Bot test FAILED')
            
            # add results to running tab kept at server
            # retrieve model and increment the count
#            curr_stat = BotChkResults.objects.get_or_create(pass_mathtest = passChallengeTest_bool, recaptcha_v3_quartile = quartile)[0]
#            curr_stat.count = curr_stat.count + 1
#            curr_stat.save()
#            print(f'curr_stat = {curr_stat}')

#        context_dict = {'page_tab_header': 'ToneTrig',
#                        'topic': Topic.objects.get(name="TrigFunct"),
#                        'botChkTstNeed': botCheckNeeded,
#                        }
        # next url is encoded in this POST request, if failure, go back home, youre screwed
#        nextURL = self.request.GET.get('next', reverse('int_math:index')) 
        #need to remove first and last slash and add .html to this text in order to render template
#        nextURL = nextURL[1:-1] + ".html"
#        print('next url is ' + nextURL)
#        responseTest = render(request, nextURL, context=context_dict)
#        return responseTest

#**********************************************************
# These are actions that will require significant server time, verify and 
# respond to client appropriately
#**********************************************************     
class ProcessContactPage(BSModalFormView):
    print(f"Processing contact page inputs...")
    template_name = 'int_math/Contact_me.html'
    form_class = contactForm
        
    def post(self, request):  
        returnForm = contactForm()  #assume user got their form correct, for now
        # check the form validity for basic stuff first
        form = self.form_class(request.POST) 
        botTestDone = False
        testHasPassed = False
        if form.is_valid():
            # this only checks the format of the email, all other inputs are valid, we escape all text
            #however, email is optional so a blank is ok
            print('form is valid WOO HOO')
            quartile = '1Q'
            
            #did a bot see the token empty box and try to fill it in? (honeypot test)
            honey_pot_fail = self.request.POST.get('pooh_food_test')
            
            # Send off token to google recaptcha
            recaptcha_str = self.request.POST.get('g_recaptcha_response')
            if not honey_pot_fail:
                if recaptcha_str is not None:
                    #cant do this on the client since server is the only onw with secret key
                    secret_key = settings.RECAPTCHA_SECRET_KEY
                    payload = {
                        'response': recaptcha_str,
                        'secret': secret_key}
                    data = urllib.parse.urlencode(payload).encode()
                    req = urllib.request.Request('https://www.google.com/recaptcha/api/siteverify', data=data)
                    print('finished secret key decoder ring on grecaptcha')
                    response = urllib.request.urlopen(req)
                    result = json.loads(response.read().decode())
                    #take action on robot test results
                    if (result['success'] and result['action'] == 'ContactUsForm'):
                        botTestDone = True
                        if (result['score'] < 0.25):
                            quartile = '1Q'
                        elif (result['score'] < 0.5): 
                            quartile = '2Q'
                        elif (result['score'] < 0.75):
                            quartile = '3Q'
                        else:
                            quartile = '4Q'
                    else:
                        # need to throw an exception or do something here, some kind of software error
                        print(f"SW error:  bad recaptcha token, raw result was {result}")
            else:
                print(f"You failed the Pooh bear test, you checked an invisible honey pot")
            
            #JS passes back text string, not a bool
            print('results on quartile is ' + quartile)
            
            if ('4Q' == quartile):
                #trust this user for the duration of session, no need to retest them as long as client has this cookie
                request.session['notABot'] = True
                testHasPassed = True
                print('Bot test PASSED')
                #get the email, name and message and ensure no html injection
                nameOfContact = escape(self.request.POST.get('name'))
                if nameOfContact == "":
                    nameOfContact = "anonymous"
                subjectOfContact = escape(self.request.POST.get('subject'))
                returnAddrEscaped = escape(self.request.POST.get('email'))
                if returnAddrEscaped == "":
                    returnAddrEscaped = "noemailaddr@nomail.com"
                messageEscaped = escape(self.request.POST.get('message')) 
                messageEscaped += " --from website user " + nameOfContact
                sendToEmailAddr = settings.WEBSITE_EMAIL
                print(subjectOfContact)
                print(messageEscaped)
                print (returnAddrEscaped)
                print (sendToEmailAddr)
                if not settings.DEBUG:
                    # email sending wont work on debug dev server
                    send_mail(
                        subjectOfContact,
                        messageEscaped,
                        returnAddrEscaped,
                        [sendToEmailAddr],
                        fail_silently=False,
                        )
    
            else:
                # tell server not to trust this client on all subsequent accesses and to retest the user
                request.session['notABot'] = False
                print('Bot test FAILED')
            

        else: 
            #the only thing this checks is email errors if the user chooses to give one.  else all passes
            returnForm=form    #return users form complete with their inputs and computed errors
            
        # add results to running tab kept at server
        # retrieve model and increment the count  NOT DONE YET    
        context_dict = {'page_tab_header': 'Contact Us',
                            'topic': None,
                            'form': returnForm,  
                            'botTestDone': botTestDone,
                            'botTestPassed': testHasPassed
                           } 
        response = render(request, 'int_math/Contact_me.html', context=context_dict)
        return response                      

  
class VerifyClientGiveFile(View):
    instrumentFilenames = {'Trumpet': "BDM_trumpet_468.MP3", 
                           'Clarinet': "DG_clarinet467.MP3", 
                           'Soprano Sax': "MS_SSax_midC.MP3", 
                           'Tenor Sax': "MS_TSax_midC.MP3",
                           'Flute': "OS_flute_bflat_466.MP3",
                           'Human': "DGum_voice466.MP3"}
    def get(self, request):
        response = HttpResponse()
        resultFilename = ''
        if 'instrument' in request.GET:
            # Need to go up one level from give_file URL we are in to get to int_math level and correct file location
            instrument = request.GET['instrument']
            resultFilename = finders.find(self.instrumentFilenames[instrument])
            print('result of finders is ')
            print(resultFilename)
            searched_locations = finders.searched_locations

        if 'notABot' in request.session:
            # bot test already performed, notaBot exists, get results
            if request.session.get('notABot', True):
                print('you are NOT a bot')
                try:
                    #all is good, get the file and send if off.  
                    # DO, redo this in terms of nginx access for greater efficiency  Use python django-sendfile library
                    #need different way to send off via development server and nginx (or apache if we later go that way)
                    tuneFile = open(resultFilename,"rb")
                    response.write(tuneFile.read())
                    response['Content-Type'] = 'audio/mpeg'
                    #response['X-Accel-Redirect'] = resultFilename
                    #response['X-Accel-Buffering'] = 'no'
                    response['Content-Length'] = os.path.getsize(resultFilename)
                    #response['Content-Disposition'] = 'attachment; filename=' + resultFilename
                    
                    return response
                except OSError as e: 
                    print('File not found:  error=' + e)
                    response.status_code = 404
                except Exception as e:
                    print(e)
                    response.status_code = 404
            else:
                print('you are a bot')
                response.status_code = 403  #Forbidden 
        else:
            # else, bot test not passed/failed yet.  SW Error.  Send msg back to client
            print('Client short circuited the bot test. NO file for YOU!')
            response.status_code = 403  #forbidden


        return response

#**********************************************************
# these are all page views
#**********************************************************
class IndexView(View):
    def get(self, request):
        # add "help" for user to know that this site isn't tested on certain browsers or platforms
        ua_string = request.META['HTTP_USER_AGENT'];
        user_agent = parse(ua_string)
        usingSafari = False;
        if 'safari' in user_agent.browser.family.lower(): 
            usingSafari = True;
        isMobile = user_agent.is_mobile;
        context_dict = {'page_tab_header': 'Home',
                        'topic': None,
                        'using_safari': usingSafari,
                        'is_mobile': isMobile,
                        }        
        response = render(request, 'int_math/index.html', context=context_dict)
        return response
# page 1 General Concepts Intro of trig function section
class MusicTrigConceptIntroView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'IntroConcepts',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        }
        response = render(request, 'int_math/IntroTrigMusicConcepts.html', context=context_dict)
        return response
# page 2 Music Sine Intro of trig function section    
class MusicTrigView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'MusicalTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        }
        response = render(request, 'int_math/MusicSineIntro.html', context=context_dict)
        return response
# page 3 Where does sine/cosine come from? of trig function section       
class StaticTrigView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'StaticTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        }
        response = render(request, 'int_math/StaticTrig.html', context=context_dict)
        return response
# page 4 Lets add time and make frequency of trig function section    
class DynamicTrig1View(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'DynamicTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        }
        response = render(request, 'int_math/DynamicTrig1.html', context=context_dict)
        return response
    
# page 5 Lets go faster in time of trig function section
class DynamicTrig2View(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'DynamicTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        }
        response = render(request, 'int_math/DynamicTrig2.html', context=context_dict)
        return response
# page 6 Lets get into audible sin/cosine tones of trig function section
class ToneTrigView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'ToneTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        }
        response = render(request, 'int_math/ToneTrig.html', context=context_dict)
        return response

# page 7 Lets compare musical instruments to sine/cosine of same pitch of trig function section    
class MusicNotesTrigView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'MusicNotes',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        }
        response = render(request, 'int_math/MusicNotesTrig.html', context=context_dict)
        return response
    
# page 8 Lets summarize this all now of trig function section
class TrigSummaryView(View):
    def get(self, request):
        #check session cookie (which expires after soom time--default 15 days) to see if bot test passed
        try: 
            # If session is established, use it
            botCheckNeeded = not request.session['notABot']
        except:
            # else, no session established, set it up so robot check test required
            botCheckNeeded = True
        context_dict = {'page_tab_header': 'Summary',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'botChkTstNeed': botCheckNeeded,
                        }
        response = render(request, 'int_math/MusicSineSummary.html', context=context_dict)
        return response
    
class ImagNumView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Imag_num',
                        'topic': Topic.objects.get(name="Imag_num"),
                        }        
        response = render(request, 'int_math/imag_num.html', context=context_dict)
        return response
    
class PeopleView(View):
    # give user all the info I collect about them
    def get(self, request):
        qF = BotChkResults.objects.filter(pass_mathtest = False)
        mtF = [qF.get(recaptcha_v3_quartile = '1Q').count,
               qF.get(recaptcha_v3_quartile = '2Q').count,
               qF.get(recaptcha_v3_quartile = '3Q').count,
               qF.get(recaptcha_v3_quartile = '4Q').count ]
        
        qP = BotChkResults.objects.filter(pass_mathtest = True)
        mtP = [qP.get(recaptcha_v3_quartile = '1Q').count,
               qP.get(recaptcha_v3_quartile = '2Q').count,
               qP.get(recaptcha_v3_quartile = '3Q').count,
               qP.get(recaptcha_v3_quartile = '4Q').count ]

        context_dict = {'page_tab_header': 'People',
                        'topic': Topic.objects.get(name="You"),
                        'mtF': mtF,
                        'mtP': mtP,
                        }
        return render(request, 'int_math/UserData.html', context=context_dict)

class AckView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Thank You!',
                        'topic': Topic.objects.get(name="You"),
                        }
        response = render(request, 'int_math/acknowledgements.html', context=context_dict)
        return response        

class TrigIDView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Trig ID',
                        'topic': Topic.objects.get(name="TrigIdent"),
                        }
        response = render(request, 'int_math/TrigIdentity.html', context=context_dict)
        return response     
    
class TrigIDTuneView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Inst Tune',
                        'topic': Topic.objects.get(name="TrigIdent"),
                        }
        response = render(request, 'int_math/TrigIdent_Tune.html', context=context_dict)
        return response 
     
class Legal_TermsOfUse(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Terms Of Use',
                        'topic': Topic.objects.get(name="Legal"),
                       }  
        response = render(request, 'int_math/TermsOfUse.html', context=context_dict)
        return response
class Legal_Privacy(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Privacy Policy',
                        'topic': Topic.objects.get(name="Legal"),
                       }  
        response = render(request, 'int_math/Privacy.html', context=context_dict)
        return response
class Legal_Cookie(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Cookie Policy',
                        'topic': Topic.objects.get(name="Legal"),
                       } 
        response = render(request, 'int_math/Cookie.html', context=context_dict)
        return response
class ContactMe(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Contact Us',
                        'topic': None,
                        'form': contactForm(),
                        'botTestDone': False,
                        'botTestPassed': False
                       } 
        response = render(request, 'int_math/Contact_me.html', context=context_dict)
        return response
