#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Module Name: intHSmath_template_tags.py
Description: Creates the subtopics list to left of page for all but mobile devices
Author: C De Meyer
Date: 5/4/2026
Version: 1.0.0
"""

from django import template
from int_math.models import Topic, Subtopic

register = template.Library()
 
@register.inclusion_tag('int_math/subtopics.html')
def get_subtopic_list(topic = None):
    #select_related is just good practice,not essential for current implemntation
    return{
        'subtopics': Subtopic.objects.filter(topic=topic).select_related('topic')
    }