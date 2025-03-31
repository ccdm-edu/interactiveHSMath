from django.db import models

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
    
class ContactAccesses(models.Model):
    monthLastUpdated = models.IntegerField(default = 0)
    numTimesRecaptchaAccessedPerMonth = models.IntegerField(default = 0)
    numTimesSmtpAccessedPerMonth = models.IntegerField(default = 0)
    numClientsDeniedPerMonth = models.IntegerField(default = 0)
     




