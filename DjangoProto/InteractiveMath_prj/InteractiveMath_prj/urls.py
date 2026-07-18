#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module Name: urls.py
Description: top level url mapper to views.  upgraded to django 5.2
Author: C De Meyer
Date: 5/4/2026
Version:  (see Git)
"""
"""InteractiveMath_prj URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.views.generic.base import RedirectView

# A simple helper function to strip 'int_math/' out of incoming URLs
def clean_old_url(*args, **kwargs):
    remain_path = kwargs.get('remain', '')
    return f"/{remain_path}"

urlpatterns = [
    #  Catch old /int_math/ paths and forward the rest to same location without /int_math in url but only for paths with 
    # some content after int_math/ (i.e. not home page)
    # plan is to do permanent 301 redirects
    #test results:  [18/Jul/2026 14:08:48] "GET /int_math/MusicNotesTrig/ HTTP/1.1" 301 0 produced correct url
    path('int_math/<path:remain>', RedirectView.as_view(get_redirect_url=clean_old_url, permanent=True)),

    # HOMEPAGE SPECIFIC: Catch the exact naked /int_math/ and send it straight to root / on permanent 301 redirect
    path('int_math/', RedirectView.as_view(url='/', permanent=True)),
    
    path('', include('int_math.urls')), 
    path('admin/', admin.site.urls),
    
]
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns