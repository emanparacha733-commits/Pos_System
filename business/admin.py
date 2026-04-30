from django.contrib import admin
from .models import Business

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'currency', 'tax_rate', 'phone', 'created_at']
    search_fields = ['name', 'email']