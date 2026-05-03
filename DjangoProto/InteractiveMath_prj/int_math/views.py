from django.shortcuts import render, redirect
from django.views import View
from django.views.generic import TemplateView
from django.urls import reverse
from django.apps import apps
from django.db.models import F
from django.db import transaction
from django.utils import timezone # Better than datetime.now
from int_math.models import Topic
from django.utils.http import urlencode
from pathlib import Path
from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse, FileResponse, Http404
from django.shortcuts import get_object_or_404
from user_agents import parse
import urllib.request
import json
from zoneinfo import ZoneInfo
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
from csp.decorators import csp_update  # to limit the youtube security issues to specific pages
# homegrown stuff
from int_math.forms import contactForm
from int_math.models import ContactAccesses
# to generate signed URLs
import hashlib
import time
import uuid
import logging
import datetime




#**********************************************************
# These are actions that will require significant server time in recaptcha and smtp calls
#**********************************************************  
MAX_FREE_RECAPTCHA = 5000  #as of 3/2025, google allows 10k for free/month
MAX_NUM_EMAIL_PER_MONTH = 100   # I don't want more than this in my inbox, dammit!
logger = logging.getLogger(__name__)

def generateSignedURL4Bucket(filename, usePubDomainBucket, expiration_seconds=3600):
    """
    Generates a custom Cloudflare Worker-compatible signed URL.
    """
    sign_url_secret_code = ""
    cloud_bucket_url = ""
    if usePubDomainBucket: 
        sign_url_secret_code = settings.SIGN_URL_SECRET_CODE 
        cloud_bucket_url = str(settings.CLOUD_URL_CODE)
        if not sign_url_secret_code:
            raise ValueError("SIGN_URL_SECRET_CODE env variable secret key is not set.")
    else:
        sign_url_secret_code = settings.SIGN_URL_SECRET_BIN 
        cloud_bucket_url = str(settings.CLOUD_URL_BINARY)  
        if not sign_url_secret_code:
            raise ValueError("SIGN_URL_SECRET_BIN secret key is not set.")
            
    # Generate a unique ID, required by your worker's logic
    unique_id = str(uuid.uuid4())
    expires_at = int(time.time()) + expiration_seconds
    
    signature_data = f"{sign_url_secret_code}:{filename}:{unique_id}:{expires_at}"
    signature = hashlib.sha256(signature_data.encode()).hexdigest()

    # Match the URL format your Worker expects
    signed_url = cloud_bucket_url + f"/{filename}?expires={expires_at}&sig={signature}&id={unique_id}"
    #print(f' signed (either code/binary) url is {signed_url}')
    return signed_url

  
def getFullFileURL(filename, usePubDomainBucket, request):
    if not filename: 
        logger.error(f'SW ERROR: Failed filename mapping in getFullFileURL')
        return None
    
    urlStaticSrc = ""
    localURLbase = str(request.build_absolute_uri('/'))
    
    #Check for intermediate test mode where code is local (html is always local) but binaries are either local or cloud
    use_local = settings.USE_LOCAL_CODE.lower() == 'true'
    if use_local and filename.endswith((".css", ".js")):
        logger.info("All JS and CSS will be served locally for intermediate testing")
        return f"{localURLbase}static/{filename}"

    useCloud = settings.USE_CLOUD_BUCKET.lower() == 'true'
    if  useCloud:
        #this cannot be tested from localhost due to security concerns with whitelisting localhost
        urlStaticSrc = generateSignedURL4Bucket(filename, usePubDomainBucket)
        #print(f'REMOTE code:  url will be {urlStaticSrc}')   
        return urlStaticSrc         
   
    # use local copy of file.  This is expected to be used for initial testing only, not for deployment
    #only used in localhost and (maybe) dev pythonanywhere account
    sub_path = "static/" if usePubDomainBucket else "static/static_binaries/"
    urlStaticSrc = f"{localURLbase}{sub_path}{filename}"

    return urlStaticSrc

