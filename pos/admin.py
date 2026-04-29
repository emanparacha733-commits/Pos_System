from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'cashier', 'total', 'payment_method', 'status', 'created_at']
    search_fields = ['id', 'customer__name']
    list_filter = ['status', 'payment_method']
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'qty', 'unit_price', 'total_price']