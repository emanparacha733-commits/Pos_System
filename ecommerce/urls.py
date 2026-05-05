from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicProductListView, PublicCategoryListView,
    PlaceOrderView, TrackOrderView,
    OnlineOrderViewSet, CartView,
    ProductReviewView, FlashSaleListView,
    CouponCheckView, CouponViewSet, FlashSaleViewSet
)

router = DefaultRouter()
router.register(r'orders', OnlineOrderViewSet)
router.register(r'coupons', CouponViewSet)
router.register(r'flash-sales', FlashSaleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('store/products/', PublicProductListView.as_view(), name='store-products'),
    path('store/categories/', PublicCategoryListView.as_view(), name='store-categories'),
    path('store/order/', PlaceOrderView.as_view(), name='place-order'),
    path('store/order/<int:order_id>/track/', TrackOrderView.as_view(), name='track-order'),
    path('store/cart/', CartView.as_view(), name='cart'),
    path('store/reviews/<int:product_id>/', ProductReviewView.as_view(), name='product-reviews'),
    path('store/flash-sales/', FlashSaleListView.as_view(), name='flash-sales'),
    path('store/coupon/check/', CouponCheckView.as_view(), name='coupon-check'),
]