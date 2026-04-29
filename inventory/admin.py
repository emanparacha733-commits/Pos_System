from django.contrib import admin
from .models import Supplier, InventoryLog, PurchaseOrder, PurchaseOrderItem


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'is_active', 'created_at']
    search_fields = ['name', 'phone', 'email']
    list_filter = ['is_active']


@admin.register(InventoryLog)
class InventoryLogAdmin(admin.ModelAdmin):
    list_display = ['product', 'action', 'qty', 'date']
    search_fields = ['product__name']
    list_filter = ['action']


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'supplier', 'status', 'total_amount', 'created_at']
    search_fields = ['supplier__name']
    list_filter = ['status']
    inlines = [PurchaseOrderItemInline]