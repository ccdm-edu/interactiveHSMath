from django.shortcuts import render
from django.http import HttpResponse

def index(request):
#    http_resp = "Rango says Hey There! Wanna go to " + '<a href = "/Rango/about/">About</a>' +"?"
#    return HttpResponse(http_resp)
    context_dict = {'boldmessage': 'Crunchy, creamy, cookie, candy, cupcake, broccoli!'}
    return render(request, 'Rango/index.html', context=context_dict)

def about(request):
    http_resp = "Rango says this is the about page.  Wanna go " + '<a href = "/Rango/">Home</a>' + "?"
    return HttpResponse(http_resp)