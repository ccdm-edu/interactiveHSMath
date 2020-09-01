from django.contrib import admin
from Rango.models import Category, Page, UserProfile
from django.contrib.admin.templatetags.admin_modify import prepopulated_fields_js

class CategoryAdmin(admin.ModelAdmin):
    #prepopulates the slug field using the name
    prepopulated_fields = {'slug':('name',)}
    
class PageAdmin(admin.ModelAdmin):
    list_display = ('title','category', 'url')
    
admin.site.register(Category, CategoryAdmin)
admin.site.register(Page, PageAdmin)
admin.site.register(UserProfile)