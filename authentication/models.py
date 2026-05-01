from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLES = [
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('cashier', 'Cashier'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLES, default='cashier')
    business = models.ForeignKey('business.Business', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"