def getBaseContextEntry(request):
    #This sets up all the params for the base page used to template html docs
    configMap = ConfigMapper()
    companyName = configMap.readConfigMapper("CompanyName")
    g_analyticsID = configMap.readConfigMapper('GoogleAnalID')
    baseKVcontext = {'CompanyName': companyName, 
                     'GoogleAnalID': g_analyticsID, 
                     'recaptchaPublicKey':settings.RECAP_PUBLIC_KEY,
                     'FavIco': getFullFileURL('NonPublicImages/favicon.ico', False, request),
                     'JQlocalJS': getFullFileURL('js-lib/jquery-371min.js', True, request),
                     'AutoDemoJS': getFullFileURL('js/autoDemo.js', True, request),
                     }
    
    return baseKVcontext

class ProcessContactPage(View):
    template_name = 'int_math/Contact_me.html'
    form_class = contactForm
    @method_decorator(never_cache)
    def post(self, request):  
        # check the form validity for basic stuff first
        form = self.form_class(request.POST) 
        botTestDone = False
        testHasPassed = False
        num_email_sent = 0
        num_recapcha_sent = 0
        quartile = '1Q'
        # increment accesses for next contact me user
        currAccesses = ContactAccesses.objects.first()
        if not currAccesses:
            # CrashPrevent: Create one if it doesn't exist
            currAccesses = ContactAccesses.objects.create() 
        if form.is_valid():
            # this only checks the format of the email, all other inputs are valid, we escape all text
            #however, email is optional so a blank is ok
            
            #did a bot see the token empty box and try to fill it in? (honeypot test), value will be string
            honey_pot_fail = request.POST.get('pooh_food_test', '').lower() == 'true'
                
            if honey_pot_fail:
                #no need for recaptcha, honeypot test failed.
                botTestDone = True
                logger.info("Bot Blocked: Failed honeypot ('pooh_food_test' was filled).")
            else:

                #to get here means user has passed recaptcha/smtp limits.  yes, they could be exceeded by the time we 
                # get here but its more important to know that their message went through and we allow a little "overage"
                #it would be cruel to give client a form to fill out and then reject them for slight overage on limits

                #Send off token to google recaptcha
                recaptcha_str = request.POST.get('g_recaptcha_response')
                if not recaptcha_str:
                    # MISSING TOKEN: Likely a bot script skipping JS.
                    logger.info("Bot Blocked: No reCAPTCHA token provided in request.")
                else:
                    #cant do this on the client since server is the only onw with secret key
                    secret_key = settings.RECAPTCHA_SECRET_KEY
                    payload = {
                        'response': recaptcha_str,
                        'secret': secret_key,
                        'remoteip': request.META.get('REMOTE_ADDR')} # send IP to help recaptcha identify bots
                    try:
                        data = urllib.parse.urlencode(payload).encode()
                        #urllib.request is fine for sync views, ensure timeout=5 remains to prevent slow recaptcha from hanging wsgi worker
                        req = urllib.request.Request('https://www.google.com/recaptcha/api/siteverify', data=data)
                        # Add a timeout (e.g., 5 seconds) so your app doesn't hang forever
                        with urllib.request.urlopen(req, timeout=5) as response:
                            result = json.loads(response.read().decode())
    
                        #sending the second encrypted verify request to recaptcha counts toward max monthly total, log this
                        num_recapcha_sent = 1
                        #take action on robot test results.  we can get success but if score is low, we get action=verify
                        #asking us to use another way to verify the user.  We don't do that at this time, we just reject low scores
                        if (result['success']):
                            botTestDone = True
                            score = result.get('score',0)
                            action = result.get('action','')
                            logger.info(f"Processing Recaptcha: User returns score of  ({score}) for action '{action}'.")
                            if (action == 'ContactUsForm'):
                                if (score < 0.25):
                                    quartile = '1Q'
                                elif (score < 0.5): 
                                    quartile = '2Q'
                                elif (score < 0.75):
                                    quartile = '3Q'
                                else:
                                    quartile = '4Q'
                            
                            elif (action == 'verify'):
                                #this means bot was smart enough not to hit honeypot but we had to send recaptcha to find out its a bot
                                logger.info(f"ROBOT ALERT:  reCAPTCHA is asking for further verification of low score")
                                #which we choose to reject at this time
                                quartile = '1Q' # Explicitly keep it at 1Q to reject
                            else:
                                # perhaps an old token was sent or bot wrote junk into recaptcha values??  reject client
                                logger.info(f"ERROR:  bad recaptcha token returned, raw result was {result.get('error-codes')}")
                        else:
                            # INVALID TOKEN: Clumsy bot or expired token.
                            # LEVEL: WARNING (Could be a slow human with an expired session)
                            errors = result.get('error-codes', [])
                            logger.warning(f"reCAPTCHA Rejected: {errors}. Likely clumsy bot or expired session.")
                        
                        logger.info('FYI: gRecaptcha sent, results on quartile is ' + quartile)
                    except (urllib.error.URLError, TimeoutError) as e:
                        # SYSTEM ERROR: Google is down or your code broke.
                        # LEVEL: ERROR (You need to know if your API integration is failing)
                        logger.error(f"reCAPTCHA System Error: Could not verify token due to {type(e).__name__}: {e}")
                        botTestDone = True
                        # OR let possible human pass since they already passed the Honeypot test.
                        quartile = '4Q' # "Fail-Open" strategy
                    except Exception as e:
                        logger.error(f"reCAPTCHA System Error: Fix SW error {type(e).__name__}: {e}")
            
            if ('4Q' == quartile):
                logger.info(f"Human Verified: 4Q score. Proceeding to email.")
                testHasPassed = True
                #get the email, name and message and ensure no html injection.  cleaned_data does that instead of escape()
                nameOfContact = form.cleaned_data.get('name')
                if nameOfContact == "":
                    nameOfContact = "anonymous"
                subjectOfContact = form.cleaned_data.get('subject')
                returnAddrEscaped = form.cleaned_data.get('email')
                if returnAddrEscaped == "":
                    returnAddrEscaped = "noemailaddr@nomail.com"
                messageEscaped = form.cleaned_data.get('message') 
                messageEscaped += " --From website user: " + nameOfContact + ".  At email addr: " + returnAddrEscaped
                sendToEmailAddr = settings.EMAIL_HOST_USER

                # Configuration for retries
                MAX_RETRIES = 3
                RETRY_DELAY = 2  # Seconds to wait between attempts
                
                # Initialize to 0 so the variable exists even if the loop fails immediately
                num_email_sent = 0
                for attempt in range(MAX_RETRIES):
                    try:
                        #the minute you use your sendTo address to log into smtp server, that becomes the "from" addr anyway
                        #as of Apr2025, you can send 500 emails per day for free using smtp service
                        # Note: fail_silently=False allows us to catch the exception in our try block
                        num_email_sent = send_mail(
                            subjectOfContact,
                            messageEscaped,
                            sendToEmailAddr,
                            [sendToEmailAddr],
                            fail_silently=False,
                        ) 
                        # If we reach here, it succeeded
                        break 
                
                    except OSError as ex:
                        # Specifically catch the network unreachable error to retry
                        if (101 in ex.args or 'Network is unreachable' in str(ex)) and attempt < MAX_RETRIES - 1:
                            logger.warning(f"Network unreachable. Retrying ({attempt + 1}/{MAX_RETRIES})...")
                            time.sleep(RETRY_DELAY)
                            continue
                        logger.error(f"Final network failure after {MAX_RETRIES} attempts: {ex}")
                        break
                
                    except Exception as ex:
                        # For other errors (Auth, BadHeader, etc.), don't retry, just log it.
                        # Catches HeaderInjection, Auth failures, etc.
                        logger.error(f"Email failure: {type(ex).__name__} - {ex}")
                        break
                      
                if num_email_sent == 0:
                    #user has injected newlines and message rejected, could be bot?, or gmail rejects us.  Check log.  Inform user of failure
                    testHasPassed = False 
                    logger.error(f"Outcome: No email sent for {nameOfContact}. Check SMTP/Auth settings.") 

            else:
                #Count these up in the server log and just above this, will have reason
                logger.info(f"Bot Blocked: Low reCAPTCHA score {quartile}.  Process terminating")

                
            # increment accesses for next contact me user, do so atomically, better than fetch-modify-save
            ContactAccesses.objects.filter(pk=currAccesses.pk).update(
                numTimesSmtpAccessedPerMonth=F('numTimesSmtpAccessedPerMonth') + num_email_sent,
                numTimesRecaptchaAccessedPerMonth=F('numTimesRecaptchaAccessedPerMonth') + num_recapcha_sent
            )

            #if need to see currAccesses again, do a currAccesses.refresh_from_db(
                
            #must use redirect to avoid a POST that will happen automatically when user refreshes
            #could not get keywords to be sent in a redirect, this is safe since if bot changes this URL param, 
            #they just get a false message and no submit button
            base_url = reverse('int_math:Contact_me')
            query_string = urlencode({'botTestPassed': testHasPassed})
            return redirect(f'{base_url}?{query_string}')

        else: 
            #the only thing this form checks is email address errors if the user chooses to give one and makes user user puts something in msg
            context_dict = {'page_tab_header': 'Contact Us',
                        'topic': None,
                        'allowContactEmail': True,
                        'ContactCSS': getFullFileURL('css/Contact_me.css', True, request),
                        'ContactJS': getFullFileURL('js/Contact_me.js', True, request),
                        'form': form,  
                        'basePage': getBaseContextEntry(request),
                        'botTestDone': False,
                        'botTestPassed': False
                        } 
            response = render(request, 'int_math/Contact_me.html', context=context_dict)
              
        return response                      

