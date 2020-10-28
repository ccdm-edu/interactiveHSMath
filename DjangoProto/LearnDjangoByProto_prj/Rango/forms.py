from django import forms
from Rango.models import Page, Category, UserProfile
from django.contrib.auth.models import User

#######################
# NOTE, this file must be called forms.py for Django interface
#######################
class CategoryForm(forms.ModelForm):
    name = forms.CharField(max_length=Category.MAX_LEN_NAME, 
                           help_text="Please Enter the Category name.")
    views = forms.IntegerField(widget=forms.HiddenInput(), initial=0)
    likes = forms.IntegerField(widget=forms.HiddenInput(), initial=0)
    slug = forms.CharField(widget=forms.HiddenInput(), required=False)
    
    #An inline class to provide additional info on the form
    class Meta:
        #Provide an association between the ModelForm and a model
        model = Category
        fields = ('name',)
    
    def save(self, commit=True):
        return forms.ModelForm.save(self, commit=commit)

    

 
class PageForm(forms.ModelForm): 
    title = forms.CharField(max_length = Category.MAX_LEN_NAME,
                             help_text="Please enter the title of the page")
    url = forms.URLField(max_length=200, 
                         help_text="Please enter the URL of the page.")
    views = forms.IntegerField(widget=forms.HiddenInput(), initial=0)  
    
    class Meta:
        #provide an association between the ModelForm and a model
        model = Page
        
        #What fields do we want to include in our form?
        #This way we don't need every field in the model present.
        #Some fields may allow NULL values; we may not want to include them.
        #Here we are hiding the foreign key.
        #we can either exclude the category field from the form
        exclude = ('category',)
        #or specify the fields to include (dont want to include the category field).
        #fields = ('title', 'url', 'views')
        
    def clean(self):
        cleaned_data = self.cleaned_data
        url = cleaned_data.get('url')
        print(f'url cleaned data initially is {url}')
        
        #if url is not empty and doesn't start with 'http://', 
        # then prepend 'http://'  CANT DO THIS, most sites now are https...
#         if url and not (url.startswith('http://') or :
#             url = f'http://{url}'
#             cleaned_data['url'] = url
#             print(f'url is now {url}')
        return cleaned_data
    
class UserForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput())
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', )
        
class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ('website', 'picture',)
        
    