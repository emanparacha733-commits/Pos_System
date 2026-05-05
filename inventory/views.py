# inventory/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import *
from .serializers import *
from .services import StockService, AuditService


# ─────────────────────────────────────────
# CATEGORY
# ─────────────────────────────────────────
class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = CategorySerializer
    queryset           = Category.objects.filter(is_active=True)
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['name']


# ─────────────────────────────────────────
# SUPPLIER
# ─────────────────────────────────────────
class SupplierViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = SupplierSerializer
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['name', 'contact_person', 'phone']

    def get_queryset(self):
        return Supplier.objects.filter(is_deleted=False, is_active=True)

    def destroy(self, request, *args, **kwargs):
        supplier = self.get_object()
        supplier.soft_delete()
        AuditService.log(
            user       = request.user,
            action     = 'delete',
            model_name = 'Supplier',
            object_id  = supplier.id,
            ip_address = AuditService.get_client_ip(request)
        )
        return Response({'message': 'Supplier deleted'}, status=204)


# ─────────────────────────────────────────
# PRODUCT
# ─────────────────────────────────────────
class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = ProductSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['category', 'supplier', 'is_active', 'is_featured']
    search_fields      = ['name', 'sku', 'barcode']
    ordering_fields    = ['name', 'stock_quantity', 'retail_price', 'created_at']

    def get_queryset(self):
        return Product.objects.select_related('supplier', 'category').filter(is_deleted=False)

    def update(self, request, *args, **kwargs):
        product  = self.get_object()
        old_data = ProductSerializer(product).data
        response = super().update(request, *args, **kwargs)
        product.refresh_from_db()
        new_data = ProductSerializer(product).data
        AuditService.log(
            user       = request.user,
            action     = 'update',
            model_name = 'Product',
            object_id  = product.id,
            old_value  = dict(old_data),
            new_value  = dict(new_data),
            ip_address = AuditService.get_client_ip(request)
        )
        return response

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        products = self.get_queryset().filter(is_active=True)
        low = [p for p in products if p.is_low_stock]
        serializer = self.get_serializer(low, many=True)
        return Response({'count': len(low), 'products': serializer.data})

    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        products = self.get_queryset().filter(stock_quantity=0, is_active=True)
        serializer = self.get_serializer(products, many=True)
        return Response({'count': products.count(), 'products': serializer.data})

    @action(detail=False, methods=['get'])
    def featured(self, request):
        products = self.get_queryset().filter(is_active=True, is_featured=True)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_barcode(self, request):
        barcode = request.query_params.get('code', '').strip()
        if not barcode:
            return Response({'error': 'Barcode required'}, status=400)
        product = get_object_or_404(Product, barcode=barcode, is_deleted=False)
        return Response(ProductSerializer(product).data)

    @action(detail=True, methods=['get'])
    def movement_history(self, request, pk=None):
        product   = self.get_object()
        movements = StockMovement.objects.filter(product=product).order_by('-created_at')[:50]
        return Response(StockMovementSerializer(movements, many=True).data)


# ─────────────────────────────────────────
# PURCHASE ORDER
# ─────────────────────────────────────────
class PurchaseOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = PurchaseOrderSerializer
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['status', 'supplier']

    def get_queryset(self):
        return PurchaseOrder.objects.prefetch_related(
            'items__product'
        ).select_related('supplier', 'warehouse').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def receive(self, request, pk=None):
        po = self.get_object()

        if po.status == 'cancelled':
            return Response({'error': 'Cancelled order receive nahi ho sakta'}, status=400)
        if po.status == 'received':
            return Response({'error': 'Already fully received'}, status=400)

        items_data = request.data.get('items', [])
        if not items_data:
            return Response({'error': 'Items list required'}, status=400)

        results = []

        for item_data in items_data:
            item         = get_object_or_404(PurchaseOrderItem, id=item_data['item_id'], purchase_order=po)
            qty_received = int(item_data.get('quantity_received', 0))

            if qty_received <= 0:
                continue

            max_allowed = item.pending_qty
            if qty_received > max_allowed:
                return Response({
                    'error': f"{item.product.name}: Max receive kar sakte hain {max_allowed}"
                }, status=400)

            StockService.receive_stock(
                product   = item.product,
                warehouse = po.warehouse,
                quantity  = qty_received,
                unit_cost = item.unit_cost,
                reference = f"PO-{po.id:04d}",
                user      = request.user,
            )

            item.quantity_received += qty_received
            item.save()

            results.append({
                'product':      item.product.name,
                'qty_received': qty_received,
                'new_stock':    item.product.stock_quantity,
            })

        all_items = po.items.all()
        if all(i.is_fully_received for i in all_items):
            po.status = 'received'
        else:
            po.status = 'partial'
        po.save()

        AuditService.log(
            user       = request.user,
            action     = 'receive',
            model_name = 'PurchaseOrder',
            object_id  = po.id,
            new_value  = results,
            ip_address = AuditService.get_client_ip(request)
        )

        return Response({
            'message':   'Stock received successfully!',
            'po_status': po.get_status_display(),
            'items':     results,
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        po = self.get_object()
        if po.status in ['received']:
            return Response({'error': 'Received order cancel nahi ho sakta'}, status=400)
        po.status = 'cancelled'
        po.save()
        return Response({'message': 'Purchase order cancelled'})


# ─────────────────────────────────────────
# WAREHOUSE
# ─────────────────────────────────────────
class WarehouseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = WarehouseSerializer
    queryset           = Warehouse.objects.filter(is_active=True)


# ─────────────────────────────────────────
# STOCK MOVEMENT
# ─────────────────────────────────────────
class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = StockMovementSerializer
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['product', 'movement_type', 'warehouse']

    def get_queryset(self):
        return StockMovement.objects.select_related(
            'product', 'warehouse', 'created_by'
        ).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def adjust(self, request):
        product_id   = request.data.get('product_id')
        warehouse_id = request.data.get('warehouse_id')
        quantity     = request.data.get('quantity')
        reason       = request.data.get('reason', '')

        if quantity is None:
            return Response({'error': 'Quantity required'}, status=400)

        product   = get_object_or_404(Product, id=product_id)
        warehouse = get_object_or_404(Warehouse, id=warehouse_id)

        try:
            movement = StockService.manual_adjustment(
                product   = product,
                warehouse = warehouse,
                quantity  = int(quantity),
                reason    = reason,
                user      = request.user,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        AuditService.log(
            user       = request.user,
            action     = 'adjust',
            model_name = 'Product',
            object_id  = product.id,
            new_value  = {'quantity': quantity, 'reason': reason},
            ip_address = AuditService.get_client_ip(request)
        )

        return Response(StockMovementSerializer(movement).data)


# ─────────────────────────────────────────
# LOW STOCK NOTIFICATION
# ─────────────────────────────────────────
class LowStockNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = LowStockNotificationSerializer

    def get_queryset(self):
        return LowStockNotification.objects.filter(
            is_resolved=False
        ).select_related('product').order_by('-created_at')

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        notif             = self.get_object()
        notif.is_resolved = True
        notif.resolved_at = timezone.now()
        notif.save()
        return Response({'message': 'Notification resolved'})