#**********************************************************
# functions used by page views. Will be a singleton that goes locally
# and gathers the configuration file (loaded up once per wsgi launch).  The configuration file tells
# where to find files needed to populate the website (both code, images, mp3, mp4 etc)
#**********************************************************
class ConfigMapper:
    def __init__(self):
        # Simply point to the dictionary already loaded in apps.py
        self._configMapDict = apps.get_app_config('int_math').config_map

    def readConfigMapper(self, genericFileName):
        if not self._configMapDict:
            logger.error("SW ERROR: Config mapper dictionary is empty")
            return "none"
        return self._configMapDict.get(genericFileName, "none")


# Some files are needed on the fly, like autodemo voice MP3 explanations or musician notes.  Only server knows which
# config file to use and if file needed is on cloud, will add appropriate signed URL authorizations
class GetDynamicFilename(View):  
    def hasExtension(self, filename):
        return bool(Path(filename).suffix)

    def get(self, request):
        realDynFilename = request.GET.get('fileKey') or request.GET.get('fileName')
        if not self.hasExtension(realDynFilename):
            # we have a key only, use config file to look up the filename
            configMap = ConfigMapper()
            realDynFilename = configMap.readConfigMapper(realDynFilename)
        # now, either way, we have full filename, run with it
        getFromPublicRepo = False
        dynamicURL = getFullFileURL(realDynFilename, getFromPublicRepo, request) 
        if dynamicURL is None:
            return JsonResponse({'error': 'File not found'}, status=404)
        #print(f'will return to client a full filename of {dynamicURL}')    
        return JsonResponse({'url': dynamicURL})   
    
