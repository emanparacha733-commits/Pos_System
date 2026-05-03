# inventory/signals.py

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Product, PurchaseOrder


@receiver(pre_save, sender=Product)
def track_stock_change(sender, instance, **kwargs):
    """Stock change detect karo"""
    if instance.pk:
        try:
            old = Product.objects.get(pk=instance.pk)
            instance._old_stock = old.stock_quantity
        except Product.DoesNotExist:
            instance._old_stock = 0


@receiver(post_save, sender=Product)
def handle_stock_change(sender, instance, created, **kwargs):
    """Agar stock low threshold cross kare toh alert"""
    if not created:
        old_stock = getattr(instance, '_old_stock', None)
        if old_stock is not None and old_stock != instance.stock_quantity:
            if instance.is_low_stock:
                from .tasks import send_low_stock_alert
                send_low_stock_alert.delay(instance.id)


@receiver(post_save, sender=PurchaseOrder)
def po_status_changed(sender, instance, created, **kwargs):
    """PO received hone pe kuch aur karna ho toh"""
    if not created and instance.status == 'received':
        print(f"[PO COMPLETE] {instance} fully received!")