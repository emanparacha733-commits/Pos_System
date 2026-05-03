# inventory/services.py
# Yahan sari business logic hai — views bilkul clean rahenge

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import (
    Product, StockBatch, StockMovement,
    PurchaseOrder, PurchaseOrderItem,
    LowStockNotification, InventoryAuditLog, Warehouse
)


class StockService:

    @staticmethod
    @transaction.atomic
    def receive_stock(product, warehouse, quantity, unit_cost, reference='', user=None):
        """
        Purchase order se maal aaya — stock update + FIFO batch create
        Race-safe: F() expression use karta hai
        """
        # Step 1: Stock before
        product.refresh_from_db()
        stock_before = product.stock_quantity

        # Step 2: Race-safe stock update
        Product.objects.filter(pk=product.pk).update(
            stock_quantity=F('stock_quantity') + quantity
        )
        product.refresh_from_db()

        # Step 3: FIFO Batch create
        StockBatch.objects.create(
            product       = product,
            warehouse     = warehouse,
            quantity      = quantity,
            remaining_qty = quantity,
            cost_per_unit = unit_cost,
            reference     = reference,
        )

        # Step 4: Movement log
        StockMovement.objects.create(
            product       = product,
            warehouse     = warehouse,
            movement_type = 'purchase',
            quantity      = quantity,
            stock_before  = stock_before,
            stock_after   = product.stock_quantity,
            unit_cost     = unit_cost,
            reference     = reference,
            created_by    = user,
        )

        # Step 5: Low stock resolve karo agar tha
        LowStockNotification.objects.filter(
            product=product, is_resolved=False
        ).update(is_resolved=True, resolved_at=timezone.now())

        return product

    @staticmethod
    @transaction.atomic
    def deduct_stock(product, warehouse, quantity, movement_type='sale',
                     reference='', user=None):
        """
        Sale ya damage — FIFO se deduct karta hai
        """
        product.refresh_from_db()

        if product.stock_quantity < quantity:
            raise ValueError(
                f"Insufficient stock. Available: {product.stock_quantity}, Requested: {quantity}"
            )

        stock_before = product.stock_quantity
        remaining    = quantity

        # FIFO — purane batches pehle use karo
        batches = StockBatch.objects.filter(
            product=product,
            warehouse=warehouse,
            remaining_qty__gt=0
        ).order_by('received_date')

        weighted_cost = 0
        total_used    = 0

        for batch in batches:
            if remaining <= 0:
                break

            use_qty = min(batch.remaining_qty, remaining)
            weighted_cost += use_qty * batch.cost_per_unit
            total_used    += use_qty

            batch.remaining_qty -= use_qty
            batch.save()
            remaining -= use_qty

        avg_cost = weighted_cost / total_used if total_used > 0 else 0

        # Race-safe deduct
        Product.objects.filter(pk=product.pk).update(
            stock_quantity=F('stock_quantity') - quantity
        )
        product.refresh_from_db()

        # Movement log
        StockMovement.objects.create(
            product       = product,
            warehouse     = warehouse,
            movement_type = movement_type,
            quantity      = -quantity,
            stock_before  = stock_before,
            stock_after   = product.stock_quantity,
            unit_cost     = avg_cost,
            reference     = reference,
            created_by    = user,
        )

        # Low stock check
        StockService.check_and_create_low_stock_alert(product)

        return product

    @staticmethod
    def check_and_create_low_stock_alert(product):
        """Low stock notification create karo"""
        if product.is_low_stock:
            # Duplicate notification nahi banana
            already_exists = LowStockNotification.objects.filter(
                product=product, is_resolved=False
            ).exists()

            if not already_exists:
                LowStockNotification.objects.create(
                    product     = product,
                    stock_level = product.stock_quantity,
                )
                # Celery task trigger
                from .tasks import send_low_stock_alert
                send_low_stock_alert.delay(product.id)

    @staticmethod
    @transaction.atomic
    def manual_adjustment(product, warehouse, quantity, reason, user=None):
        """
        Manual stock correction — damage, count correction etc.
        quantity positive = add, negative = deduct
        """
        product.refresh_from_db()
        stock_before = product.stock_quantity
        new_stock    = stock_before + quantity

        if new_stock < 0:
            raise ValueError("Stock 0 se neeche nahi ja sakta")

        Product.objects.filter(pk=product.pk).update(
            stock_quantity=F('stock_quantity') + quantity
        )
        product.refresh_from_db()

        movement = StockMovement.objects.create(
            product       = product,
            warehouse     = warehouse,
            movement_type = 'adjustment' if quantity >= 0 else 'damage',
            quantity      = quantity,
            stock_before  = stock_before,
            stock_after   = product.stock_quantity,
            notes         = reason,
            created_by    = user,
        )

        StockService.check_and_create_low_stock_alert(product)
        return movement


class AuditService:

    @staticmethod
    def log(user, action, model_name, object_id,
            old_value=None, new_value=None, ip_address=None):
        InventoryAuditLog.objects.create(
            user       = user,
            action     = action,
            model_name = model_name,
            object_id  = object_id,
            old_value  = old_value,
            new_value  = new_value,
            ip_address = ip_address,
        )

    @staticmethod
    def get_client_ip(request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0]
        return request.META.get('REMOTE_ADDR')