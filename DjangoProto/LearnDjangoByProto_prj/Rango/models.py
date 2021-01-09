from django.db import models
from django.db.models.fields import BooleanField, DateTimeField
from django.utils import timezone
from datetime import datetime
from django.template.defaultfilters import slugify
from django.contrib.auth.models import User

#MAX_LEN_NAME = 128

# Create your models here.
class Category(models.Model):
    MAX_LEN_NAME = 128
    name = models.CharField(max_length=MAX_LEN_NAME, unique = True)
    status = BooleanField(default = False)
    # use editable=False and it won't show up as a field in the admin page   
    created_at = DateTimeField(default=timezone.now)
    views = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    #careful if there is a default on slug, may need to wait until fully populated
    #before adding this field
    #perhaps another solution is slug= AutoSlugField(populate_from='name', unique=True) and then from autoslug import AutoSlugField
    #then maynot need to do the save stuff with slugify...
    slug = models.SlugField(unique=True)
    
    def save(self, *args, **kwargs):
        self.created_at = timezone.now()
        self.slug = slugify(self.name)
        # i don't know why it won't let me do this "force positive) when initialized
        self.views = max(0,self.views)
        self.likes = max(0,self.likes)
        return super(Category, self).save(*args, **kwargs)
    
    def setStatusTrue(self):
        self.status = True
    
    class Meta:
        verbose_name_plural = 'Categories'
        
    def __str__(self):
        return self.name


class Page(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    title = models.CharField(max_length = Category.MAX_LEN_NAME)
    url = models.URLField()
    views = models.IntegerField(default=0)
    last_visit = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.title
    
class UserProfile(models.Model):
    #This line is required.  Links UserProfile to a User model instance
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    #the additional attributes we wish to include
    website = models.URLField(blank=True)
    picture = models.ImageField(upload_to='profile_images', blank=True)
    
    def __str__(self):
        return self.user.username

class BotChkResults(models.Model):
    pass_honeypot = models.BooleanField(default=False)
    pass_mathtest = models.BooleanField(default=False)
    RECAPTCHA_V3_QUARTILES = (
        ('1Q', 'Definitely_robot'),
        ('2Q', 'Maybe_robot'),
        ('3Q', 'Maybe_human'),
        ('4Q', 'Definitely_human'))
    recaptcha_v3_quartile = models.CharField(max_length=2, choices=RECAPTCHA_V3_QUARTILES)
    count = models.IntegerField(default = 0)
    
    class Meta:
        #its already plural
        verbose_name_plural = 'BotChkResults'
    
    def __str__(self):
        return f"pass_honeypot={self.pass_honeypot}, pass_math={self.pass_mathtest}, recaptcha_v3={self.recaptcha_v3_quartile}, count = {self.count}"