from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from int_math.models import Topic, Subtopic
from int_math.forms import BotChkForm
from django.conf import settings
from django.urls import reverse
import urllib.request
import json
#----for modal windows--------
from bootstrap_modal_forms.generic import BSModalFormView


class ChkUsrIsRobotView(BSModalFormView):
    template_name = 'int_math/bot_check.html'
    form_class = BotChkForm

    def get_success_url(self):
        # we return back to the page that sent us, encoded in html as next parameter
        return self.request.GET.get('next', reverse('int_math:index'))
    
    def post(self, request):  
        # check the form validity for basic stuff first
        form = self.form_class(request.POST) 
        responseForm = super().form_valid(form)
        
        
        quartile = '1Q'
        recaptcha_str = self.request.POST.get('g_recaptcha_response')
        if recaptcha_str is not None:
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
        passHoneypotTest = self.request.POST.get('js_honey')
        print('results on math test is ' + passChallengeTest + " honey is " + passHoneypotTest + " quartile is " + quartile)
        return responseForm

        
        
    
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
        context_dict = {'page_tab_header': 'ToneTrig',
                        'topic': Topic.objects.get(name="Trig"),
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
    

        
