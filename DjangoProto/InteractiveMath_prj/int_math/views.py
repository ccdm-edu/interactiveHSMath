from django.shortcuts import render, redirect
from django.views import View
from django.urls import reverse
from int_math.models import Topic
from django.templatetags.static import static
from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import escape
from user_agents import parse
import urllib.request
import json, os
from pytz import timezone
from django.views.decorators.cache import cache_control
from django.utils.decorators import method_decorator
# homegrown stuff
from int_math.forms import contactForm
from int_math.models import ContactAccesses
# to generate signed URLs
import hashlib
import time
import uuid

import datetime
import requests


#**********************************************************
# These are actions that will require significant server time in recaptcha and smtp calls
#**********************************************************  
MAX_FREE_RECAPTCHA = 5000  #as of 3/2025, google allows 10k for free/month
MAX_NUM_EMAIL_PER_MONTH = 100   # I don't want more than this in my inbox, dammit!


def generateSignedURL4Bucket(filename, usePubDomainBucket, expiration_seconds=3600):
    """
    Generates a custom Cloudflare Worker-compatible signed URL.
    """
    sign_url_secret_code = ""
    cloud_bucket_url = ""
    if usePubDomainBucket: 
        sign_url_secret_code = os.environ.get('SIGN_URL_SECRET_CODE')
        cloud_bucket_url = str(os.environ.get('CLOUD_URL_CODE'))
        if not sign_url_secret_code:
            raise ValueError("SIGN_URL_SECRET_CODE env variable secret key is not set.")
    else:
        sign_url_secret_code = os.environ.get('SIGN_URL_SECRET_CODE')
        cloud_bucket_url = str(os.environ.get('CLOUD_URL_BINARY'))
        if not sign_url_secret_code:
            raise ValueError("SIGN_URL_SECRET_BIN secret key is not set.")
            
    # Generate a unique ID, required by your worker's logic
    unique_id = str(uuid.uuid4())
    expires_at = int(time.time()) + expiration_seconds
    
    signature_data = f"{sign_url_secret_code}:{filename}:{unique_id}:{expires_at}"
    signature = hashlib.sha256(signature_data.encode()).hexdigest()

    # Match the URL format your Worker expects
    signed_url = cloud_bucket_url + f"/{filename}?expires={expires_at}&sig={signature}&id={unique_id}"
    print(f' signed (either code/binary) url is {signed_url}')
    return signed_url

  
def getFullFileURL(filename, usePubDomainBucket, request):
    GET_FROM_CLOUD_str = os.environ.get('USE_CLOUD_BUCKET')
    GET_FROM_CLOUD = False
    if GET_FROM_CLOUD_str.lower() == 'true':
        GET_FROM_CLOUD = True
    urlStaticSrc = ""
    localURLbase = str(request.build_absolute_uri('/'))
    if (GET_FROM_CLOUD == True):
        #this cannot be tested from localhost due to security concerns with whitelisting localhost
        urlStaticSrc = generateSignedURL4Bucket(filename)
        print(f'REMOTE code:  url will be {urlStaticSrc}')            
    else:
        # use local copy of file.  This is expected to be used for initial testing only, not for deployment
        #only used in localhost and (maybe) dev pythonanywhere account
        urlStaticSrc = ""
        if usePubDomainBucket:
            urlStaticSrc = localURLbase + "static/" + filename
        else: 
            urlStaticSrc = localURLbase + "static/static_binaries/" + filename
        print(f'LOCAL code:  url will be {urlStaticSrc}')
    return urlStaticSrc

