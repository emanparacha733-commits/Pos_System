from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Category, Product, ProductVariant
from .serializers import CategorySerializer, ProductSerializer, ProductVariantSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'barcode', 'sku']
    ordering_fields = ['name', 'price', 'stock_qty']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Low stock products"""
        products = Product.objects.filter(is_active=True)
        low = [p for p in products if p.is_low_stock]
        serializer = self.get_serializer(low, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Featured products for eCommerce"""
        products = Product.objects.filter(is_active=True, is_featured=True)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """Update product stock"""
        product = self.get_object()
        qty = request.data.get('qty', 0)
        product.stock_qty += int(qty)
        product.save()
        return Response({'message': 'Stock updated', 'new_stock': product.stock_qty})


class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.filter(is_active=True)
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAuthenticated]