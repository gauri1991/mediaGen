from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'


class UserApiKey(models.Model):
    """Per-user provider credentials stored in the DB."""
    PROVIDER_CHOICES = [
        ('replicate', 'Replicate'),
        ('akashml', 'AkashML'),
        ('r2', 'Cloudflare R2'),
    ]

    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name='api_keys')
    provider    = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    credentials = models.JSONField(default=dict)  # {'token': '...'} or R2 multi-field dict
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'provider')]

    def __str__(self):
        return f'{self.user_id} / {self.provider}'
