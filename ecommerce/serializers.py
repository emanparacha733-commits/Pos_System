from rest_framework import serializers
from .models import OnlineOrder, OnlineOrderItem, Cart
from products.models import Product


class OnlineOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = OnlineOrderItem
        fields = '__all__'


class OnlineOrderSerializer(serializers.ModelSerializer):
    items = OnlineOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = OnlineOrder
        fields = '__all__'


class PlaceOrderSerializer(serializers.Serializer):
    customer_name = serializers.CharField()
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    delivery_address = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField())
    shipping_cost = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)


class CartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = Cart
        fields = '__all__'