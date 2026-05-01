from django.contrib import admin
from .models import OnlineOrder, OnlineOrderItem, Cart

admin.site.register(OnlineOrder)
admin.site.register(OnlineOrderItem)
admin.site.register(Cart)