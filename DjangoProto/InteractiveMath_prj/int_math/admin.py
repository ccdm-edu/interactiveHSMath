from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Subtopic  # Imports your math subtopic model

# Register your model here so it appears on the dashboard
admin.site.register(Subtopic)