# client needs the configuration of the musical notes (filenames, notes, instruments etc).  Best to let Django serve it
# since could be test file set or "real" set
class GetMarchingBandTuningNoteAudioConfig(View):
    def get(self, request):
        use_deploy = getattr(settings, 'USE_CLOUD_BUCKET', 'False').lower() == 'true'
        config_dir = 'DeployConfig' if (use_deploy or settings.DEBUG) else 'TestConfig'
        
        # on localhost, dont use cloud files but rather the local versions of those files which will be uploaded to cloud once
        # tested
        # on test server, can use either local test files (which are not at all like real deployed binaries but are tiny) or cloud
        # here use local test files
        file_path = settings.BASE_DIR / 'ConfigFiles' / config_dir / 'filelistofmusicalinstrumentsplayingtuningnote.json'

        if not file_path.exists():
            raise Http404(f"Configuration file not found at {file_path}")

        # Open and return. Django 5.2 FileResponse handles this cleanly with file closing.
        file_handle = file_path.open('rb')
        return FileResponse(file_handle, content_type='application/json')

#**********************************************************
# these are all page views
#**********************************************************
class IndexView(View):
    @method_decorator(never_cache)
    def get(self, request):
        # add help to user based on device/browser, unknown is for bots/scrapers
        ua_string = request.headers.get('user-agent',"unknown");
        user_agent = parse(ua_string)
        usingSafari = False;
        if 'safari' in user_agent.browser.family.lower(): 
            usingSafari = True;
        isMobile = user_agent.is_mobile;
        configMap = ConfigMapper()
        realFileLandLogo = configMap.readConfigMapper("LandingPageLogo")

        #check if there is an upcoming upgrade planned to site and notify users
        upgrdSchedFile = settings.BASE_DIR / 'InteractiveMath_prj' / 'UpgradeSchedule.txt'
        upgradeNoticePresent = False
        upgradingNow = False
        upgradeDate = None
        upgradeTime = None

        if upgrdSchedFile.exists():
            try:
                with upgrdSchedFile.open('r') as upgd:
                    _ = upgd.readline()  # Skip comment
                    dateTimeUpgdStr = upgd.readline().rstrip('\n')
                    
                dateTime_format = '%Y-%m-%d-%H %z'
                dateTimeUpgd = datetime.datetime.strptime(dateTimeUpgdStr, dateTime_format)
            except Exception:
                logger.exception("SW ERROR: Failure obtaining or parsing upgrade date")
                dateTimeUpgd = None
            if dateTimeUpgd is not None:
                tz = ZoneInfo("America/New_York")
                dateNow = datetime.datetime.now(tz)
                
                # Ensure dateTimeUpgd is in the same timezone for comparison
                dateTimeUpgd = dateTimeUpgd.astimezone(tz)
            
                if dateTimeUpgd.date() >= dateNow.date():
                    if dateTimeUpgd.date() == dateNow.date() and dateTimeUpgd.time() < dateNow.time():
                        upgradingNow = True
                    else:
                        upgradeNoticePresent = True
                        # Add parentheses here to store the result, not the method
                        upgradeDate = dateTimeUpgd.date() 
                        upgradeTime = dateTimeUpgd.time()

        context_dict = {
                        'basePage': getBaseContextEntry(request),
                        'page_tab_header': 'Home',
                        'topic': None,
                        'using_safari': usingSafari,
                        'is_mobile': isMobile,
                        'upgradeNoticePresent': upgradeNoticePresent,
                        'upgradeDate': upgradeDate,
                        'upgradeTime': upgradeTime,
                        'upgradeNow': upgradingNow,
                        'homePage': True,
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
#create "base class" for trig function pages
# By applying this to 'dispatch', it automatically covers get() and post()
@method_decorator(never_cache, name='dispatch')
class BaseMathView(TemplateView):
    # Default values that child views can override
    topic_name = "TrigFunct" 
    page_tab_header = ""
    artist_credit_idx = None
    
    # Dictionary mapping {'Template_Variable_Name': 'path/to/file.ext'}
    public_static_files = {}

    #safe way to handle lists like artist credits in config file
    def get_array_item(self, configArray, index):
        if isinstance(configArray, list) and len(configArray) > index:
            return configArray[index]
        return ""

    def get_context_data(self, **kwargs):
        # 1. Get the baseline context dictionary provided by Django
        context = super().get_context_data(**kwargs)
        
        # 2. Add the standard math items
        context['page_tab_header'] = self.page_tab_header
        context['basePage'] = getBaseContextEntry(self.request)
        
        if self.topic_name:
            context['topic'] = get_object_or_404(Topic, name=self.topic_name)
            
        # 3. Automatically loop through and load all CSS/JS/SVGs!
        for context_key, file_path in self.public_static_files.items():
            # (Assuming these standard assets are all True for getFromPublicRepo)
            context[context_key] = getFullFileURL(file_path, True, self.request)
            
        # 4. Handle Artist Credits if an index was provided
        if self.artist_credit_idx is not None:
            textMap = ConfigMapper()
            artistCredit = textMap.readConfigMapper('ArtistCredits')
            context['artistCredit'] = self.get_array_item(artistCredit, self.artist_credit_idx)
            
        return context

# page 1 General Concepts Intro of trig function section. Youtube requires this to pass our csp
@method_decorator(csp_update({"script-src-elem": ["'unsafe-inline'"]}), name='dispatch')
class MusicTrigConceptIntroView(BaseMathView):
    template_name = 'int_math/IntroTrigMusicConcepts.html'
    page_tab_header = 'IntroConcepts'
    artist_credit_idx = 0
    
    # BaseMathView automatically handles these with getFullFileURL(..., True, request)
    public_static_files = {
        'TrigIntroMusicCSS': 'css/IntroTrigMusicConcepts.css',
        'TrigIntroMusicJS': 'js/IntroTrigMusicConcepts.js',
    }

    def get_context_data(self, **kwargs):
        # 1. Call super() so BaseMathView sets up the CSS, JS, artist credits, and basePage
        context = super().get_context_data(**kwargs)
        
        # 2. Get the specific configurations for this view
        trigMap = ConfigMapper()
        
        # 3. Add the direct video URLs
        context['introToFreqVideo'] = trigMap.readConfigMapper("IntroToFrequencyVideo")
        context['introToTrigVideo'] = trigMap.readConfigMapper("IntroToTrigVideo")
        context['introToSoundVideo'] = trigMap.readConfigMapper("IntroToSoundVideo")
        
        # 4. Handle your custom binary files passing 'False' 
        # (Note: Use self.request instead of request in Class-Based Views)
        realFileCartoonGIF = trigMap.readConfigMapper("CartoonIntroGIF")
        context['cartoonIntroGIF'] = getFullFileURL(realFileCartoonGIF, False, self.request)
        
        realFileIntroAudio = trigMap.readConfigMapper("TrigReviewIntroAudio")
        context['trigReviewIntroAudio'] = getFullFileURL(realFileIntroAudio, False, self.request)
        
        return context
    
# page 2 Music Sine Intro of trig function section.  Pg2MusicSineIntro.html  
class MusicTrigView(BaseMathView):
    template_name = 'int_math/Pg2MusicSineIntro.html'
    page_tab_header = 'MusicalTrig'
    # so we load up the base class context dictionary and it calls get/render the template
    public_static_files = {
        'MusicSineIntroCSS':'css/Pg2MusicSineIntro.css',
        'MusicSineIntroJS': 'js/Pg2MusicSineIntro.js',
        'ColorfulClefSVG': 'svg/Prismatic-Clef-Hearts-2.svg',
        'WholeNoteSVG': 'svg/WholeNote.svg',
        'VolumeOffSVG': 'svg/volume-off.svg',
        'VolumeOnSVG': 'svg/volume.svg',
    }
    
# page 3 Where does sine/cosine come from? of trig function section       
class StaticTrigView(BaseMathView):
    template_name = 'int_math/StaticTrig.html'
    page_tab_header = 'StaticTrig'
    # so we load up the base class context dictionary and it calls get/render the template
    public_static_files = {
        'StaticTrigCSS': 'css/StaticTrig.css',
        'StaticTrigJS': 'js/StaticTrig.js',
        'ExplnQ2SVG': 'svg/StaticTrigQ2.svg',
        'ExplnQ3SVG': 'svg/StaticTrigQ3.svg',
        'ExplnQ4SVG': 'svg/StaticTrigQ4.svg',
    }
# page 4 Lets add time and make frequency of trig function section   
class DynamicTrig1View(BaseMathView):
    template_name = 'int_math/DynamicTrig1.html'
    page_tab_header = 'DynamicTrig'
    
    public_static_files = {
        'DynTrig1CSS': 'css/DynamicTrig1.css',
        'DynTrig1JS': 'js/DynamicTrig1.js',
    }  
    
# page 5 Lets go faster in time of trig function section
class DynamicTrig2View(BaseMathView):
    template_name = 'int_math/DynamicTrig2.html'
    page_tab_header = 'DynamicTrig'
    artist_credit_idx = 3
    
    public_static_files = {
        'DynTrig2CSS': 'css/DynamicTrig2.css',
        'DynTrig2JS': 'js/DynamicTrig2.js',
    }

# page 6 Lets get into audible sin/cosine tones of trig function section
class ToneTrigView(BaseMathView):
    template_name = 'int_math/ToneTrig.html'
    page_tab_header = 'ToneTrig'
    artist_credit_idx = 3
    
    public_static_files = {
        'ToneTrigCSS': 'css/ToneTrig.css',
        'ToneTrigJS': 'js/ToneTrig.js',
        'VolumeOffSVG': 'svg/volume-off.svg',
        'VolumeOnSVG': 'svg/volume.svg',
    }    

# page 7 Lets compare musical instruments to sine/cosine of same pitch of trig function section   
class MusicNotesTrigView(BaseMathView):
    template_name = 'int_math/MusicNotesTrig.html'
    page_tab_header = 'MusicNotes'
    artist_credit_idx = 2
    
    public_static_files = {
        'MusicNotesTrigCSS': 'css/MusicNotesTrig.css',
        'MusicNotesTrigJS': 'js/MusicNotesTrig.js',
        'VolumeOffSVG': 'svg/volume-off.svg',
        'VolumeOnSVG': 'svg/volume.svg',
    }
    
# page 8 Summary of Trig in music MusicSineSummary.html
@method_decorator(csp_update({"script-src-elem": ["'unsafe-inline'"]}), name='dispatch')
class TrigSummaryView(BaseMathView):
    template_name = 'int_math/MusicSineSummary.html'
    page_tab_header = 'Summary'
    artist_credit_idx = 1
    
    public_static_files = {
        'TrigSummaryCss': 'css/MusicSineSummary.css',
        'TrigSummaryJS': 'js/MusicSineSummary.js',
    }

    def get_context_data(self, **kwargs):
        # Let BaseMathView handle all the CSS, JS, credits, and basic context
        context = super().get_context_data(**kwargs)
        
        # Override and Add the specific video logic just for this view
        trigMap = ConfigMapper()
        context['musicSummaryVideo'] = trigMap.readConfigMapper("MusicSummaryVideo")
        
        return context

#****************************************************************************************
#  END OF Trig functions section
#****************************************************************************************    
class ImagNumView(View):
    @method_decorator(never_cache)
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'Imag_num',
                        'topic': get_object_or_404(Topic, name="Imag_num"),
                        'basePage': getBaseContextEntry(request),
                        }        
        response = render(request, 'int_math/imag_num.html', context=context_dict)
        return response

