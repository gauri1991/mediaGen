from django.contrib import admin
from .models import Generation, Asset


@admin.register(Generation)
class GenerationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'model_slug', 'modality', 'status', 'created_at')
    list_filter = ('status', 'modality', 'provider')
    search_fields = ('prompt', 'model_slug')
    readonly_fields = ('id', 'created_at', 'updated_at', 'started_at', 'completed_at')
    raw_id_fields = ('user',)


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'generation', 'mime_type', 'created_at')
    list_filter = ('type',)
    readonly_fields = ('id', 'created_at')
    raw_id_fields = ('generation', 'user')
