# customers/models.py

from django.db import models


class Customer(models.Model):
    CUSTOMER_TYPE_CHOICES = [
        ('retail',    'Retail'),
        ('wholesale', 'Wholesale'),
    ]

    name           = models.CharField(max_length=200)
    phone          = models.CharField(max_length=20, blank=True)
    email          = models.EmailField(blank=True, null=True)
    address        = models.TextField(blank=True)
    customer_type  = models.CharField(
                        max_length=20,
                        choices=CUSTOMER_TYPE_CHOICES,
                        default='retail'
                     )
    loyalty_points = models.IntegerField(default=0)
    credit_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']