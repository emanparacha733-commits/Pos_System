from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer
from .serializers import CustomerSerializer
from pos.models import Order
from pos.serializers import OrderSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'email']

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        customer = self.get_object()
        orders = Order.objects.filter(customer=customer).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)