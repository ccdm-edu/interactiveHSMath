from django.db import models

class Topic(models.Model):
    # Using 255 is the standard 'safe' maximum for most DB indexes
    MAX_LENGTH=255
    name = models.CharField(
        max_length=MAX_LENGTH, 
        db_index=True, 
        verbose_name="Topic Name"
    )

    class Meta:
        # You are 100% correct: UniqueConstraint is the Django 5.x way
        constraints = [
            models.UniqueConstraint(fields=['name'], name='unique_topic_name')
        ]
        # This fixes the 'Topics' pluralization in the Admin automatically
        verbose_name_plural = "Topics"

    def __str__(self):
        return self.name




class Subtopic(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='subtopics')
    title = models.CharField(max_length=Topic.MAX_LENGTH)
    url = models.URLField(help_text="Need http/s prefix, best to cut and paste from a website")

    def __str__(self):
        # Good practice: include the parent topic in the string representation
        return f"{self.topic.name} -> {self.title}"

class ContactAccesses(models.Model):
    # Using db_default (Django 5.0+) sets the default in the SQL schema itself
    monthLastUpdated = models.PositiveIntegerField(db_default=0)
    numTimesRecaptchaAccessedPerMonth = models.PositiveIntegerField(db_default=0)
    numTimesSmtpAccessedPerMonth = models.PositiveIntegerField(db_default=0)
    numClientsDeniedPerMonth = models.PositiveIntegerField(db_default=0)

    class Meta:
        # This is a helpful hint for other devs (and yourself later)
        verbose_name_plural = "Contact Accesses (Single Row)"

    def save(self, *args, **kwargs):
        # Force this object to always have ID 1
        self.pk = 1
        super().save(*args, **kwargs)




