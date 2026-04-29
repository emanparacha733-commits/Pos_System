from rest_framework import serializers
from .models import Category, Product, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    discounted_price = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = '__all__'