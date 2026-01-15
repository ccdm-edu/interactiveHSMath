import os
from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()

#template for inlining CSS, JS and SVG files (will grow the html but reduce number of accesses)
# django-inline-static package did not work with debug=False
#finders.find() works while the aforementioned library's load_staticfile() throws a ValueError indicates 
#a direct incompatibility between the library's loader and Django's production security model
@register.simple_tag
def inline_asset(relative_path):
    """
    Reads CSS, JS, or SVG files from STATICFILES_DIRS and returns content as safe HTML.
    """
    for static_dir in settings.STATICFILES_DIRS:
        full_path = os.path.join(static_dir, relative_path)
        if os.path.exists(full_path):
            try:
                # Open with utf-8 to avoid encoding issues on Linux
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # mark_safe is required so Django doesn't escape the < > characters
                    return mark_safe(content)
            except (IOError, UnicodeDecodeError):
                continue
    return mark_safe(f"<!-- Error: {relative_path} not found -->")