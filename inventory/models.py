# inventory/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import F
from django.core.validators import MinValueValidator


# ─────────────────────────────────────────
# SUPPLIER
# ─────────────────────────────────────────
class Supplier(models.Model):
    name            = models.CharField(max_length=200)
    contact_person  = models.CharField(max_length=100, blank=True)
    phone           = models.CharField(max_length=20, blank=True)
    email           = models.EmailField(blank=True)
    address         = models.TextField(blank=True)
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    is_deleted      = models.BooleanField(default=False)
    deleted_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()


# ─────────────────────────────────────────
# WAREHOUSE
# ─────────────────────────────────────────
class Warehouse(models.Model):
    name       = models.CharField(max_length=100)
    location   = models.TextField(blank=True)
    is_active  = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_default:
            Warehouse.objects.exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


# ─────────────────────────────────────────
# CATEGORY
# ─────────────────────────────────────────
class Category(models.Model):
    name        = models.CharField(max_length=100)
    icon        = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']


# ─────────────────────────────────────────
# PRODUCT
# ─────────────────────────────────────────
class Product(models.Model):

    UNIT_CHOICES = [
        ('piece',  'Piece'),
        ('kg',     'Kilogram'),
        ('gram',   'Gram'),
        ('liter',  'Liter'),
        ('meter',  'Meter'),
        ('box',    'Box'),
        ('dozen',  'Dozen'),
    ]

    # Basic Info
    name            = models.CharField(max_length=255)
    sku             = models.CharField(max_length=100, unique=True, blank=True, null=True)
    barcode         = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description     = models.TextField(blank=True)
    image           = models.ImageField(upload_to='products/', blank=True, null=True)

    # Category & Supplier
    category        = models.ForeignKey(
                        Category, on_delete=models.SET_NULL,
                        null=True, blank=True, related_name='products'
                      )
    supplier        = models.ForeignKey(
                        Supplier, on_delete=models.SET_NULL,
                        null=True, blank=True, related_name='products'
                      )

    # Pricing
    cost_price      = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    retail_price    = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    tax_rate        = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount        = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Stock
    stock_quantity      = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    reorder_quantity    = models.IntegerField(default=50)
    unit                = models.CharField(max_length=20, choices=UNIT_CHOICES, default='piece')

    # Flags
    is_active       = models.BooleanField(default=True)
    is_featured     = models.BooleanField(default=False)
    is_deleted      = models.BooleanField(default=False)

    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes  = [
            models.Index(fields=['barcode']),
            models.Index(fields=['sku']),
            models.Index(fields=['stock_quantity']),
        ]

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold

    @property
    def is_out_of_stock(self):
        return self.stock_quantity <= 0

    @property
    def profit_margin(self):
        if self.retail_price > 0:
            return round(
                ((self.retail_price - self.cost_price) / self.retail_price) * 100, 2
            )
        return 0

    @property
    def discounted_price(self):
        if self.discount > 0:
            return round(float(self.retail_price) - (float(self.retail_price) * float(self.discount) / 100), 2)
        return self.retail_price

    def save(self, *args, **kwargs):
        if not self.sku:
            ts       = str(timezone.now().timestamp()).replace('.', '')[-6:]
            self.sku = f"PRD-{ts}"
        super().save(*args, **kwargs)


# ─────────────────────────────────────────
# STOCK BATCH (FIFO Costing)
# ─────────────────────────────────────────
class StockBatch(models.Model):
    product       = models.ForeignKey(Product, on_delete=models.PROTECT,
                                      related_name='batches')
    warehouse     = models.ForeignKey(Warehouse, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='batches')
    quantity      = models.IntegerField(default=0)
    remaining_qty = models.IntegerField(default=0)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    received_date = models.DateTimeField(default=timezone.now)
    reference     = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['received_date']

    def __str__(self):
        return f"{self.product.name} | Batch {self.id} | Remaining: {self.remaining_qty}"


