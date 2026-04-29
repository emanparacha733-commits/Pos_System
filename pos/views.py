from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer, OrderItemSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related('customer', 'cashier')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer__name', 'cashier__username']
    ordering_fields = ['created_at', 'total']

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        serializer.save(cashier=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Aaj ke orders"""
        from django.utils import timezone
        today = timezone.now().date()
        orders = Order.objects.filter(created_at__date=today)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Sales summary"""
        from django.utils import timezone
        from django.db.models import Sum, Count
        today = timezone.now().date()
        today_orders = Order.objects.filter(created_at__date=today, status='paid')
        total_sales = today_orders.aggregate(Sum('total'))['total__sum'] or 0
        total_orders = today_orders.aggregate(Count('id'))['id__count'] or 0
        return Response({
            'today_sales': total_sales,
            'today_orders': total_orders,
        })

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Order refund"""
        order = self.get_object()
        order.status = 'refunded'
        order.save()
        # Stock wapas karo
        for item in order.items.all():
            item.product.stock_qty += item.qty
            item.product.save()
        return Response({'message': 'Order refunded successfully'})