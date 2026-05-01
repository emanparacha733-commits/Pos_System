from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicProductListView, PublicCategoryListView,
    PlaceOrderView, TrackOrderView,
    OnlineOrderViewSet, CartView
)

router = DefaultRouter()
router.register(r'orders', OnlineOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('store/products/', PublicProductListView.as_view(), name='store-products'),
    path('store/categories/', PublicCategoryListView.as_view(), name='store-categories'),
    path('store/order/', PlaceOrderView.as_view(), name='place-order'),
    path('store/order/<int:order_id>/track/', TrackOrderView.as_view(), name='track-order'),
    path('store/cart/', CartView.as_view(), name='cart'),
]