class TeacherStandardsView(View):
    @method_decorator(never_cache)
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'Teachers',
                        'topic': None,
                        'basePage': getBaseContextEntry(request),
                        }        
        response = render(request, 'int_math/TeacherStds.html', context=context_dict)
        return response
         
class PeopleView(View):
    @method_decorator(never_cache)
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'People',
                        'topic': get_object_or_404(Topic, name="Thanks"),
                        'basePage': getBaseContextEntry(request),
                        }
        return render(request, 'int_math/acknowledgements.html', context=context_dict)

class AckView(View):
    @method_decorator(never_cache)
    def get(self, request):
        trigMap = ConfigMapper()
        ty_list = trigMap.readConfigMapper("Thankyou_list")

        # Prepare the data in Python, but leave the HTML to the template
        for contributor in ty_list:
            # Add the full URL to each dictionary in the list
            contributor['full_logo_url'] = getFullFileURL(contributor["logo"], False, request)

        context_dict = {
            'page_tab_header': 'Thank You!',
            'topic': get_object_or_404(Topic, name="Thanks"),
            'basePage': getBaseContextEntry(request),
            'ty_list': ty_list,  
            'AckCSS': getFullFileURL('css/Acknowledgements.css', True, request),
        }
        return render(request, 'int_math/acknowledgements.html', context=context_dict)

