from django.contrib import admin
from .models import Project, ProjectGeneration

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'status', 'deadline', 'created_at']
    list_filter  = ['status']
    search_fields = ['name', 'user__email']

admin.site.register(ProjectGeneration)
