from django.shortcuts import render
from django.views import View
from int_math.models import Topic
from django.templatetags.static import static
from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import escape
from user_agents import parse
from datetime import date, datetime
import urllib.request
import json, os
from pytz import timezone
# homegrown stuff
from int_math.forms import contactForm
from pickle import TRUE

#**********************************************************
# These are actions that will require significant server time in recaptcha and smtp calls
#**********************************************************     
class ProcessContactPage(View):
    #print(f"Processing contact page inputs...")
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
            #print('form is valid WOO HOO')
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
                    #print('finished secret key decoder ring on grecaptcha')
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
                #trust this user for the duration of session, no need to retest them as long as client has this data local to their device
                request.session['notABot'] = True
                testHasPassed = True
                #print('Bot test PASSED')
                #get the email, name and message and ensure no html injection
                nameOfContact = escape(self.request.POST.get('name'))
                if nameOfContact == "":
                    nameOfContact = "anonymous"
                subjectOfContact = escape(self.request.POST.get('subject'))
                returnAddrEscaped = escape(self.request.POST.get('email'))
                if returnAddrEscaped == "":
                    returnAddrEscaped = "noemailaddr@nomail.com"
                messageEscaped = escape(self.request.POST.get('message')) 
                messageEscaped += " --From website user: " + nameOfContact + ".  At email addr: " + returnAddrEscaped
                sendToEmailAddr = settings.EMAIL_HOST_USER
                #print(f'Subject: {subjectOfContact}')
                #print(f'Message: {messageEscaped}')
                num_email_sent = 0

                try:
                    #the minute you use your sendTo address to log into smtp server, that becomes the "from" addr anyway
                    num_email_sent = send_mail(
                                    subjectOfContact,
                                    messageEscaped,
                                    sendToEmailAddr,
                                    [sendToEmailAddr],
                                    fail_silently=False,
                                    )
                except Exception as ex:
                    #will fail on num email sent as 0.  Could get BadHeaderError if user input <LF>, 
                    #could get auth error if Gmail rejects.  User should never ever get a 500 server error. Baaaaaad
                    template = "An exception of type {0} occurred. Arguments:\n{1!r}"
                    emsg = template.format(type(ex).__name__, ex.args)
                    print(f'Exception is {emsg}')
                    
                if num_email_sent == 0:
                    #user has injected newlines and message rejected, could be bot?, or gmail rejects us.  Check log.  Inform user of failure
                    testHasPassed = False  
    
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
                            'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                            'botTestDone': botTestDone,
                            'botTestPassed': testHasPassed
                           } 
        response = render(request, 'int_math/Contact_me.html', context=context_dict)
        return response                      

  

#**********************************************************
# functions used by page views
#**********************************************************
class ConfigMapper:
    keyFileWithMappings = os.path.join(os.path.dirname(__file__), '..', 'static', 'static_binaries', 'Configuration', 'BinaryFileNameConfig.json')
    configMapDict = dict()
    
    def __init__(self):
        if len(self.configMapDict) == 0:
            try:
                fileObj = open(self.keyFileWithMappings, 'rt')
                self.configMapDict = json.load(fileObj)
            except FileNotFoundError:
                print(f'File {self.keyFileWithMappings} was not found')
            except Exception as ex:
                template = "An exception of type {0} occurred. Arguments:\n{1!r}"
                emsg = template.format(type(ex).__name__, ex.args)
                print(f'Error {emsg} in opening file {self.keyFileWithMappings}')
            fileObj.close()
            
    def readConfigMapper(self, genericFileName):
        actualFile = "none"
        if len(self.configMapDict) > 0:
            actualFile = self.configMapDict.get(genericFileName)
            #print(f' we just mapped {genericFileName} to {actualFile}')
        else:
            print(f'Software error, file mapper not found or error opening')
        return actualFile
            
