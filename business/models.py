from django.db import models

class Business(models.Model):
    BUSINESS_TYPES = [
        ('retail', 'Retail'),
        ('restaurant', 'Restaurant'),
        ('pharmacy', 'Pharmacy'),
        ('salon', 'Salon'),
        ('generic', 'Generic'),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=BUSINESS_TYPES, default='generic')
    logo = models.ImageField(upload_to='business/logos/', blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    currency = models.CharField(max_length=10, default='PKR')
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name