# ─────────────────────────────────────────
# PURCHASE ORDER
# ─────────────────────────────────────────
class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft',     'Draft'),
        ('sent',      'Sent to Supplier'),
        ('partial',   'Partially Received'),
        ('received',  'Fully Received'),
        ('cancelled', 'Cancelled'),
    ]

    supplier      = models.ForeignKey(Supplier, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='purchase_orders')
    warehouse     = models.ForeignKey(Warehouse, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='purchase_orders')
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    order_date    = models.DateTimeField(default=timezone.now)
    expected_date = models.DateField(null=True, blank=True)
    notes         = models.TextField(blank=True)
    total_amount  = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_by    = models.ForeignKey(User, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='purchase_orders_created')
    updated_by    = models.ForeignKey(User, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='purchase_orders_updated')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PO-{self.id:04d} | {self.supplier.name if self.supplier else 'N/A'} | {self.get_status_display()}"

    def recalculate_total(self):
        from django.db.models import Sum
        total = self.items.aggregate(
            total=Sum(F('quantity_ordered') * F('unit_cost'))
        )['total'] or 0
        self.total_amount = total
        self.save(update_fields=['total_amount'])


# ─────────────────────────────────────────
# PURCHASE ORDER ITEMS
# ─────────────────────────────────────────
class PurchaseOrderItem(models.Model):
    purchase_order    = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE,
                                          related_name='items')
    product           = models.ForeignKey(Product, on_delete=models.SET_NULL,
                                          null=True, blank=True)
    quantity_ordered  = models.IntegerField(default=0)
    quantity_received = models.IntegerField(default=0)
    unit_cost         = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    @property
    def total_price(self):
        return self.quantity_ordered * self.unit_cost

    @property
    def pending_qty(self):
        return self.quantity_ordered - self.quantity_received

    @property
    def is_fully_received(self):
        return self.quantity_received >= self.quantity_ordered

    def __str__(self):
        return f"{self.product.name if self.product else 'N/A'} x {self.quantity_ordered}"


# ─────────────────────────────────────────
# STOCK MOVEMENT
# ─────────────────────────────────────────
class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ('purchase',   'Purchase Received'),
        ('sale',       'Sale'),
        ('return_in',  'Customer Return (In)'),
        ('return_out', 'Supplier Return (Out)'),
        ('damage',     'Damage / Loss'),
        ('adjustment', 'Manual Adjustment'),
        ('transfer',   'Warehouse Transfer'),
    ]

    product       = models.ForeignKey(Product, on_delete=models.PROTECT,
                                      related_name='movements')
    warehouse     = models.ForeignKey(Warehouse, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity      = models.IntegerField(default=0)
    stock_before  = models.IntegerField(default=0)
    stock_after   = models.IntegerField(default=0)
    unit_cost     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reference     = models.CharField(max_length=100, blank=True)
    notes         = models.TextField(blank=True)
    created_by    = models.ForeignKey(User, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='stock_movements')
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['product', 'created_at']),
            models.Index(fields=['movement_type']),
        ]

    def __str__(self):
        return f"{self.product.name} | {self.movement_type} | {self.quantity}"


# ─────────────────────────────────────────
# AUDIT LOG
# ─────────────────────────────────────────
class InventoryAuditLog(models.Model):
    ACTION_CHOICES = [
        ('create',  'Created'),
        ('update',  'Updated'),
        ('delete',  'Deleted'),
        ('receive', 'Stock Received'),
        ('adjust',  'Stock Adjusted'),
    ]

    user       = models.ForeignKey(User, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='audit_logs')
    action     = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=50)
    object_id  = models.IntegerField(default=0)
    old_value  = models.JSONField(null=True, blank=True)
    new_value  = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} | {self.action} | {self.model_name} | {self.timestamp}"


# ─────────────────────────────────────────
# LOW STOCK NOTIFICATION
# ─────────────────────────────────────────
class LowStockNotification(models.Model):
    product     = models.ForeignKey(Product, on_delete=models.CASCADE,
                                    related_name='notifications')
    stock_level = models.IntegerField(default=0)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} | Stock: {self.stock_level}"