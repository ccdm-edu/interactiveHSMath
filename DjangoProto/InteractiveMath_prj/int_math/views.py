from django.shortcuts import render
from django.http import HttpResponse
from django.views import View

class IndexView(View):
    def get(self, request):

        context_dict = {'page_tab_header': 'Index',
                        }
        
        response = render(request, 'int_math/index.html', context=context_dict)
        return response