def getBaseContextEntry(request):
    #This sets up all the params for the base page used to template html docs
    configMap = ConfigMapper(request)
    companyName = configMap.readConfigMapper("CompanyName")
    g_analyticsID = configMap.readConfigMapper('GoogleAnalID')
    baseKVcontext = {'CompanyName': companyName, 
                     'GoogleAnalID': g_analyticsID, 
                     'recaptchaPublicKey':settings.RECAP_PUBLIC_KEY,
                     'FavIco': getFullFileURL('NonPublicImages/favicon.ico', False, request),
                     'IntMathCSS': getFullFileURL('css/intMath.css', True, request),
                     'JQlocalJS': getFullFileURL('js-lib/jquery-371min.js', True, request),
                     'JQtouchLibJS': getFullFileURL('js-lib/jquery.touch.min.js', True, request),
                     'IntMathUtilsJS': getFullFileURL('js/IntMathUtils.js', True, request),
                     'IntMathJS':getFullFileURL('js/IntMath.js', True, request),
                     'AutoDemoJS': getFullFileURL('js/autoDemo.js', True, request),
                     'ClickHereSVG': getFullFileURL('images/clickhere_cursor.svg', True, request),
                     'StartAutodemoSVG': getFullFileURL('images/autoDemoButton.svg', True, request),
                     'NoCookieSVG': getFullFileURL('images/nocookie_50px.jpeg', True, request),
                     'CookieSVG': getFullFileURL('images/cookie_50px.jpeg', True, request),}
    
    return baseKVcontext

class ProcessContactPage(View):
    template_name = 'int_math/Contact_me.html'
    form_class = contactForm
      
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def post(self, request):  
        returnForm = contactForm()  #assume user got their form correct, for now
        # check the form validity for basic stuff first
        form = self.form_class(request.POST) 
        botTestDone = False
        testHasPassed = False
        num_email_sent = 0
        num_recapcha_sent = 0
        # increment accesses for next contact me user
        currAccesses = ContactAccesses.objects.first()
        if form.is_valid():
            # this only checks the format of the email, all other inputs are valid, we escape all text
            #however, email is optional so a blank is ok
            quartile = '1Q'
            
            #did a bot see the token empty box and try to fill it in? (honeypot test)
            honey_pot_fail = self.request.POST.get('pooh_food_test')
                
            if not honey_pot_fail:

                #to get here means user has passed recaptcha/smtp limits.  yes, they could be exceeded by the time we 
                # get here but its more important to know that their message went through and we allow a little "overage"
                #it would be cruel to give client a form to fill out and then reject them for slight overage on limits

                #Send off token to google recaptcha
                recaptcha_str = self.request.POST.get('g_recaptcha_response')
                if recaptcha_str is not None:
                    #cant do this on the client since server is the only onw with secret key
                    secret_key = settings.RECAPTCHA_SECRET_KEY
                    payload = {
                        'response': recaptcha_str,
                        'secret': secret_key}
                    data = urllib.parse.urlencode(payload).encode()
                    req = urllib.request.Request('https://www.google.com/recaptcha/api/siteverify', data=data)
                    response = urllib.request.urlopen(req)
                    result = json.loads(response.read().decode())
                    #sending the second encrypted verify request to recaptcha counts toward max monthly total, log this
                    num_recapcha_sent = 1
                    #take action on robot test results.  we can get success but if score is low, we get action=verify
                    #asking us to use another way to verify the user.  We don't do that at this time, we just reject low scores
                    if (result['success']):
                        botTestDone = True
                        if (result['action'] == 'ContactUsForm'):
                            if (result['score'] < 0.25):
                                quartile = '1Q'
                            elif (result['score'] < 0.5): 
                                quartile = '2Q'
                            elif (result['score'] < 0.75):
                                quartile = '3Q'
                            else:
                                quartile = '4Q'
                        
                        elif (result['action'] == 'verify'):
                            #this means bot was smart enough not to hit honeypot but we had to send recaptcha to find out its a bot
                            print(f"ROBOT ALERT:  reCAPTCHA is asking for further verification of low score")
                            #which we choose to reject at this time
                        else:
                            # perhaps an old token was sent or bot wrote junk into recaptcha values??  reject client
                            print(f"ERROR:  bad recaptcha token returned, raw result was {result}")
                    else:
                        print(f"ERROR:  failed recaptcha token, raw result was {result}")
                    
                    print('FYI: gRecaptcha sent, results on quartile is ' + quartile)
                else:
                    #we didnt get initial response on recaptcha
                    print(f"SW ERROR: did not get a string on initial recaptcha response ")

            else:
                #no need for recaptcha, honeypot test failed.
                botTestDone = True
                print(f"ROBOT ALERT: You failed the Pooh bear test, you checked an invisible honey pot")
            
            if ('4Q' == quartile):
                testHasPassed = True
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

                try:
                    #the minute you use your sendTo address to log into smtp server, that becomes the "from" addr anyway
                    #as of Apr2025, you can send 500 emails per day for free using smtp service
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
                    print(f'ERROR: Contact page email Exception is {emsg}')
                    
                if num_email_sent == 0:
                    #user has injected newlines and message rejected, could be bot?, or gmail rejects us.  Check log.  Inform user of failure
                    testHasPassed = False 
                    print(f'ERROR: No email was sent from {nameOfContact}') 

            else:
                #Count these up in the server log and just above this, will have reason
                print('ROBOT DETECTED: Bot test FAILED, see above robot alert for details')
                
            # increment accesses for next contact me user
            numEmail= currAccesses.numTimesSmtpAccessedPerMonth
            currAccesses.numTimesSmtpAccessedPerMonth = numEmail + num_email_sent
            numRecap = currAccesses.numTimesRecaptchaAccessedPerMonth
            currAccesses.numTimesRecaptchaAccessedPerMonth = numRecap + num_recapcha_sent
            currAccesses.save()
                
            #must use redirect to avoid a POST that will happen automatically when user refreshes
            #could not get keywords to be sent in a redirect, this is safe since if bot fakes this URL, 
            #they just get a false message and no submit button
            response = redirect(reverse('int_math:Contact_me') + f'?botTestPassed={testHasPassed}' )
            
        else: 
            #the only thing this form checks is email address errors if the user chooses to give one and makes user user puts something in msg
            returnForm=form    #return users form complete with their inputs and computed errors
            context_dict = {'page_tab_header': 'Contact Us',
                        'topic': None,
                        'allowContactEmail': True,
                        'form': returnForm,  
                        'basePage': getBaseContextEntry(request),
                        'botTestDone': False,
                        'botTestPassed': False
                        } 
            response = render(request, 'int_math/Contact_me.html', context=context_dict)
              
        return response                      

