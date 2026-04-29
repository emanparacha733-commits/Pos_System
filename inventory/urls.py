from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, InventoryLogViewSet, PurchaseOrderViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'logs', InventoryLogViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]