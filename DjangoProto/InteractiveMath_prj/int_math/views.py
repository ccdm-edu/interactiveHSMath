from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from int_math.models import Topic, Subtopic
from django.conf import settings
from django.urls import reverse
from django.contrib.staticfiles.storage import staticfiles_storage
from django.contrib.staticfiles import finders
from django.core.files import File
import urllib.request
import json
import os
#----for modal windows--------
from bootstrap_modal_forms.generic import BSModalFormView
# homegrown stuff
from int_math.forms import BotChkForm



#**********************************************************
# Modal window resonse, check if user is a Robot before allowing significant
# server time to client
#**********************************************************
class ChkUsrIsRobotView(BSModalFormView):
    template_name = 'int_math/bot_check.html'
    form_class = BotChkForm
    success_message = "Passed Test, You can now access server files"

    def get_success_url(self):
        # we return back to the page that sent us, encoded in html as next parameter, 
        # if that fails, go back to home page (should never happen)
        return self.request.GET.get('next', reverse('int_math:index'))
    
    def post(self, request):  
        # check the form validity for basic stuff first
        form = self.form_class(request.POST) 
        responseTest = super().form_valid(form)
        botCheckNeeded = True
        quartile = '1Q'
        
        # I chose to use django-bootstrap-modal-forms to do generic modal forms.  In retrospect, I should have just
        #done straight bootstrap modal forms with django and skipped this library and I may rewrite things to do that
        # because the django-bootstrap-mopdal-forms pypi library INTENTIONALLY posts twice by design.  Full expln is here
        # https://github.com/trco/django-bootstrap-modal-forms/issues/14.  The first post is ajax, the second is normal post.
        # we can ignore the first post (so we don't get a duplicate token error from recaptcha).  We could also do this in mixins, if
        # I knew how to use mixins which I don't yet.  Another bug in this library is success message is not shown.  Sigh....
        if not self.request.is_ajax():
            recaptcha_str = self.request.POST.get('g_recaptcha_response')
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
                if (result['success'] and result['action'] == 'bot_check_form'):
                    if (result['score'] < 0.25):
                        quartile = '1Q'
                    elif (result['score'] < 0.5): 
                        quartile = '2Q'
                    elif (result['score'] < 0.75):
                        quartile = '3Q'
                    else:
                        quartile = '4Q'
                else:
                    # need to throw an exception or do something here
                    print(f"ERROR, bad recaptcha token, raw result was {result}")
            
    
            #JS passes back text string, not a bool
            passChallengeTest = self.request.POST.get('math_test')
            print('results on math test is ' + passChallengeTest +  " quartile is " + quartile)
            
            if (('12' == passChallengeTest) and ('4Q' == quartile)):
                #trust this user for the duration of session, no need to retest them as long as client has this cookie
                request.session['notABot'] = True
                botCheckNeeded = False
                print('Bot test PASSED')
            else:
                # tell server not to trust this client on all subsequent accesses and to retest the user
                request.session['notABot'] = False
                botCheckNeeded = True
                print('Bot test FAILED')

        context_dict = {'page_tab_header': 'ToneTrig',
                        'topic': Topic.objects.get(name="Trig"),
                        'botChkTstNeed': botCheckNeeded,
                        }
        # next url is encoded in this POST request, if failure, go back home, youre screwed
        nextURL = self.request.GET.get('next', reverse('int_math:index')) 
        #need to remove first and last slash and add .html to this text in order to render template
        nextURL = nextURL[1:-1] + ".html"
        print('next url is ' + nextURL)
        responseTest = render(request, nextURL, context=context_dict)
        #return response
        #print(responseTest)
        return responseTest

#**********************************************************
# These are actions that will require significant server time, verify and 
# respond to client appropriately
#**********************************************************       
class VerifyClientGiveFile(View):
    def get(self, request):
        response = HttpResponse()
        filename = ''
        if 'filename' in request.GET:
            # Need to go up one level from give_file URL we are in to get to int_math level and correct file location
            filename = request.GET['filename']
            module_dir = os.path.dirname(__file__)  # get current directory
            #print("current dir is " + module_dir)
            #filename = os.path.join(module_dir, '../static/MusicNotes/' + filename)
            #localFilename = staticfiles_storage.url('MusicNotes' + filename)
            #localFilename = '/../static/MusicNotes/' + filename
            #print('localfile is' + localFilename)
            tuneFilename = os.path.join(module_dir,"..")
            tuneFilename2 = os.path.join(tuneFilename, 'static')
            tuneFilename3 = os.path.join(tuneFilename2, 'MusicNotes')
            tuneFilename4 = os.path.join(tuneFilename3, filename)
            #print('tunefilename is ' + tuneFilename4)
            resultFilename = finders.find(filename)
            print('result of finders is ')
            print(resultFilename)
            searched_locations = finders.searched_locations
            #print('searched locations: ')  
            #print(searched_locations)
            

        
        if 'notABot' in request.session:
            # bot test already performed, notaBot exists, get results
            if request.session.get('notABot', True):
                print('you are NOT a bot')
                try:
                    #all is good, get the file and send if off.  
                    # DO, redo this in terms of nginx access for greater efficiency  Use python django-sendfile library
                    #need different way to send off via development server and nginx (or apache if we later go that way)
                    print('after concat, filename is ' + resultFilename)
                    print(' size of this file is ' + str(os.path.getsize(resultFilename)))

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
        context_dict = {'page_tab_header': 'Home',
                        'topic': None,
                        }        
        response = render(request, 'int_math/index.html', context=context_dict)
        return response
    
class StaticTrigView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'StaticTrig',
                        'topic': Topic.objects.get(name="Trig"),
                        }
        response = render(request, 'int_math/StaticTrig.html', context=context_dict)
        return response
    
class DynamicTrigView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'DynamicTrig',
                        'topic': Topic.objects.get(name="Trig"),
                        }
        response = render(request, 'int_math/DynamicTrig.html', context=context_dict)
        return response

class ToneTrigView(View):
    def get(self, request):
        #check session cookie (which expires after soom time--default 15 days) to see if bot test passed
        try: 
            # If session is established, use it
            botCheckNeeded = not request.session['notABot']
        except:
            # else, no session established, set it up so robot check test required
            botCheckNeeded = True
        context_dict = {'page_tab_header': 'ToneTrig',
                        'topic': Topic.objects.get(name="Trig"),
                        'botChkTstNeed': botCheckNeeded,
                        }
        response = render(request, 'int_math/ToneTrig.html', context=context_dict)
        return response
    
class ImagNumView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Imag_num',
                        'topic': Topic.objects.get(name="Imag_num"),
                        }        
        response = render(request, 'int_math/imag_num.html', context=context_dict)
        return response
    

        