#**********************************************************
# functions used by page views. Will be a singleton that goes either locally or remotely
# and gathers the configuration file (updates daily as need be).  The configuration file tells
# where to find files needed to populate the website (both code, images, mp3, mp4 etc)
#**********************************************************
class ConfigMapper:
    _instance = None
    _last_updated = None
    _configMapDict = dict()
    _getFromCloud = False

    # we only want one instance of ConfigMapper, we update the mapper only if "stale"
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            # Create the new instance if it doesn't exist
            cls._instance = super().__new__(cls)
            # this will not change once deployed
            getFromCloud_str = os.environ.get('USE_CLOUD_BUCKET')
            if getFromCloud_str.lower() == 'true':
                self._getFromCloud = True
        # Always return the stored instance
        return cls._instance
    
    def loadConfigMapper(self, request):
        fileLoc = getFullFileURL('Configuration/binaryfilenamesforsite-portion1-rev-a.json', False, request)
        if self._getFromCloud:
            try:
                response = requests.get(fileLoc)
                # Check if the request was successful (status code 200)
                if response.status_code == 200:
                    file_content = response.text  
                    self.configMapDict = json.load(file_content)
                    print(f'file content test is {file_content}')
                else:
                    print(f"Failed to retrieve file. Status code: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"An error occurred: {e}")
        else:
            # we are on localhost or in dev environment under test mode.  Not for deployment
            fileLoc = os.path.join(os.path.dirname(__file__), '..', 'static', 'static_binaries', 'Configuration', 'binaryfilenamesforsite-portion1-rev-a.json')
            try:
                fileObj = open(fileLoc, 'rt')
                self._configMapDict = json.load(fileObj)
                fileObj.close()
            except FileNotFoundError:
                print(f'SW ERROR:  File {fileLoc} was not found')
            except Exception as ex:
                template = "An exception of type {0} occurred. Arguments:\n{1!r}"
                emsg = template.format(type(ex).__name__, ex.args)
                print(f'SW ERROR:  {emsg} in opening file {fileLoc}')
            
            
    def __init__(self, request):
        if len(self._configMapDict) == 0:
            self.loadConfigMapper(request)
        elif self._last_updated and (datetime.datetime.now() - self._last_updated) < datetime.timedelta(days=1):
            #if data is obsolete, need to reload it, really shouldn't change but could
            print('Config mapper is old, reading file anew')
            self.loadConfigMapper(request)
    
            
    def readConfigMapper(self, genericFileName):
        actualFile = "none"
        if len(self._configMapDict) > 0:
            actualFile = self._configMapDict.get(genericFileName)
            #print(f' we just mapped {genericFileName} to {actualFile}')
        else:
            print(f'SW ERROR:  file mapper not found or error opening')
        return actualFile
            
#**********************************************************
# these are all page views
#**********************************************************
class IndexView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        # add help to user based on device/browser
        ua_string = request.META['HTTP_USER_AGENT'];
        user_agent = parse(ua_string)
        usingSafari = False;
        if 'safari' in user_agent.browser.family.lower(): 
            usingSafari = True;
        isMobile = user_agent.is_mobile;
        configMap = ConfigMapper(request)
        realFileLandLogo = configMap.readConfigMapper("LandingPageLogo")

        #check if there is an upcoming upgrade planned to site and notify users
        upgrdSchedFile = os.path.join(os.path.dirname(__file__), '..', 'InteractiveMath_prj', 'UpgradeSchedule.txt')
        upgradeNoticePresent = False
        upgradeDate = ""
        upgradeDay = ""
        upgradeTime = ''
        upgradingNow = False
        if os.path.isfile(upgrdSchedFile):
            upgd = open(upgrdSchedFile, 'r')
            #ignore first line of file, its comment to user
            comment = upgd.readline()  
            dateTimeUpgdStr = upgd.readline().rstrip('\n')
            #we want exact date and time for user message but only need date, not time, to decide if it should be displayed
            dateTime_format = '%Y-%m-%d-%H %z'
            dateTimeUpgd = None
            try:
                dateTimeUpgd = datetime.datetime.strptime(dateTimeUpgdStr, dateTime_format)
            except Exception as ex:
                template = "An exception of type {0} occurred. Arguments:\n{1!r}"
                emsg = template.format(type(ex).__name__, ex.args)
                print(f'SW ERROR: in obtaining date Exception is {emsg}')
                print(f'SW ERROR: Failure on parsing time in UpgradeSchedule.txt, cannot parse {repr(dateTimeUpgdStr)}')
            if (dateTimeUpgd is not None):               
                # get time right now and convert to EST (from UTC).  
                tz = timezone('EST')
                dateNow = datetime.datetime.now(tz)                
                daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                dayUpgdNum = dateTimeUpgd.weekday()
                dayUpgd = daysOfWeek[dayUpgdNum]
                #if update time has passed but day is today, show the message.
                #WHEN US is on daylight savings time, the upgradeNow will be an hour late.
                if (dateTimeUpgd.date() >= dateNow.date()):  #else, if its more than a day old, wipe it, want message for full day of upgrade, even after upgrade begins
                    if ( (dateTimeUpgd.date() == dateNow.date()) and (dateTimeUpgd.time() < dateNow.time()) ):
                        #happening now, give user notice
                        upgradingNow = True
                    else:
                        #happening in future, let them know when
                        upgradeNoticePresent = True
                        upgradeDate = dateTimeUpgd.date
                        upgradeTime = dateTimeUpgd.time
                        upgradeDay = dayUpgd
                #print(f"Reading upgd schedule, date is {dateTimeUpgd.date()} , time is {dateTimeUpgd.time()} and right now is date {dateNow.date()} and time {dateNow.time()}")
            upgd.close()

        context_dict = {
                        'basePage': getBaseContextEntry(request),
                        'page_tab_header': 'Home',
                        'topic': None,
                        'using_safari': usingSafari,
                        'is_mobile': isMobile,
                        'upgradeNoticePresent': upgradeNoticePresent,
                        'upgradeDay': upgradeDay,
                        'upgradeDate': upgradeDate,
                        'upgradeTime': upgradeTime,
                        'upgradeNow': upgradingNow,
                        #This is signed URL to existing html files to go to Static buckets
                        'LandPageCSS': getFullFileURL('css/LandingPage.css', True, request),
                        'landingPageLogo': getFullFileURL(realFileLandLogo, False, request),
                        'LandPageJS': getFullFileURL('js/LandingPage.js', True, request),
                        }       
        response = render(request, 'int_math/index.html', context=context_dict)       
        return response
#****************************************************************************************
#  Trig functions section
#****************************************************************************************
# page 1 General Concepts Intro of trig function section
class MusicTrigConceptIntroView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        trigMap = ConfigMapper(request)
        realFileIntroVideo = trigMap.readConfigMapper("IntroToFrequencyVideo_html")
        realFileCartoonGIF = trigMap.readConfigMapper("CartoonIntroGIF")
        realFileCartoonTrig = trigMap.readConfigMapper("CartoonIntroTrig")
        print(f'file intro video {realFileIntroVideo} and URL is {getFullFileURL(realFileIntroVideo, False, request)}')
        realFileIntroAudio = trigMap.readConfigMapper("TrigReviewIntroAudio")
        artistCredit = trigMap.readConfigMapper('ArtistCredits')
        context_dict = {'basePage': getBaseContextEntry(request),
                        'page_tab_header': 'IntroConcepts',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'introToFreqVideo': getFullFileURL(realFileIntroVideo, False, request),
                        'cartoonIntroGIF': getFullFileURL(realFileCartoonGIF, False, request),
                        'cartoonIntroTrig': getFullFileURL(realFileCartoonTrig, False, request),
                        'trigReviewIntroAudio': getFullFileURL(realFileIntroAudio, False, request),
                        "artistCredit": artistCredit[0],
                        'TrigIntroMusicCSS': getFullFileURL('css/IntroTrigMusicConcepts.css', True, request),
                        'TrigIntroMusicJS': getFullFileURL('js/IntroTrigMusicConcepts.js', True, request),
                        }
        response = render(request, 'int_math/IntroTrigMusicConcepts.html', context=context_dict)
        return response
# page 2 Music Sine Intro of trig function section   
class MusicTrigView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'MusicalTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'basePage': getBaseContextEntry(request),
                        'MusicSineIntroCSS': getFullFileURL('css/Pg2MusicSineIntro.css', True, request),
                        'MusicSineIntroJS': getFullFileURL('js/Pg2MusicSineIntro.js', True, request),
                        'ColorfulClefSVG': getFullFileURL('images/Prismatic-Clef-Hearts-2.svg', True, request),
                        'WholeNoteSVG': getFullFileURL('images/WholeNote.svg', True, request),
                        'VolumeSVG': getFullFileURL('images/volume.svg', True, request),
                        }
        response = render(request, 'int_math/Pg2MusicSineIntro.html', context=context_dict)
        return response
