'''
Created on Aug 20, 2021

@author: Owner
'''
from django import template
from int_math.models import Topic, Subtopic

register = template.Library()
 
@register.inclusion_tag('int_math/subtopics.html')
def get_subtopic_list(topic = None):
    return{'subtopics': Subtopic.objects.filter(topic=topic)}