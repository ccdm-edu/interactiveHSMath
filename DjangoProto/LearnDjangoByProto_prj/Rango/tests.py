from django.test import TestCase
from Rango.models import Category, Page
from django.urls import reverse
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium.webdriver.chrome.webdriver import WebDriver
from django.utils import timezone
import sys, os, logging, time

# Create your tests here.
# run this test in DOS prompt at location \Users\Owner\GitRepo\DjangoProto\LearnDjangoByProto_prj
# and then do python manage.py test Rango
#when you do this, it automatically creates a test database that is destroyed when done

# testing integrity of server DB writes
###
# SERVER SIDE TESTS
###
class CategoryMethodTests(TestCase):
    """
    Set up logging
    """
    baseLogDir = os.path.join("C:", os.sep, "PyDevLogs")
    if not os.path.exists(baseLogDir):
        os.makedirs(baseLogDir)
    LOG_FILE = os.path.join(baseLogDir, "RangoTests.log")
    #write a new log file on each run
    logging.basicConfig(format = '%(asctime)s %(module)s %(funcName)s %(lineno)d %(message)s',
                        datefmt = '%m/%d/%Y %I:%M:%S %p',
                        filemode = 'w',
                        filename = LOG_FILE,
                        level=logging.INFO)
    
    def test_ensure_views_are_positive(self):
        """
        Ensures the number of views received for a Category are positive or Zero
        """
        category = add_category('test',-1,0)
        self.assertEqual((category.views >= 0), True)
        
    def test_slug_line_creation(self):
        """
        Checks to ensure that when a category is created, an appropriate slug is 
        created.  Example "Random Category String" should be "random-category-string"
        """
        category = add_category('Random Category String')
        self.assertEqual(category.slug, 'random-category-string')
        
    def test_last_viewed_date(self):
        """
        Checks the last_viewed param on Page model
        """
        category = add_category('test',1,0)
        page = add_page(category, 'test page title', 'http://stackoverflow.com/')
        create_date = page.last_visit
        
        logging.info(f"the create date of test page is {create_date}")
        #ensure created date is not in future
        self.assertTrue(create_date <= timezone.now())
        #now, ensure when we access the page, the new time is updated
        time.sleep(5)  # 5 sec sleep
        self.client.get(reverse('Rango:goto'), {'page_id': page.id})
        page.refresh_from_db()
        logging.info(f"the date of last visit is {page.last_visit} and now is {timezone.now()} ")
        self.assertTrue(create_date < page.last_visit)


def add_category(name, views=0, likes=0):
    category = Category.objects.get_or_create(name=name)[0]
    category.views = views
    category.likes = likes
    
    category.save()
    return category

def add_page(category, title, url):
    page, created = Page.objects.get_or_create(category=category, title = title, url = url)
    page.save()
    return page
 
# testing integrity of server rendered pages 
###
# CLIENT SIDE TESTS
class IndexViewTests(TestCase):
    def test_index_view_with_no_categories(self):
        """
        If no categories exist, the appropriate message should be displayed
        """
        response = self.client.get(reverse('Rango:index'))
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'There are no categories present.')
        self.assertQuerysetEqual(response.context['categories'], [])
        
    def test_index_view_with_categories(self):
        """
        Checks whether categories are displayed correctly when present
        """
        add_category('Python',1,1)
        add_category('C++', 1,1)
        add_category('Erlang', 1,1)
        
        response = self.client.get(reverse('Rango:index'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Python')
        self.assertContains(response, 'C++')
        self.assertContains(response, 'Erlang')
        
        num_categories = len(response.context['categories'])
        self.assertEquals(num_categories, 3)
        
# How to unit test like a user would interact client side
# https://docs.djangoproject.com/en/2.2/topics/testing/tools/#liveservertestcase
# need to pip install selenium, need to install the driver for the browser you use (Chrome)
# and then ensure the exe file is in your path (I just put it into an existing path)
# i put chromedriver.exe in the python dir
#CLIENT SIDE WITH SERVER (fake user)
class MySeleniumTests(StaticLiveServerTestCase):
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.selenium = WebDriver()
        cls.selenium.implicitly_wait(10)
        
    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit()
        super().tearDownClass()
    
    # NOTE, this gives an error on EGL driver and command_buffer_proxy_impl.cc
    #I don't know what this is but I did get the final OK and 5 tests run so maybe I should
    # ignore this error???
    def test_about(self):
        pass
        #self.selenium.get('%s%s' % (self.live_server_url, 'about/'))
        
        