# page 3 Where does sine/cosine come from? of trig function section       
class StaticTrigView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'StaticTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'basePage': getBaseContextEntry(request),
                        'StaticTrigCSS': getFullFileURL('css/StaticTrig.css', True, request),
                        'StaticTrigJS': getFullFileURL('js/StaticTrig.js', True, request),
                        'ExplnQ2SVG': getFullFileURL('images/StaticTrigQ2.svg', True, request),
                        'ExplnQ3SVG': getFullFileURL('images/StaticTrigQ3.svg', True, request),
                        'ExplnQ4SVG': getFullFileURL('images/StaticTrigQ4.svg', True, request),
                        }
        response = render(request, 'int_math/StaticTrig.html', context=context_dict)
        return response
# page 4 Lets add time and make frequency of trig function section     
class DynamicTrig1View(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'DynamicTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'basePage': getBaseContextEntry(request),
                        'DynTrig1CSS': getFullFileURL('css/DynamicTrig1.css', True, request),
                        'DynTrig1JS': getFullFileURL('js/DynamicTrig1.js', True, request),
                        }
        response = render(request, 'int_math/DynamicTrig1.html', context=context_dict)
        return response
    
# page 5 Lets go faster in time of trig function section
class DynamicTrig2View(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        textMap = ConfigMapper(request)
        artistCredit = textMap.readConfigMapper('ArtistCredits')
        context_dict = {
                        'page_tab_header': 'DynamicTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'basePage': getBaseContextEntry(request),
                        'artistCredit': artistCredit[3],
                        'DynTrig2CSS': getFullFileURL('css/DynamicTrig2.css', True, request),
                        'DynTrig2JS': getFullFileURL('js/DynamicTrig2.js', True, request),
                        }
        response = render(request, 'int_math/DynamicTrig2.html', context=context_dict)
        return response
# page 6 Lets get into audible sin/cosine tones of trig function section
class ToneTrigView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        textMap = ConfigMapper(request)
        artistCredit = textMap.readConfigMapper('ArtistCredits')
        context_dict = {
                        'page_tab_header': 'ToneTrig',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'basePage': getBaseContextEntry(request),
                        'artistCredit': artistCredit[3],
                        'ToneTrigCSS': getFullFileURL('css/ToneTrig.css', True, request),
                        'ToneTrigJS': getFullFileURL('js/ToneTrig.js', True, request),
                        'VolumeOffSVG': getFullFileURL('images/volume-off.svg', True, request)
                        }
        response = render(request, 'int_math/ToneTrig.html', context=context_dict)
        return response

# page 7 Lets compare musical instruments to sine/cosine of same pitch of trig function section   
class MusicNotesTrigView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        textMap = ConfigMapper(request)
        artistCredit = textMap.readConfigMapper('ArtistCredits')
        context_dict = {
                        'page_tab_header': 'MusicNotes',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'basePage': getBaseContextEntry(request),
                        'artistCredit': artistCredit[2],
                        'MusicNotesTrigCSS': getFullFileURL('css/MusicNotesTrig.css', True, request),
                        'MusicNotesTrigJS': getFullFileURL('js/MusicNotesTrig.js', True, request),
                        'VolumeOffSVG': getFullFileURL('images/volume-off.svg', True, request),
                        }
        response = render(request, 'int_math/MusicNotesTrig.html', context=context_dict)
        return response
    
# page 8 Lets summarize this all now of trig function section
class TrigSummaryView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        trigMap = ConfigMapper(request)
        actualFilename = trigMap.readConfigMapper("MusicSummaryVideo")
        realFileCartoonTrig = trigMap.readConfigMapper("CartoonIntroTrig")
        artistCredit = trigMap.readConfigMapper('ArtistCredits')
        context_dict = {
                        'page_tab_header': 'Summary',
                        'topic': Topic.objects.get(name="TrigFunct"),
                        'basePage': getBaseContextEntry(request),
                        'musicSummaryVideo': static(actualFilename),
                        'cartoonIntroTrig': static(realFileCartoonTrig),
                        'artistCredit': artistCredit[1],
                        'TrigSummaryCss': getFullFileURL('css/MusicSineSummary.css', True, request),
                        'TrigSummaryJS': getFullFileURL('js/MusicSineSummary.js', True, request),
                        }
        response = render(request, 'int_math/MusicSineSummary.html', context=context_dict)
        return response
#****************************************************************************************
#  END OF Trig functions section
#****************************************************************************************    
class ImagNumView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'Imag_num',
                        'topic': Topic.objects.get(name="Imag_num"),
                        'basePage': getBaseContextEntry(request),
                        }        
        response = render(request, 'int_math/imag_num.html', context=context_dict)
        return response

