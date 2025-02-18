"""
Django settings for InteractiveMath_prj project.

Generated by 'django-admin startproject' using Django 3.1.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.1/ref/settings/
"""

from pathlib import Path
import os
from django.conf.global_settings import SECURE_SSL_REDIRECT, SECURE_HSTS_SECONDS,\
    SECURE_HSTS_INCLUDE_SUBDOMAINS, SECURE_HSTS_PRELOAD, SESSION_COOKIE_HTTPONLY,\
    STATIC_ROOT

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG_str = os.environ.get('DEBUG')
#note, this variable is used on several pages in this project, cant change name here alone
DEBUG = False
#
if DEBUG_str.lower() == 'true':
    DEBUG = True

BASE_DIR = Path(__file__).resolve(strict=True).parent.parent
STATIC_DIR = os.path.join(BASE_DIR,"static")
#*****make a symbolic link to test how it works *****
# this is the actual location of desired binaries
BINARIES_LOC_str = os.environ.get('STATIC_BINARIES_DIR')

#this is the destination location and it only happens in local debug, dont want symlink in production
SYMLINK_BINARIES_dir = os.path.join(STATIC_DIR,"static_binaries")
if DEBUG:
    #create symbolic link so everything gets served by runserver as though it was under main project 
    if (not (os.path.exists(SYMLINK_BINARIES_dir))):
        os.symlink(BINARIES_LOC_str, SYMLINK_BINARIES_dir)
    STATICFILES_DIRS = [STATIC_DIR]
else:
    #https://stackoverflow.com/questions/24022558/differences-between-staticfiles-dir-static-root-and-media-root
    #STATIC_ROOT is needed by deployment server for collectstatic, its where static files will be stored
    # this directory will already have some static files, need to put the static_binaries in their expected place
    STATIC_ROOT = os.path.join(STATIC_DIR,"static_binaries")
    # STATICFILES_DIR used by collectstatic to serve other directories under deployment
    # Build paths inside the project like this: BASE_DIR / 'subdir'.
    STATICFILES_DIRS = [BINARIES_LOC_str]

RECAPTCHA_SECRET_KEY = os.environ.get('G_RECAPTCHA_V3_SECRET_KEY')
RECAP_PUBLIC_KEY = os.environ.get('G_RECAPTCHA_V3_PUBLIC_KEY')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('INT_MATH_SECRET_KEY')

#setup the SMTP server for use in sending successful messages, based on https://help.pythonanywhere.com/pages/SMTPForFreeUsers/
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
#WEBSITE_EMAIL_ADDR is a gmail account and SMTP_APP_PSWD is the app password for that gmail account
EMAIL_HOST_USER = os.environ.get('WEBSITE_EMAIL_ADDR') 
#NOTE:  app password disabled every time gmail acct changes
EMAIL_HOST_PASSWORD = os.environ.get('SMTP_APP_PSWD') 
EMAIL_USE_TLS = True

if DEBUG:
    ALLOWED_HOSTS = ['127.0.0.1']
else:
    CURRENT_HOST = os.environ.get('CURRENT_URL')
    ALLOWED_HOSTS = [CURRENT_HOST]
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'widget_tweaks',
    'int_math',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',
]

X_FRAME_OPTIONS = 'SAMEORIGIN'  #so the legal stuff will operate with correct headers

#this won't help us since we don't allow user upload of files but will kill a owasp zap low error
SECURE_CONTENT_TYPE_NOSNIFF = True

#content security policy --using this till django upgrade https://django-csp.readthedocs.io/en/3.8/configuration.html
# also see https://django-csp.readthedocs.io/en/3.8/nonce.html
CSP_REPORT_ONLY = False  #True only in initial debug to get policy working with site, default is false
CSP_STYLE_SRC = ["'self'", 'https://getbootstrap.com', 'https://code.jquery.com']
CSP_WORKER_SRC = ["'self'", 'blob:']
CSP_SCRIPT_SRC_ELEM = ["'self'", 'https://www.googletagmanager.com', 'https://www.google.com', 
                      'https://getbootstrap.com', 'https://www.gstatic.com', 'https://ajax.googleapis.com', 
                      'https://cdnjs.cloudflare.com','https://cdn.jsdelivr.net']
CSP_IMG_SRC = ["'self'", 'https://code.jquery.com']
#not sure why google needs to embed self in iframe, could be gtagmanager, google analytics or gmail??
CSP_FRAME_SRC = ["'self'", 'https://www.google.com'] 
CSP_FRAME_ANCESTORS = ["'self'", 'https://www.google.com'] 
CSP_CONNECT_SRC = ["'self'", 'https://www.google.com']  #needed for recaptcha

CSP_INCLUDE_NONCE_IN = ['script-src', 'script-src-elem', 'style-src']  

ROOT_URLCONF = 'InteractiveMath_prj.urls'
TEMPLATE_PATH = os.path.join(BASE_DIR,'templates')
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            TEMPLATE_PATH,
            ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'InteractiveMath_prj.wsgi.application'

# for debug only
INTERNAL_IPS = [
    '127.0.0.1',
    ]
    
if DEBUG == False:
    # we are deployed, not in localserver
    # security for https deployment
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    #may need to increase this from 1 hour (3600) to 1 year (31536000) once all is working.  This forces https only
    SECURE_HSTS_SECONDS= 604800 # 1 week.  # 86400 is 1 day and 31536000  # Recommended: 1 year (in seconds)  -- this used to be 3600 or 1 hour
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # hstspreload.org recommends we set this to false--minimal protection gain from true but max hassle.
    SECURE_HSTS_PRELOAD = False
    
    #defaulted already to true but repeating here
    SESSION_COOKIE_HTTPONLY = True
    #more secure csrf cookie--to pass owasp test
    CSRF_COOKIE_HTTPONLY = True

    
# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/

STATIC_URL = '/static/'
