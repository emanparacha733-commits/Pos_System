from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import OnlineOrder, OnlineOrderItem, Cart
from .serializers import OnlineOrderSerializer, PlaceOrderSerializer, CartSerializer
from products.models import Product


class PublicProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from products.models import Product
        from products.serializers import ProductSerializer
        products = Product.objects.filter(is_active=True)
        search = request.query_params.get('search', '')
        category = request.query_params.get('category', '')
        if search:
            products = products.filter(name__icontains=search)
        if category:
            products = products.filter(category_id=category)
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


class PublicCategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from products.models import Category
        from products.serializers import CategorySerializer
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class PlaceOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        items_data = data.get('items', [])

        if not items_data:
            return Response({'error': 'No items in order'}, status=400)

        subtotal = 0
        order_items = []
        for item in items_data:
            product = get_object_or_404(Product, id=item['product_id'])
            qty = int(item['qty'])
            unit_price = float(product.price)
            total_price = unit_price * qty
            subtotal += total_price
            order_items.append({
                'product': product,
                'qty': qty,
                'unit_price': unit_price,
                'total_price': total_price,
            })

        shipping_cost = float(data.get('shipping_cost', 0))
        total = subtotal + shipping_cost

        order = OnlineOrder.objects.create(
            customer_name=data['customer_name'],
            customer_email=data.get('customer_email', ''),
            customer_phone=data.get('customer_phone', ''),
            delivery_address=data['delivery_address'],
            notes=data.get('notes', ''),
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,
        )

        for item in order_items:
            OnlineOrderItem.objects.create(
                order=order,
                product=item['product'],
                qty=item['qty'],
                unit_price=item['unit_price'],
                total_price=item['total_price'],
            )

        return Response({
            'message': 'Order placed successfully!',
            'order_id': order.id,
            'total': total,
        }, status=201)


class TrackOrderView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_id):
        order = get_object_or_404(OnlineOrder, id=order_id)
        serializer = OnlineOrderSerializer(order)
        return Response(serializer.data)


class OnlineOrderViewSet(viewsets.ModelViewSet):
    queryset = OnlineOrder.objects.all()
    serializer_class = OnlineOrderSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        delivery_status = request.data.get('delivery_status')
        payment_status = request.data.get('payment_status')
        if delivery_status:
            order.delivery_status = delivery_status
        if payment_status:
            order.payment_status = payment_status
        order.save()
        return Response({'message': 'Status updated successfully'})


class CartView(APIView):
    permission_classes = [AllowAny]

    def get_session(self, request):
        if not request.session.session_key:
            request.session.create()
        return request.session.session_key

    def get(self, request):
        session_key = self.get_session(request)
        cart_items = Cart.objects.filter(session_key=session_key)
        serializer = CartSerializer(cart_items, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        session_key = self.get_session(request)
        product_id = request.data.get('product_id')
        qty = int(request.data.get('qty', 1))
        product = get_object_or_404(Product, id=product_id)
        cart_item, created = Cart.objects.get_or_create(
            session_key=session_key,
            product=product,
            defaults={'qty': qty}
        )
        if not created:
            cart_item.qty += qty
            cart_item.save()
        return Response({'message': 'Added to cart'}, status=201)

    def delete(self, request):
        session_key = self.get_session(request)
        product_id = request.data.get('product_id')
        Cart.objects.filter(session_key=session_key, product_id=product_id).delete()
        return Response({'message': 'Removed from cart'})