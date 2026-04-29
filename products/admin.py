from django.contrib import admin
from .models import Category, Product, ProductVariant


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'cost_price', 'stock_qty', 'is_active', 'is_featured']
    search_fields = ['name', 'barcode', 'sku']
    list_filter = ['category', 'is_active', 'is_featured', 'unit']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'name', 'price', 'stock_qty', 'is_active']