from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import OnlineOrder, OnlineOrderItem, Cart, Coupon, ProductReview, FlashSale
from .serializers import (
    OnlineOrderSerializer, PlaceOrderSerializer, CartSerializer,
    CouponSerializer, ProductReviewSerializer, FlashSaleSerializer
)
from products.models import Product


class PublicProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from products.models import Product
        from products.serializers import ProductSerializer
        products = Product.objects.filter(is_active=True)
        search = request.query_params.get('search', '')
        category = request.query_params.get('category', '')
        featured = request.query_params.get('featured', '')
        if search:
            products = products.filter(name__icontains=search)
        if category:
            products = products.filter(category_id=category)
        if featured:
            products = products.filter(is_featured=True)
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


# ─── Coupon Check ──────────────────────────────────────────────────
class CouponCheckView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code', '').upper()
        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
        except Coupon.DoesNotExist:
            return Response({'error': 'Invalid coupon code'}, status=400)

        if coupon.expires_at and coupon.expires_at < timezone.now():
            return Response({'error': 'Coupon has expired'}, status=400)

        if coupon.used_count >= coupon.max_uses:
            return Response({'error': 'Coupon usage limit reached'}, status=400)

        return Response({
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': float(coupon.discount_value),
            'min_order_amount': float(coupon.min_order_amount),
        })


# ─── Place Order ───────────────────────────────────────────────────
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
            # Flash sale price check
            active_flash = FlashSale.objects.filter(
                product=product,
                is_active=True,
                starts_at__lte=timezone.now(),
                ends_at__gte=timezone.now()
            ).first()
            unit_price = float(active_flash.sale_price) if active_flash else float(product.price)
            total_price = unit_price * qty
            subtotal += total_price
            order_items.append({
                'product': product,
                'qty': qty,
                'unit_price': unit_price,
                'total_price': total_price,
            })

        shipping_cost = float(data.get('shipping_cost', 0))
        discount_amount = 0
        coupon_obj = None

        # Coupon apply
        coupon_code = data.get('coupon_code', '').upper()
        if coupon_code:
            try:
                coupon_obj = Coupon.objects.get(code=coupon_code, is_active=True)
                if subtotal >= float(coupon_obj.min_order_amount):
                    if coupon_obj.discount_type == 'flat':
                        discount_amount = float(coupon_obj.discount_value)
                    else:
                        discount_amount = subtotal * float(coupon_obj.discount_value) / 100
                    coupon_obj.used_count += 1
                    coupon_obj.save()
            except Coupon.DoesNotExist:
                pass

        total = subtotal + shipping_cost - discount_amount

        order = OnlineOrder.objects.create(
            customer_name=data['customer_name'],
            customer_email=data.get('customer_email', ''),
            customer_phone=data.get('customer_phone', ''),
            delivery_address=data['delivery_address'],
            notes=data.get('notes', ''),
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            discount_amount=discount_amount,
            total=total,
            coupon=coupon_obj,
        )

        for item in order_items:
            OnlineOrderItem.objects.create(
                order=order,
                product=item['product'],
                qty=item['qty'],
                unit_price=item['unit_price'],
                total_price=item['total_price'],
            )

        # Cart clear
        session_key = request.session.session_key
        if session_key:
            Cart.objects.filter(session_key=session_key).delete()

        return Response({
            'message': 'Order placed successfully!',
            'order_id': order.id,
            'total': total,
        }, status=201)


# ─── Track Order ───────────────────────────────────────────────────
class TrackOrderView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, order_id):
        order = get_object_or_404(OnlineOrder, id=order_id)
        serializer = OnlineOrderSerializer(order)
        return Response(serializer.data)


# ─── Online Order Admin ViewSet ────────────────────────────────────
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


# ─── Cart ──────────────────────────────────────────────────────────
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


# ─── Reviews ───────────────────────────────────────────────────────
class ProductReviewView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        reviews = ProductReview.objects.filter(product_id=product_id)
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, product_id):
        data = request.data.copy()
        data['product'] = product_id
        serializer = ProductReviewSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# ─── Flash Sales ───────────────────────────────────────────────────
class FlashSaleListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        now = timezone.now()
        sales = FlashSale.objects.filter(
            is_active=True,
            starts_at__lte=now,
            ends_at__gte=now
        )
        serializer = FlashSaleSerializer(sales, many=True, context={'request': request})
        return Response(serializer.data)


# ─── Coupon Admin ViewSet ──────────────────────────────────────────
class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]


# ─── Flash Sale Admin ViewSet ──────────────────────────────────────
class FlashSaleViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all()
    serializer_class = FlashSaleSerializer
    permission_classes = [IsAuthenticated]