class TeacherStandardsView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'Teachers',
                        'topic': None,
                        'basePage': getBaseContextEntry(request),
                        }        
        response = render(request, 'int_math/TeacherStds.html', context=context_dict)
        return response
         
class PeopleView(View):
    # give user all the info I collect about them
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'People',
                        'topic': Topic.objects.get(name="Thanks"),
                        'basePage': getBaseContextEntry(request),
                        }
        return render(request, 'int_math/acknowledgements.html', context=context_dict)

class AckView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
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
        trigMap = ConfigMapper(request)
        ty_list = trigMap.readConfigMapper("Thankyou_list")
        #go through the list of contributors and "write" the code out to page
        contributorString = ""
        for contributor in ty_list:
            contributorString += OPENER + A_Begin + contributor["url"] + A_End + Img1 + getFullFileURL(contributor["logo"], False, request) + Img2 + A_Close
            contributorString += A_Begin + contributor["url"] + A_End + H2_1 + contributor["line1"] + H2_2 + A_Close
            contributorString += A_Begin + contributor["url"] + A_End + H3_1 + contributor["line2"] + H3_2 + A_Close + CLOSER
            print(f'base logo is {contributor["logo"]}')
        context_dict = {
                        'page_tab_header': 'Thank You!',
                        'topic': Topic.objects.get(name="Thanks"),
                        'basePage': getBaseContextEntry(request),
                        'Contributors': contributorString,
                        'AckCSS':getFullFileURL('css/Acknowledgements.css', True, request),
                        }
        response = render(request, 'int_math/acknowledgements.html', context=context_dict)
        return response        
 
