from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from int_math.models import Topic, Subtopic
from int_math.forms import BotChkForm
#----for modal windows--------
from django.urls import reverse
from bootstrap_modal_forms.generic import BSModalFormView




class ChkUsrIsRobotView(BSModalFormView):
    template_name = 'int_math/bot_check.html'
    form_class = BotChkForm

    def get_success_url(self):
        # we return back to the page that sent us, encoded in html as next parameter
        print('want to return to ' + self.request.GET.get('next') + " but if we can't, will return to homepage")
        return self.request.GET.get('next', reverse('int_math:index'))
    
    def post(self, request):  
        # check the form validity for basic stuff first
        print('we got into post')
        form = self.form_class(request.POST) 
        response = super().form_valid(form)
        print('we finished form validation')
        #JS passes back text string, not a bool
        passChallengeTest = self.request.POST.get('math_test')
        passHoneypotTest = self.request.POST.get('js_honey')
        print('The post was ')
        print(self.request.POST)
        print('the form response was ')
        print(response)
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
    

        
