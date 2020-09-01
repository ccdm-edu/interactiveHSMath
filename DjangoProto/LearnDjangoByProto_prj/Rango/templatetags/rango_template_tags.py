'''
Created on Aug 30, 2020

@author: Owner
'''
from django import template
from Rango.models import Category

register = template.Library()
 
@register.inclusion_tag('Rango/categories.html')
def get_category_list(current_category = None):
    return{'categories': Category.objects.all(),
           'current_category': current_category}
    
