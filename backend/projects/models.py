import uuid
from django.db import models
from django.conf import settings


class ProjectStatus(models.TextChoices):
    DRAFT    = 'draft',    'Draft'
    ACTIVE   = 'active',   'Active'
    REVIEW   = 'review',   'In Review'
    COMPLETE = 'complete', 'Complete'
    ARCHIVED = 'archived', 'Archived'


class Project(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name='projects')
    name        = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status      = models.CharField(max_length=20, choices=ProjectStatus.choices,
                                   default=ProjectStatus.DRAFT)
    tags        = models.JSONField(default=list, blank=True)
    deadline    = models.DateField(null=True, blank=True)
    cover_asset = models.ForeignKey('generations.Asset', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='+')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='proj_user_created_idx'),
            models.Index(fields=['user', 'status'],      name='proj_user_status_idx'),
        ]

    def __str__(self):
        return self.name


class ProjectGeneration(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project    = models.ForeignKey(Project, on_delete=models.CASCADE,
                                   related_name='project_generations')
    generation = models.ForeignKey('generations.Generation', on_delete=models.CASCADE,
                                   related_name='project_generations')
    note       = models.TextField(blank=True)
    added_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('project', 'generation')]
        ordering = ['-added_at']
