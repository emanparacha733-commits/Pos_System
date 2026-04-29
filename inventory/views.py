from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Supplier, InventoryLog, PurchaseOrder, PurchaseOrderItem
from .serializers import SupplierSerializer, InventoryLogSerializer, PurchaseOrderSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'email']


class InventoryLogViewSet(viewsets.ModelViewSet):
    queryset = InventoryLog.objects.all().select_related('product')
    serializer_class = InventoryLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name']
    ordering_fields = ['date']

    def perform_create(self, serializer):
        log = serializer.save()

        product = log.product
        action = log.action
        qty = log.qty

        if action == 'stock_in':
            product.stock_qty += qty
        elif action == 'stock_out':
            product.stock_qty = max(0, product.stock_qty - qty)
        elif action == 'adjustment':
            product.stock_qty = qty  # direct set karo

        product.save()


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().select_related('supplier')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['supplier__name']