class TrigIDView(View):
    @method_decorator(never_cache)
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'Trig ID',
                        'topic': get_object_or_404(Topic, name="TrigIdent"),
                        'basePage': getBaseContextEntry(request),
                        }
        response = render(request, 'int_math/TrigIdentity.html', context=context_dict)
        return response     
   
class TrigIDTuneView(View):
    @method_decorator(never_cache)
    def get(self, request):
        context_dict = {
                        'page_tab_header': 'Inst Tune',
                        'topic': get_object_or_404(Topic, name="TrigIdent"),
                        'basePage': getBaseContextEntry(request),
                        }
        response = render(request, 'int_math/TrigIdent_Tune.html', context=context_dict)
        return response 

     
class Legal_TermsOfUse(View):
    @method_decorator(never_cache)
    def get(self, request):
        configMap = ConfigMapper()
        actualFilename = configMap.readConfigMapper("Legal_TermsCond")
        context_dict = {
                        'page_tab_header': 'Terms Of Use',
                        'topic': get_object_or_404(Topic, name="Legal"),
                        'basePage': getBaseContextEntry(request),
                        'legalDocTerms': getFullFileURL(actualFilename, False, request) + "#toolbar=0",
                       }  
        response = render(request, 'int_math/TermsOfUse.html', context=context_dict)
        return response

