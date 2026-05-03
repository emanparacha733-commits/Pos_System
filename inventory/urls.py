from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet,
    ProductViewSet,
    PurchaseOrderViewSet,
    StockMovementViewSet,
    LowStockNotificationViewSet,
    WarehouseViewSet,  # ← yeh add karo
)

router = DefaultRouter()
router.register(r'suppliers',              SupplierViewSet,             basename='supplier')
router.register(r'products',               ProductViewSet,              basename='product')
router.register(r'purchase-orders',        PurchaseOrderViewSet,        basename='purchase-order')
router.register(r'stock-movements',        StockMovementViewSet,        basename='stock-movement')
router.register(r'low-stock-notifications',LowStockNotificationViewSet, basename='low-stock-notification')
router.register(r'warehouses',             WarehouseViewSet,            basename='warehouse')  # ← yeh add karo

urlpatterns = [
    path('', include(router.urls)),
]