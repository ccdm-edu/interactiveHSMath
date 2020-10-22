"""LearnDjangoByProto_prj URL Configuration

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
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from django.urls import include
from Rango import views
from registration.backends.simple.views import RegistrationView
from django.urls import reverse

#do this class based view to override the django-registratino-redux.  To do class based view, typically
# you don't have to do this but we are overriding something we don't have direct access to
class MyRegistrationView(RegistrationView):
    def get_success_url(self, user):
        return reverse('Rango:register_profile')

#IT is SOOOOO important to add the / at end of all urls here, will keep you from going to right place
urlpatterns = [
    path('', views.index, name='index'),
    path('Rango/', include('Rango.urls')),
    # The above maps any URLs starting with rango/ to be handled by rango.
    path('admin/', admin.site.urls),
    #to do a redirect, this MUST be before accounts.  It overrides the existing registration_register URL
    # mapping, provided to us in the standard, out of the box django-registration-redux urls.py and replaces
    #the url we jump to with a mapping to our new class based view
    path('accounts/register/', MyRegistrationView.as_view(), name='registration_register'),
    path('accounts/', include('registration.backends.simple.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

