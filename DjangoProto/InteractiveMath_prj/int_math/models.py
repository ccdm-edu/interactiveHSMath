from django.db import models
#from django.db.models.fields import BooleanField, DateTimeField
#from django.utils import timezone
#from datetime import datetime
#from django.template.defaultfilters import slugify
#from django.contrib.auth.models import User


class Topic(models.Model):
    MAX_LEN_NAME = 128
    name = models.CharField(max_length=MAX_LEN_NAME, unique = True)
        
    def __str__(self):
        return self.name


class Subtopic(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    title = models.CharField(max_length = Topic.MAX_LEN_NAME)
    url = models.URLField(help_text="Need http/s prefix, best to cut and paste from a website")
    
    # the default save function is good enough for these attributes of the class
    
    def __str__(self):
        return self.title

# This is to keep track of users to site and see how well the robot checks are working
#class BotChkResults(models.Model):
#    pass_mathtest = models.BooleanField(default=False, help_text="Don't make this hard")
#    RECAPTCHA_V3_QUARTILES = (
#        ('1Q', 'Definitely_robot'),
#        ('2Q', 'Maybe_robot'),
#        ('3Q', 'Maybe_human'),
#        ('4Q', 'Definitely_human'))
#    recaptcha_v3_quartile = models.CharField(max_length=2, choices=RECAPTCHA_V3_QUARTILES)
#    count = models.IntegerField(default = 0)
    
 #   class Meta:
        #its already plural
 #       verbose_name_plural = 'BotChkResults'
    
 #   def __str__(self):
 #       return f"pass_math={self.pass_mathtest}, recaptcha_v3={self.recaptcha_v3_quartile}, count = {self.count}"