#**********************************************************
# these are all page views
#**********************************************************
class IndexView(View):
    def get(self, request):
        # add help to user based on device/browser
        ua_string = request.META['HTTP_USER_AGENT'];
        user_agent = parse(ua_string)
        usingSafari = False;
        if 'safari' in user_agent.browser.family.lower(): 
            usingSafari = True;
        isMobile = user_agent.is_mobile;
        configMap = ConfigMapper()
        realFileLandLogo = configMap.readConfigMapper("LandingPageLogo")
        companyName = configMap.readConfigMapper("CompanyName")
        g_analyticsID = configMap.readConfigMapper('GoogleAnalID')

        #check if there is an upcoming upgrade planned to site and notify users
        upgrdSchedFile = os.path.join(os.path.dirname(__file__), '..', 'InteractiveMath_prj', 'UpgradeSchedule.txt')
        upgradeNoticePresent = False
        upgradeDate = ""
        upgradeDay = ""
        upgradeTime = ''
        if os.path.isfile(upgrdSchedFile):
            upgd = open(upgrdSchedFile, 'r')
            #ignore first line of file, its comment to user
            comment = upgd.readline()  
            dateUpgdStr = upgd.readline().rstrip('\n')
            date_format = '%Y-%m-%d-%H %z'
            dateUpgd = None
            try:
                dateUpgd = datetime.strptime(dateUpgdStr, date_format)
            except Exception as ex:
                template = "An exception of type {0} occurred. Arguments:\n{1!r}"
                emsg = template.format(type(ex).__name__, ex.args)
                print(f'Exception is {emsg}')
                print(f'Failure on parsing time in UpgradeSchedule.txt, cannot parse {repr(dateUpgdStr)}')
            if (dateUpgd is not None):
                # get time right now and convert to EST (from UTC).  My testing shows this does NOT handle daylight savings time well
                # but that really isn't important for this application
                tz = timezone('EST')
                rightNow = datetime.now(tz)
                daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                dayUpgdNum = dateUpgd.weekday()
                dayUpgd = daysOfWeek[dayUpgdNum]
                if (dateUpgd > rightNow):  #else, its an old notice, ignore it
                    upgradeNoticePresent = True
                    upgradeDate = dateUpgd.date
                    upgradeTime = dateUpgd.time
                    upgradeDay = dayUpgd
                #print(f"Reading upgd schedule, date is {dateUpgd} , day is {dayUpgd} and right now is {rightNow}")
            upgd.close()
        #send all this off to requesting user
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'Home',
                        'topic': None,
                        'using_safari': usingSafari,
                        'is_mobile': isMobile,
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'landingPageLogo': static(realFileLandLogo),
                        'upgradeNoticePresent': upgradeNoticePresent,
                        'upgradeDay': upgradeDay,
                        'upgradeDate': upgradeDate,
                        'upgradeTime': upgradeTime
                        }        
        response = render(request, 'int_math/index.html', context=context_dict)
        return response
#****************************************************************************************
#  Trig functions section
#****************************************************************************************
# page 1 General Concepts Intro of trig function section
class MusicTrigConceptIntroView(View):
    def get(self, request):
        trigMap = ConfigMapper()
        realFileIntroVideo = trigMap.readConfigMapper("IntroToFrequencyVideo_html")
        realFileCartoonGIF = trigMap.readConfigMapper("CartoonIntroGIF")
        realFileCartoonTrig = trigMap.readConfigMapper("CartoonIntroTrig")
        realFileIntroAudio = trigMap.readConfigMapper("TrigReviewIntroAudio")
        companyName = trigMap.readConfigMapper("CompanyName")
        g_analyticsID = trigMap.readConfigMapper('GoogleAnalID')
        artistCredit = trigMap.readConfigMapper('ArtistCredits')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'IntroConcepts',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'introToFreqVideo': static(realFileIntroVideo),
                        'cartoonIntroGIF': static(realFileCartoonGIF),
                        'cartoonIntroTrig': static(realFileCartoonTrig),
                        'trigReviewIntroAudio': static(realFileIntroAudio),
                        "artistCredit": artistCredit[0],
                        }
        response = render(request, 'int_math/IntroTrigMusicConcepts.html', context=context_dict)
        return response
