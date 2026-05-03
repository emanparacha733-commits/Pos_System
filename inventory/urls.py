# inventory/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SupplierViewSet,
    ProductViewSet,
    PurchaseOrderViewSet,
    StockMovementViewSet,
    LowStockNotificationViewSet,
)

router = DefaultRouter()

# Suppliers — CRUD + soft delete
router.register(r'suppliers', SupplierViewSet, basename='supplier')

# Products — CRUD + low_stock / out_of_stock / by_barcode / movement_history
router.register(r'products', ProductViewSet, basename='product')

# Purchase Orders — CRUD + receive + cancel
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')

# Stock Movements — read-only list/retrieve + manual adjust
router.register(r'stock-movements', StockMovementViewSet, basename='stock-movement')

# Low Stock Notifications — read-only list/retrieve + resolve
router.register(r'low-stock-notifications', LowStockNotificationViewSet, basename='low-stock-notification')


urlpatterns = [
    path('', include(router.urls)),
]


# ──────────────────────────────────────────────────────────────
# Router se automatically generate hone wale endpoints:
#
# SUPPLIERS
#   GET    /suppliers/                   — list
#   POST   /suppliers/                   — create
#   GET    /suppliers/{id}/              — retrieve
#   PUT    /suppliers/{id}/              — update
#   PATCH  /suppliers/{id}/              — partial update
#   DELETE /suppliers/{id}/              — soft delete
#
# PRODUCTS
#   GET    /products/                    — list (filter: category, supplier, is_active)
#   POST   /products/                    — create
#   GET    /products/{id}/               — retrieve
#   PUT    /products/{id}/               — update  (audit log)
#   PATCH  /products/{id}/               — partial update
#   DELETE /products/{id}/               — delete
#   GET    /products/low_stock/          — low stock products
#   GET    /products/out_of_stock/       — out of stock products
#   GET    /products/by_barcode/?code=X  — barcode lookup
#   GET    /products/{id}/movement_history/ — last 50 movements
#
# PURCHASE ORDERS
#   GET    /purchase-orders/             — list (filter: status, supplier)
#   POST   /purchase-orders/             — create (items nested)
#   GET    /purchase-orders/{id}/        — retrieve
#   PUT    /purchase-orders/{id}/        — update
#   PATCH  /purchase-orders/{id}/        — partial update
#   DELETE /purchase-orders/{id}/        — delete
#   POST   /purchase-orders/{id}/receive/ — maal receive (stock update)
#   POST   /purchase-orders/{id}/cancel/  — cancel order
#
# STOCK MOVEMENTS  (read-only + adjust)
#   GET    /stock-movements/             — list (filter: product, movement_type, warehouse)
#   GET    /stock-movements/{id}/        — retrieve
#   POST   /stock-movements/adjust/      — manual adjustment
#
# LOW STOCK NOTIFICATIONS
#   GET    /low-stock-notifications/     — unresolved notifications
#   GET    /low-stock-notifications/{id}/ — retrieve
#   POST   /low-stock-notifications/{id}/resolve/ — mark resolved
# ──────────────────────────────────────────────────────────────