# inventory/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Supplier, Warehouse, Category, Product, StockBatch,
    PurchaseOrder, PurchaseOrderItem,
    StockMovement, InventoryAuditLog, LowStockNotification
)


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'first_name', 'last_name']


# ─────────────────────────────────────────
# CATEGORY
# ─────────────────────────────────────────
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['id', 'name', 'icon', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


# ─────────────────────────────────────────
# SUPPLIER
# ─────────────────────────────────────────
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = [
            'id', 'name', 'contact_person', 'phone',
            'email', 'address', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class SupplierMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = ['id', 'name', 'phone', 'email']


# ─────────────────────────────────────────
# WAREHOUSE
# ─────────────────────────────────────────
class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Warehouse
        fields = ['id', 'name', 'location', 'is_active', 'is_default']


# ─────────────────────────────────────────
# PRODUCT
# ─────────────────────────────────────────
class ProductSerializer(serializers.ModelSerializer):
    supplier_detail  = SupplierMinimalSerializer(source='supplier', read_only=True)
    category_detail  = CategorySerializer(source='category', read_only=True)
    is_low_stock     = serializers.BooleanField(read_only=True)
    is_out_of_stock  = serializers.BooleanField(read_only=True)
    profit_margin    = serializers.FloatField(read_only=True)
    discounted_price = serializers.FloatField(read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'description', 'image',
            # category & supplier
            'category', 'category_detail',
            'supplier', 'supplier_detail',
            # pricing
            'cost_price', 'retail_price', 'wholesale_price',
            'tax_rate', 'discount', 'discounted_price',
            # stock
            'stock_quantity', 'low_stock_threshold', 'reorder_quantity', 'unit',
            # flags
            'is_active', 'is_featured',
            # computed
            'is_low_stock', 'is_out_of_stock', 'profit_margin',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['sku', 'created_at', 'updated_at']

    def validate(self, attrs):
        cost   = attrs.get('cost_price',   getattr(self.instance, 'cost_price', 0))
        retail = attrs.get('retail_price', getattr(self.instance, 'retail_price', 0))
        if retail > 0 and cost > retail:
            raise serializers.ValidationError(
                "Cost price, retail price se zyada nahi ho sakti."
            )
        return attrs


class ProductMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = ['id', 'name', 'sku', 'barcode', 'stock_quantity', 'retail_price', 'wholesale_price', 'cost_price']


# ─────────────────────────────────────────
# STOCK BATCH
# ─────────────────────────────────────────
class StockBatchSerializer(serializers.ModelSerializer):
    product_name   = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model  = StockBatch
        fields = [
            'id', 'product', 'product_name',
            'warehouse', 'warehouse_name',
            'quantity', 'remaining_qty', 'cost_per_unit',
            'received_date', 'reference',
        ]
        read_only_fields = ['received_date']


# ─────────────────────────────────────────
# PURCHASE ORDER ITEMS
# ─────────────────────────────────────────
class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_detail    = ProductMinimalSerializer(source='product', read_only=True)
    total_price       = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    pending_qty       = serializers.IntegerField(read_only=True)
    is_fully_received = serializers.BooleanField(read_only=True)

    class Meta:
        model  = PurchaseOrderItem
        fields = [
            'id', 'product', 'product_detail',
            'quantity_ordered', 'quantity_received',
            'unit_cost',
            'total_price', 'pending_qty', 'is_fully_received',
        ]
        read_only_fields = ['quantity_received']

    def validate_quantity_ordered(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity kam az kam 1 honi chahiye.")
        return value

    def validate_unit_cost(self, value):
        if value <= 0:
            raise serializers.ValidationError("Unit cost 0 se zyada honi chahiye.")
        return value


class PurchaseOrderItemReceiveSerializer(serializers.Serializer):
    item_id           = serializers.IntegerField()
    quantity_received = serializers.IntegerField(min_value=1)


# ─────────────────────────────────────────
# PURCHASE ORDER
# ─────────────────────────────────────────
class PurchaseOrderSerializer(serializers.ModelSerializer):
    items             = PurchaseOrderItemSerializer(many=True)
    supplier_detail   = SupplierMinimalSerializer(source='supplier', read_only=True)
    warehouse_detail  = WarehouseSerializer(source='warehouse', read_only=True)
    created_by_detail = UserMinimalSerializer(source='created_by', read_only=True)
    status_display    = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = PurchaseOrder
        fields = [
            'id', 'supplier', 'supplier_detail',
            'warehouse', 'warehouse_detail',
            'status', 'status_display',
            'order_date', 'expected_date',
            'notes', 'total_amount',
            'items',
            'created_by', 'created_by_detail',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['total_amount', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        po = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item_data)
        po.recalculate_total()
        return po

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item_data)
            instance.recalculate_total()
        return instance

    def validate(self, attrs):
        if self.instance and self.instance.status in ['received', 'cancelled']:
            raise serializers.ValidationError(
                f"'{self.instance.get_status_display()}' order edit nahi ho sakta."
            )
        return attrs


class PurchaseOrderReceiveSerializer(serializers.Serializer):
    items = PurchaseOrderItemReceiveSerializer(many=True)


# ─────────────────────────────────────────
# STOCK MOVEMENT
# ─────────────────────────────────────────
class StockMovementSerializer(serializers.ModelSerializer):
    product_detail        = ProductMinimalSerializer(source='product', read_only=True)
    warehouse_detail      = WarehouseSerializer(source='warehouse', read_only=True)
    created_by_detail     = UserMinimalSerializer(source='created_by', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)

    class Meta:
        model  = StockMovement
        fields = [
            'id', 'product', 'product_detail',
            'warehouse', 'warehouse_detail',
            'movement_type', 'movement_type_display',
            'quantity', 'stock_before', 'stock_after',
            'unit_cost', 'reference', 'notes',
            'created_by', 'created_by_detail',
            'created_at',
        ]
        read_only_fields = ['stock_before', 'stock_after', 'created_by', 'created_at']


class ManualAdjustmentSerializer(serializers.Serializer):
    product_id   = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    quantity     = serializers.IntegerField()
    reason       = serializers.CharField(max_length=500, required=False, default='')

    def validate_quantity(self, value):
        if value == 0:
            raise serializers.ValidationError("Quantity 0 nahi ho sakti.")
        return value


# ─────────────────────────────────────────
# AUDIT LOG
# ─────────────────────────────────────────
class InventoryAuditLogSerializer(serializers.ModelSerializer):
    user_detail    = UserMinimalSerializer(source='user', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model  = InventoryAuditLog
        fields = [
            'id', 'user', 'user_detail',
            'action', 'action_display',
            'model_name', 'object_id',
            'old_value', 'new_value',
            'ip_address', 'timestamp',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────
# LOW STOCK NOTIFICATION
# ─────────────────────────────────────────
class LowStockNotificationSerializer(serializers.ModelSerializer):
    product_detail = ProductMinimalSerializer(source='product', read_only=True)

    class Meta:
        model  = LowStockNotification
        fields = [
            'id', 'product', 'product_detail',
            'stock_level', 'is_resolved', 'resolved_at',
            'created_at',
        ]
        read_only_fields = ['stock_level', 'resolved_at', 'created_at']