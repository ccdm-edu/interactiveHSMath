from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from int_math.models import Topic, Subtopic

class IndexView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'Home',
                        'topic': None,
                        }        
        response = render(request, 'int_math/index.html', context=context_dict)
        return response
    
class OriginTrigView(View):
    def get(self, request):
        context_dict = {'page_tab_header': 'OriginTrig',
                        'topic': Topic.objects.get(name="Trig"),
                        }
        response = render(request, 'int_math/OriginTrig.html', context=context_dict)
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
    

        
