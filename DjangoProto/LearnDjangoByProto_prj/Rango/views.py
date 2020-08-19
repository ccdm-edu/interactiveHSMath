from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    context_dict = {'boldmessage': 'Crunchy, creamy, cookie, candy, cupcake, broccoli!', 
                    'greetingmsg': 'Hey there partner!',
                    'chooseURL': '<a href="/Rango/about/">About</a><br />',
                    'current_angel_kitty': '../static/images/AngelKitty.jpg',
                    }
    return render(request, 'Rango/index.html', context=context_dict)

def about(request):
#    http_resp = "Rango says this is the about page.  Wanna go " + '<a href = "/Rango/">Home</a>' + "?"
#    return HttpResponse(http_resp)
    context_dict = {'boldmessage': 'Cat Coder did this page', 
                    'greetingmsg': 'This is the ABOUT page',
                    'chooseURL': '<a href="/Rango/">Home</a><br />',
                    'current_angel_kitty': '../../media/Mowgli.jpg',
                    }
    return render(request, 'Rango/index.html', context=context_dict)