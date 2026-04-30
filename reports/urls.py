from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalesReportView, ProfitReportView, TopProductsView, ExpenseViewSet

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('sales/', SalesReportView.as_view(), name='sales-report'),
    path('profit/', ProfitReportView.as_view(), name='profit-report'),
    path('top-products/', TopProductsView.as_view(), name='top-products'),
]