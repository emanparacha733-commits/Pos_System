from django.db import models


class Expense(models.Model):

    CATEGORY_CHOICES = [
        ('rent', 'Rent'),
        ('salary', 'Salary'),
        ('utilities', 'Utilities'),
        ('supplies', 'Supplies'),
        ('marketing', 'Marketing'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    note = models.TextField(blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.amount}"

    class Meta:
        ordering = ['-date']