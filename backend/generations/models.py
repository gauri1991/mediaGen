from django.db import models
from django.conf import settings
import uuid


class Generation(models.Model):
    class Modality(models.TextChoices):
        IMAGE = 'image'
        VIDEO = 'video'
        AUDIO = 'audio'

    class Status(models.TextChoices):
        QUEUED = 'queued'
        PROCESSING = 'processing'
        COMPLETED = 'completed'
        FAILED = 'failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='generations')
    modality = models.CharField(max_length=10, choices=Modality.choices)
    model_slug = models.CharField(max_length=100)
    provider = models.CharField(max_length=50)
    provider_job_id = models.CharField(max_length=255, blank=True, null=True)
    celery_task_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    progress = models.IntegerField(null=True, blank=True)
    prompt = models.TextField()
    negative_prompt = models.TextField(blank=True, null=True)
    params = models.JSONField(default=dict)
    cost_credits = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='remixes')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'generations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='gen_user_created_idx'),
            models.Index(fields=['user', 'status'], name='gen_user_status_idx'),
            models.Index(fields=['status'], name='gen_status_idx'),
        ]

    def __str__(self):
        return f'{self.model_slug} [{self.status}] — {self.prompt[:60]}'


class Asset(models.Model):
    class AssetType(models.TextChoices):
        IMAGE = 'image'
        VIDEO = 'video'
        AUDIO = 'audio'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    generation = models.ForeignKey(Generation, on_delete=models.CASCADE, related_name='assets')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assets')
    type = models.CharField(max_length=10, choices=AssetType.choices)
    r2_key = models.CharField(max_length=500)
    url = models.URLField(max_length=1000, blank=True, null=True)
    thumbnail_r2_key = models.CharField(max_length=500, blank=True, null=True)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    bytes = models.BigIntegerField(null=True, blank=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assets'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['user', '-id'], name='asset_user_id_idx'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['generation', 'r2_key'], name='asset_gen_r2key_uniq'),
        ]

    def __str__(self):
        return f'{self.type} asset for {self.generation_id}'