class TrigIDView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'Trig ID',
                        'topic': Topic.objects.get(name="TrigIdent"),
                        'basePage': getBaseContextEntry(request),
                        }
        response = render(request, 'int_math/TrigIdentity.html', context=context_dict)
        return response     
   
class TrigIDTuneView(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'Inst Tune',
                        'topic': Topic.objects.get(name="TrigIdent"),
                        'basePage': getBaseContextEntry(request),
                        }
        response = render(request, 'int_math/TrigIdent_Tune.html', context=context_dict)
        return response 

     
class Legal_TermsOfUse(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        configMap = ConfigMapper(request)
        actualFilename = configMap.readConfigMapper("Legal_TermsCond")
        context_dict = {
                        'page_tab_header': 'Terms Of Use',
                        'topic': Topic.objects.get(name="Legal"),
                        'basePage': getBaseContextEntry(request),
                        'legalDocTerms': static(actualFilename) + "#toolbar=0",
                       }  
        response = render(request, 'int_math/TermsOfUse.html', context=context_dict)
        return response

class Legal_Privacy(View):
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        configMap = ConfigMapper(request)
        actualFilename = configMap.readConfigMapper("Legal_Privacy")
        context_dict = {
                        'page_tab_header': 'Privacy Policy',
                        'topic': Topic.objects.get(name="Legal"),
                        'basePage': getBaseContextEntry(request),
                        'legalDocPriv': static(actualFilename) + "#toolbar=0",
                       }  
        response = render(request, 'int_math/Privacy.html', context=context_dict)
        return response

class ContactMe(View):
    #when user fills out contact form, will trigger ProcessContactPage(View): action above
    @method_decorator(cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0))   #cache nothing--max server access   
    def get(self, request):
        
        #did we get here on a redirect? if so, update parameters
        botTestDone = False
        botTestPassed = False
        param1 = request.GET.get('botTestPassed')
        if param1:
            if (param1 == "True"):
                botTestPassed = True;
            botTestDone = True;  #whether test passed or not, we are here by redirect and bot test was done
        
        ####################
        #dont want to bombard reCaptcha with requests (else we get charged over 10k), limit number of accesses to reasonable amount.
        #Expect in future to be charged if I exceed a number of smtp access of gmail account so set that limit as well.
        allowContact = False;  #assume all limits have been exceeded until proven otherwise
        tz = timezone('EST')
        dateNow = datetime.datetime.now(tz)  
        try: 
            #careful, every time you populate DB, you add new entry and best may be last--regen DB every time
            #ideally there is only one entry for contact accesses
            currAccesses = ContactAccesses.objects.first()
        except:
            #will put up the dont contact us page.  Should never happen.  coding error
            print(f'DATABASE ERROR in contact page, entry not found keeping track of recaptcha/smtp. Clients cannot contact us')
        if (currAccesses):
            print(f' FYI: NumRecaptcha this month is {currAccesses.numTimesRecaptchaAccessedPerMonth}, numSMTP this month is {currAccesses.numTimesSmtpAccessedPerMonth}')
            print(f' FYI: Month of update is  {currAccesses.monthLastUpdated}.  Num clients denied is {currAccesses.numClientsDeniedPerMonth}')
            print(f' FYI: current date is {dateNow}, current month is {dateNow.month}')   
            if (dateNow.month != currAccesses.monthLastUpdated):
                #were any clients denied access?  if so, send server error and email me
                if (currAccesses.numClientsDeniedPerMonth > 0):
                    print(f'ACCESS ERROR, {currAccesses.numClientsDeniedPerMonth} clients were denied last month')
                    print(f'{currAccesses.numTimesRecaptchaAccessedPerMonth} reCAPTCHA requests were sent and {currAccesses.numTimesSmtpAccessedPerMonth} smtp mail messages were sent')
                    # Now send email to website designer to fix.  This should never happen. we only send email max of 1/month
                    subjectOfContact = "SERVER ERROR: USERS denied contact access"
                    messageEscaped = str(currAccesses.numClientsDeniedPerMonth) + \
                        " users have been denied access to contact page for the month of " + str(currAccesses.monthLastUpdated) + \
                        ".  There were " + str(currAccesses.numTimesRecaptchaAccessedPerMonth) + " reCaptcha accesses that month "\
                        " and " + str(currAccesses.numTimesSmtpAccessedPerMonth) + " SMTP accesses that month.  The max number of recaptchas allowed per month is " \
                        + str(MAX_FREE_RECAPTCHA) + " and the max num SMTP accesses is " + str(MAX_NUM_EMAIL_PER_MONTH)
                    sendToEmailAddr = settings.EMAIL_HOST_USER
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
                        print(f'SW ERROR: Sending Server Error email Exception is {emsg}')
                        
                    if num_email_sent == 0:
                        print(f'SW ERROR: Failed attempt to notify website designer via email of user contact page denials') 
                          
                #time to reset all the stats for new month, cant do update unless we filter() instead of get()
                currAccesses.monthLastUpdated = dateNow.month
                currAccesses.numTimesRecaptchaAccessedPerMonth = 0
                currAccesses.numTimesSmtpAccessedPerMonth = 0
                currAccesses.numClientsDeniedPerMonth = 0
                currAccesses.save()
                allowContact = True
            else:
                if (currAccesses.numTimesRecaptchaAccessedPerMonth < MAX_FREE_RECAPTCHA):
                    if (currAccesses.numTimesSmtpAccessedPerMonth < MAX_NUM_EMAIL_PER_MONTH):
                        allowContact = True
                if (not allowContact):                    
                #otherwise, client is not allowed to use contact form until next month, to keep Google cloud expenses at zero
                #keep track of clients denied, ideally, this should be zero
                    currAccesses.numClientsDeniedPerMonth = currAccesses.numClientsDeniedPerMonth + 1
                    currAccesses.save()
                    print(f'ALLOCATION EXCEEDED: ABOVE ALLOTED Contact max, allow {MAX_FREE_RECAPTCHA} MAX recaptcha requests and {MAX_NUM_EMAIL_PER_MONTH} MAX email sends')
                    print(f'But we have {currAccesses.numTimesRecaptchaAccessedPerMonth} reCAPTCHA requests sent and {currAccesses.numTimesSmtpAccessedPerMonth} smtp mail messages were sent')
                
        context_dict = {
                        'page_tab_header': 'Contact Us',
                        'topic': None,
                        'allowContactEmail': allowContact,
                        'ContactCSS': getFullFileURL('css/Contact_me.css', True, request),
                        'ContactJS': getFullFileURL('js/Contact_me.js', True, request),
                        'form': contactForm(),
                        'basePage': getBaseContextEntry(request),
                        'botTestDone': botTestDone,
                        'botTestPassed': botTestPassed
                       } 
        response = render(request, 'int_math/Contact_me.html', context=context_dict)
        return response
