# pos/serializers.py

from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import Order, OrderItem
from products.models import Product
from customers.models import Customer


# ─────────────────────────────────────────
# ORDER ITEM
# ─────────────────────────────────────────
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku  = serializers.CharField(source='product.sku',  read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['id', 'product', 'product_name', 'product_sku',
                  'qty', 'unit_price', 'total_price']


class CreateOrderItemSerializer(serializers.Serializer):
    product     = serializers.IntegerField()
    qty         = serializers.IntegerField(min_value=1)
    unit_price  = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)


# ─────────────────────────────────────────
# ORDER — Read
# ─────────────────────────────────────────
class OrderSerializer(serializers.ModelSerializer):
    items            = OrderItemSerializer(many=True, read_only=True)
    customer_name    = serializers.CharField(source='customer.name',  read_only=True)
    customer_phone   = serializers.CharField(source='customer.phone', read_only=True)
    customer_type    = serializers.CharField(source='customer.customer_type', read_only=True)
    cashier_username = serializers.CharField(source='cashier.username', read_only=True)
    status_display   = serializers.CharField(source='get_status_display', read_only=True)
    payment_display  = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone', 'customer_type',
            'cashier', 'cashier_username',
            'subtotal', 'discount_type', 'discount_value',
            'tax_amount', 'total',
            'payment_method', 'payment_display',
            'amount_received', 'change_amount',
            'status', 'status_display',
            'notes', 'items',
            'created_at',
        ]
        read_only_fields = ['cashier', 'created_at']


# ─────────────────────────────────────────
# ORDER — Create
# ─────────────────────────────────────────
class CreateOrderSerializer(serializers.Serializer):
    customer          = serializers.IntegerField(required=False, allow_null=True)
    items             = CreateOrderItemSerializer(many=True)
    subtotal          = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount_type     = serializers.ChoiceField(choices=['flat', 'percent'], default='flat')
    discount_value    = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    category_discount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    loyalty_discount  = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount        = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    total             = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method    = serializers.ChoiceField(choices=['cash', 'card', 'jazzcash', 'easypaisa', 'split'], default='cash')
    split_payments    = serializers.ListField(child=serializers.DictField(), required=False, allow_null=True)
    amount_received   = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    change_amount     = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    status            = serializers.ChoiceField(choices=['paid', 'hold', 'refunded'], default='paid')
    points_earned     = serializers.IntegerField(default=0)
    notes             = serializers.CharField(required=False, allow_blank=True, default='')

    @transaction.atomic
    def create(self, validated_data):
        items_data    = validated_data.pop('items')
        customer_id   = validated_data.pop('customer', None)
        split_payments= validated_data.pop('split_payments', None)
        points_earned = validated_data.pop('points_earned', 0)
        category_disc = validated_data.pop('category_discount', 0)
        loyalty_disc  = validated_data.pop('loyalty_discount', 0)
        cashier       = self.context['request'].user

        customer = None
        if customer_id:
            try:
                customer = Customer.objects.get(id=customer_id)
            except Customer.DoesNotExist:
                pass

        # Order create
        order = Order.objects.create(
            customer       = customer,
            cashier        = cashier,
            subtotal       = validated_data['subtotal'],
            discount_type  = validated_data['discount_type'],
            discount_value = validated_data['discount_value'],
            tax_amount     = validated_data['tax_amount'],
            total          = validated_data['total'],
            payment_method = validated_data['payment_method'],
            amount_received= validated_data.get('amount_received', 0),
            change_amount  = validated_data.get('change_amount', 0),
            status         = validated_data.get('status', 'paid'),
            notes          = validated_data.get('notes', ''),
        )

        # Order items + stock deduct
        for item_data in items_data:
            product = Product.objects.select_for_update().get(id=item_data['product'])

            OrderItem.objects.create(
                order       = order,
                product     = product,
                qty         = item_data['qty'],
                unit_price  = item_data['unit_price'],
                total_price = item_data['total_price'],
            )

            # Stock deduct — inventory app ka stock_quantity
            if hasattr(product, 'stock_quantity'):
                Product.objects.filter(pk=product.pk).update(
                    stock_quantity=max(0, product.stock_quantity - item_data['qty'])
                )
            # Legacy stock_qty field support
            elif hasattr(product, 'stock_qty'):
                Product.objects.filter(pk=product.pk).update(
                    stock_qty=max(0, product.stock_qty - item_data['qty'])
                )

        # Loyalty points update
        if customer and points_earned > 0 and order.status == 'paid':
            if hasattr(customer, 'loyalty_points'):
                Customer.objects.filter(pk=customer.pk).update(
                    loyalty_points=customer.loyalty_points + points_earned
                )

        # Loyalty points deduct agar use kiye
        loyalty_points_used = int(float(loyalty_disc))
        if customer and loyalty_points_used > 0:
            if hasattr(customer, 'loyalty_points'):
                Customer.objects.filter(pk=customer.pk).update(
                    loyalty_points=max(0, customer.loyalty_points - loyalty_points_used)
                )

        return order

    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data