from django.contrib import admin
from .models import (
    Supplier, Warehouse, Product,
    StockBatch, PurchaseOrder, PurchaseOrderItem,
    StockMovement, InventoryAuditLog, LowStockNotification
)

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'is_active']
    search_fields = ['name', 'phone']

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'is_default', 'is_active']

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'supplier', 'status', 'total_amount', 'order_date']
    list_filter = ['status']

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'stock_before', 'stock_after', 'created_at']
    list_filter = ['movement_type']

@admin.register(InventoryAuditLog)
class InventoryAuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'timestamp']
    list_filter = ['action']

@admin.register(LowStockNotification)
class LowStockNotificationAdmin(admin.ModelAdmin):
    list_display = ['product', 'stock_level', 'is_resolved', 'created_at']