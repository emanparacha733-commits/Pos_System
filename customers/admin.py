from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'loyalty_points', 'credit_balance', 'is_active']
    search_fields = ['name', 'phone', 'email']
    list_filter = ['is_active']