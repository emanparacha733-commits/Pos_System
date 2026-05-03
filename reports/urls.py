# reports/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OverviewReportView,
    SalesReportView,
    ProfitReportView,
    TopProductsView,
    SupplierReportView,
    CustomerReportView,
    TaxReportView,
    ExpenseViewSet,
)

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),

    # ── Report Endpoints ──────────────────────────────────────────
    # Frontend Reports.jsx inhe call karta hai:
    # ?period=today|week|month|quarter|year|custom
    # custom ke liye: &date_from=YYYY-MM-DD&date_to=YYYY-MM-DD

    path('overview/',   OverviewReportView.as_view(),  name='report-overview'),
    path('sales/',      SalesReportView.as_view(),     name='report-sales'),
    path('profit/',     ProfitReportView.as_view(),    name='report-profit'),
    path('products/',   TopProductsView.as_view(),     name='report-products'),
    path('suppliers/',  SupplierReportView.as_view(),  name='report-suppliers'),
    path('customers/',  CustomerReportView.as_view(),  name='report-customers'),
    path('tax/',        TaxReportView.as_view(),       name='report-tax'),
]


# ──────────────────────────────────────────────────────────────
# Sare endpoints summary:
#
# GET  /reports/overview/    → KPIs + revenue trend + category mix
# GET  /reports/sales/       → Daily revenue/COGS/profit breakdown
# GET  /reports/profit/      → Per-product margin + expense breakdown
# GET  /reports/products/    → Best sellers (units + revenue + margin)
# GET  /reports/suppliers/   → Supplier wise purchase report
# GET  /reports/customers/   → Customer wise purchase history
# GET  /reports/tax/         → Monthly tax breakdown
#
# GET  /reports/expenses/           → list expenses
# POST /reports/expenses/           → add expense
# PUT  /reports/expenses/{id}/      → update
# DELETE /reports/expenses/{id}/    → delete
# ──────────────────────────────────────────────────────────────