# page 2 Music Sine Intro of trig function section    
class MusicTrigView(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'MusicalTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        }
        response = render(request, 'int_math/Pg2MusicSineIntro.html', context=context_dict)
        return response
# page 3 Where does sine/cosine come from? of trig function section       
class StaticTrigView(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'StaticTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        }
        response = render(request, 'int_math/StaticTrig.html', context=context_dict)
        return response
# page 4 Lets add time and make frequency of trig function section    
class DynamicTrig1View(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'DynamicTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        }
        response = render(request, 'int_math/DynamicTrig1.html', context=context_dict)
        return response
    
# page 5 Lets go faster in time of trig function section
class DynamicTrig2View(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        artistCredit = textMap.readConfigMapper('ArtistCredits')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'DynamicTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'artistCredit': artistCredit[3],
                        }
        response = render(request, 'int_math/DynamicTrig2.html', context=context_dict)
        return response
# page 6 Lets get into audible sin/cosine tones of trig function section
class ToneTrigView(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        artistCredit = textMap.readConfigMapper('ArtistCredits')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'ToneTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'artistCredit': artistCredit[3],
                        }
        response = render(request, 'int_math/ToneTrig.html', context=context_dict)
        return response

# page 7 Lets compare musical instruments to sine/cosine of same pitch of trig function section    
class MusicNotesTrigView(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        artistCredit = textMap.readConfigMapper('ArtistCredits')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'MusicNotes',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'artistCredit': artistCredit[2],
                        }
        response = render(request, 'int_math/MusicNotesTrig.html', context=context_dict)
        return response
    
# page 8 Lets summarize this all now of trig function section
class TrigSummaryView(View):
    def get(self, request):
        trigMap = ConfigMapper()
        actualFilename = trigMap.readConfigMapper("MusicSummaryVideo")
        realFileCartoonTrig = trigMap.readConfigMapper("CartoonIntroTrig")
        companyName = trigMap.readConfigMapper("CompanyName")
        g_analyticsID = trigMap.readConfigMapper('GoogleAnalID')
        artistCredit = trigMap.readConfigMapper('ArtistCredits')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'Summary',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'musicSummaryVideo': static(actualFilename),
                        'cartoonIntroTrig': static(realFileCartoonTrig),
                        'artistCredit': artistCredit[1],
                        }
        response = render(request, 'int_math/MusicSineSummary.html', context=context_dict)
        return response
#****************************************************************************************
#  END OF Trig functions section
#****************************************************************************************
    
class ImagNumView(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'Imag_num',
                        'topic': Topic.objects.get(name="Imag_num"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        }        
        response = render(request, 'int_math/imag_num.html', context=context_dict)
        return response

class TeacherStandardsView(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'Teachers',
                        'topic': None,
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        }        
        response = render(request, 'int_math/TeacherStds.html', context=context_dict)
        return response
        
class PeopleView(View):
    # give user all the info I collect about them
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'People',
                        'topic': Topic.objects.get(name="Thanks"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        }
        return render(request, 'int_math/acknowledgements.html', context=context_dict)

class AckView(View):
    def get(self, request):
        #constants for writing the HTML for each contributer
        OPENER = "<section class='contributor_contact'>"
        H2_1 = "<h2>"
        H2_2 = "</h2>"
        H3_1 = "<h3>"
        H3_2 = "</h3>"
        CLOSER = "</section>"
        A_Begin = "<a href='"
        A_End = "'>"
        A_Close = "</a>"
        Img1 = "<img src='"
        Img2 = "'/>"
        trigMap = ConfigMapper()
        ty_list = trigMap.readConfigMapper("Thankyou_list")
        companyName = trigMap.readConfigMapper("CompanyName")
        g_analyticsID = trigMap.readConfigMapper('GoogleAnalID')
        #go through the list of contributors and "write" the code out to page
        contributorString = ""
        for contributor in ty_list:
            contributorString += OPENER + A_Begin + contributor["url"] + A_End + Img1 + contributor["logo"] + Img2 + A_Close
            contributorString += A_Begin + contributor["url"] + A_End + H2_1 + contributor["line1"] + H2_2 + A_Close
            contributorString += A_Begin + contributor["url"] + A_End + H3_1 + contributor["line2"] + H3_2 + A_Close + CLOSER
        #print(f'contributor string is {contributorString}')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'Thank You!',
                        'topic': Topic.objects.get(name="Thanks"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'Contributors': contributorString
                        }
        response = render(request, 'int_math/acknowledgements.html', context=context_dict)
        return response        

class TrigIDView(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'Trig ID',
                        'topic': Topic.objects.get(name="TrigIdent"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        }
        response = render(request, 'int_math/TrigIdentity.html', context=context_dict)
        return response     
    
class TrigIDTuneView(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID,        
                        'CompanyName': companyName,
                        'page_tab_header': 'Inst Tune',
                        'topic': Topic.objects.get(name="TrigIdent"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        }
        response = render(request, 'int_math/TrigIdent_Tune.html', context=context_dict)
        return response 
     
class Legal_TermsOfUse(View):
    def get(self, request):
        configMap = ConfigMapper()
        actualFilename = configMap.readConfigMapper("Legal_TermsCond")
        g_analyticsID = configMap.readConfigMapper('GoogleAnalID') 
        companyName = configMap.readConfigMapper("CompanyName")
        context_dict = {'GoogleAnalID': g_analyticsID,
                        'CompanyName': companyName,
                        'page_tab_header': 'Terms Of Use',
                        'topic': Topic.objects.get(name="Legal"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'legalDocTerms': static(actualFilename) + "#toolbar=0",
                       }  
        response = render(request, 'int_math/TermsOfUse.html', context=context_dict)
        return response
class Legal_Privacy(View):
    def get(self, request):
        configMap = ConfigMapper()
        actualFilename = configMap.readConfigMapper("Legal_Privacy")
        companyName = configMap.readConfigMapper("CompanyName")
        g_analyticsID = configMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID, 
                        'CompanyName': companyName,
                        'page_tab_header': 'Privacy Policy',
                        'topic': Topic.objects.get(name="Legal"),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'legalDocPriv': static(actualFilename) + "#toolbar=0",
                       }  
        response = render(request, 'int_math/Privacy.html', context=context_dict)
        return response

class ContactMe(View):
    def get(self, request):
        textMap = ConfigMapper()
        companyName = textMap.readConfigMapper("CompanyName")
        g_analyticsID = textMap.readConfigMapper('GoogleAnalID')
        context_dict = {'GoogleAnalID': g_analyticsID, 
                        'CompanyName': companyName,
                        'page_tab_header': 'Contact Us',
                        'topic': None,
                        'form': contactForm(),
                        'recaptchaPublicKey': settings.RECAP_PUBLIC_KEY,
                        'botTestDone': False,
                        'botTestPassed': False
                       } 
        response = render(request, 'int_math/Contact_me.html', context=context_dict)
        return response
