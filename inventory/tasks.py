# inventory/tasks.py

from celery import shared_task
from django.utils import timezone
from django.db.models import F


@shared_task(bind=True, max_retries=3)
def send_low_stock_alert(self, product_id):
    """Low stock hone pe notification bhejo"""
    try:
        from .models import Product
        product = Product.objects.get(id=product_id)

        # 1. System notification (database mein)
        create_system_notification(product)

        # 2. Email (agar configured ho)
        # send_low_stock_email(product)

        # 3. WhatsApp/SMS (agar configured ho)
        # send_whatsapp_message(product)

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


def create_system_notification(product):
    """Dashboard notification"""
    from .models import LowStockNotification
    print(
        f"[LOW STOCK ALERT] {product.name} | "
        f"Stock: {product.stock_quantity} | "
        f"Threshold: {product.low_stock_threshold}"
    )


@shared_task
def daily_stock_report():
    """Rozana subah stock report generate karo"""
    from .models import Product
    low_stock = Product.objects.filter(
        stock_quantity__lte=F('low_stock_threshold'),
        is_active=True,
        is_deleted=False
    )
    out_of_stock = Product.objects.filter(
        stock_quantity=0,
        is_active=True
    )

    print(f"[DAILY REPORT] Low Stock: {low_stock.count()} | Out of Stock: {out_of_stock.count()}")
    return {
        'low_stock_count':     low_stock.count(),
        'out_of_stock_count':  out_of_stock.count(),
        'date':                timezone.now().isoformat(),
    }


@shared_task
def auto_create_purchase_orders():
    """
    Low stock products ke liye automatically PO suggest karo
    Rozana check karta hai
    """
    from .models import Product, PurchaseOrder, PurchaseOrderItem, Warehouse

    low_stock_products = Product.objects.filter(
        stock_quantity__lte=F('low_stock_threshold'),
        supplier__isnull=False,
        is_active=True
    ).select_related('supplier')

    if not low_stock_products.exists():
        return "No low stock products"

    default_warehouse = Warehouse.objects.filter(is_default=True).first()
    if not default_warehouse:
        return "No default warehouse"

    # Supplier wise group karo
    supplier_products = {}
    for product in low_stock_products:
        supplier_id = product.supplier_id
        if supplier_id not in supplier_products:
            supplier_products[supplier_id] = {
                'supplier': product.supplier,
                'products': []
            }
        supplier_products[supplier_id]['products'].append(product)

    created_orders = []

    for supplier_id, data in supplier_products.items():
        po = PurchaseOrder.objects.create(
            supplier  = data['supplier'],
            warehouse = default_warehouse,
            status    = 'draft',
            notes     = f"Auto-generated on {timezone.now().date()}"
        )

        for product in data['products']:
            PurchaseOrderItem.objects.create(
                purchase_order   = po,
                product          = product,
                quantity_ordered = product.reorder_quantity,
                unit_cost        = product.cost_price,
            )

        po.recalculate_total()
        created_orders.append(f"PO-{po.id}")

    return f"Created: {', '.join(created_orders)}"