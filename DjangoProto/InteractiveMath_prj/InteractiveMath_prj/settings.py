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
    SECURE_HSTS_INCLUDE_SUBDOMAINS, SECURE_HSTS_PRELOAD, SESSION_COOKIE_HTTPONLY

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve(strict=True).parent.parent
STATIC_DIR = os.path.join(BASE_DIR,"static")
STATIC_MUSIC_DIR = os.path.join(STATIC_DIR, 'MusicNotes')
STATICFILES_DIRS = [STATIC_DIR, STATIC_MUSIC_DIR,]

RECAPTCHA_SECRET_KEY = os.environ.get('G_RECAPTCHA_V3_SECRET_KEY')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('INT_MATH_SECRET_KEY')


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG_str = os.environ.get('DEBUG')
DEBUG = False
#
#if DEBUG_str.lower() == 'true':
#    DEBUG = True

if DEBUG:
    ALLOWED_HOSTS = ['127.0.0.1']
else:
    ALLOWED_HOSTS = ['catcoder.pythonanywhere.com']
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
    'bootstrap_modal_forms',
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
]

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
    SECURE_HSTS_SECONDS= 3600
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # the preload variable below just allows me to submit to the browsers this is https only, i haven't
    # actually done that submission yet
    SECURE_HSTS_PRELOAD = True
    
    #defaulted already to true but repeating here
    SESSION_COOKIE_HTTPONLY = True

    
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