class Legal_Privacy(View):
    @method_decorator(never_cache)
    def get(self, request):
        configMap = ConfigMapper()
        actualFilename = configMap.readConfigMapper("Legal_Privacy")
        context_dict = {
                        'page_tab_header': 'Privacy Policy',
                        'topic': get_object_or_404(Topic, name="Legal"),
                        'basePage': getBaseContextEntry(request),
                        'legalDocPriv': getFullFileURL(actualFilename, False, request) + "#toolbar=0",
                       }  
        response = render(request, 'int_math/Privacy.html', context=context_dict)
        return response

class ContactMe(View):
    @method_decorator(never_cache)
    def get(self, request):
        # 1. Cleaner Boolean parsing
        bot_passed = request.GET.get('botTestPassed') == "True"
        bot_done = request.GET.get('botTestPassed') is not None
        
        allow_contact = False
        # Use timezone.now() - it respects your AUTH_TIMEZONE and is 5.2 ready
        date_now = timezone.now() 

        # 2. Use a transaction to prevent race conditions
        with transaction.atomic():
            # select_for_update() locks this row until the transaction finishes
            curr_accesses = ContactAccesses.objects.select_for_update().first()
            
            if not curr_accesses:
                logger.error("DATABASE ERROR: ContactAccesses entry missing.")
                # Fallback: maybe create one or return an error page
                return render(request, 'error.html', {'message': 'System offline'})

            # 3. Monthly Reset Logic
            if date_now.month != curr_accesses.monthLastUpdated:
                if curr_accesses.numClientsDeniedPerMonth > 0:
                    self.notify_admin_of_denials(curr_accesses)
                
                # Reset counters
                curr_accesses.monthLastUpdated = date_now.month
                curr_accesses.numTimesRecaptchaAccessedPerMonth = 0
                curr_accesses.numTimesSmtpAccessedPerMonth = 0
                curr_accesses.numClientsDeniedPerMonth = 0
                curr_accesses.save()
                allow_contact = True
            else:
                # Check limits
                if (curr_accesses.numTimesRecaptchaAccessedPerMonth < MAX_FREE_RECAPTCHA and 
                    curr_accesses.numTimesSmtpAccessedPerMonth < MAX_NUM_EMAIL_PER_MONTH):
                    allow_contact = True
                else:
                    # Update denied count using F expression (atomic increment)
                    ContactAccesses.objects.filter(pk=curr_accesses.pk).update(
                        numClientsDeniedPerMonth=F('numClientsDeniedPerMonth') + 1
                    )
                    allow_contact = False

        context_dict = {
            'page_tab_header': 'Contact Us',
            'topic': None,
            'allowContactEmail': allow_contact,
            'ContactCSS': getFullFileURL('css/Contact_me.css', True, request),
            'ContactJS': getFullFileURL('js/Contact_me.js', True, request),
            'form': contactForm(),
            'basePage': getBaseContextEntry(request),
            'botTestDone': bot_done,
            'botTestPassed': bot_passed,
        }
        return render(request, 'int_math/Contact_me.html', context=context_dict)

    #best not to make this async as it hits only 1/month MAX and we do WSGI server, not ASGI server
    #plus send_mail is a sync function
    def notify_admin_of_denials(self, accesses):
        """Helper to keep the main GET method clean"""
        subject = "SERVER ERROR: USERS denied contact access"
        message = f"{accesses.numClientsDeniedPerMonth} users denied in month {accesses.monthLastUpdated}."
        try:
            send_mail(subject, message, settings.EMAIL_HOST_USER, [settings.EMAIL_HOST_USER])
        except Exception:
            logger.exception("Failed to send admin notification email")

