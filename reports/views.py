# reports/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from django.db.models import (
    Sum, Count, F, Q, Value, DecimalField,
    ExpressionWrapper, FloatField
)
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, Coalesce
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from pos.models import Order, OrderItem
from inventory.models import PurchaseOrder, PurchaseOrderItem, Supplier, Product
from .models import Expense
from .serializers import ExpenseSerializer


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def get_date_range(request):
    """
    Frontend se aane wale period params handle karta hai.
    period: today | week | month | quarter | year | custom
    custom ke liye: date_from + date_to
    """
    period    = request.query_params.get('period', 'month')
    now       = timezone.now()
    today     = now.date()

    if period == 'today':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end   = now
    elif period == 'week':
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end   = now
    elif period == 'month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end   = now
    elif period == 'quarter':
        quarter_start_month = ((now.month - 1) // 3) * 3 + 1
        start = now.replace(month=quarter_start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
        end   = now
    elif period == 'year':
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end   = now
    elif period == 'custom':
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        try:
            from datetime import datetime
            start = timezone.make_aware(datetime.strptime(date_from, '%Y-%m-%d'))
            end   = timezone.make_aware(datetime.strptime(date_to,   '%Y-%m-%d').replace(hour=23, minute=59, second=59))
        except (TypeError, ValueError):
            start = now - timedelta(days=30)
            end   = now
    else:
        start = now - timedelta(days=30)
        end   = now

    # Previous period (delta calculation ke liye)
    duration   = end - start
    prev_start = start - duration
    prev_end   = start

    return start, end, prev_start, prev_end


def delta_pct(current, previous):
    """Period-over-period % change"""
    try:
        if previous and previous != 0:
            return round(((float(current) - float(previous)) / float(previous)) * 100, 1)
    except Exception:
        pass
    return 0


def get_trunc(period):
    if period in ('today', 'week'):
        return TruncDate('created_at')
    elif period in ('quarter', 'year'):
        return TruncMonth('created_at')
    else:
        return TruncDate('created_at')


# ─────────────────────────────────────────
# OVERVIEW
# ─────────────────────────────────────────
class OverviewReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, prev_start, prev_end = get_date_range(request)

        orders      = Order.objects.filter(created_at__gte=start, created_at__lte=end, status='paid')
        prev_orders = Order.objects.filter(created_at__gte=prev_start, created_at__lte=prev_end, status='paid')

        total_revenue = orders.aggregate(v=Coalesce(Sum('total'), Value(0, output_field=DecimalField())))['v']
        prev_revenue  = prev_orders.aggregate(v=Coalesce(Sum('total'), Value(0, output_field=DecimalField())))['v']
        total_orders  = orders.count()
        prev_total_orders = prev_orders.count()
        items_sold    = OrderItem.objects.filter(order__in=orders).aggregate(v=Coalesce(Sum('qty'), Value(0)))['v']
        avg_order_value = round(total_revenue / total_orders, 2) if total_orders else 0
        prev_aov        = round(prev_revenue  / prev_total_orders, 2) if prev_total_orders else 0

        # Sales trend (daily)
        period = request.query_params.get('period', 'month')
        trunc  = get_trunc(period)
        sales_trend = (
            orders.annotate(label=trunc)
            .values('label')
            .annotate(revenue=Coalesce(Sum('total'), Value(0, output_field=DecimalField())))
            .order_by('label')
        )
        trend_data = [
            {'label': str(r['label']), 'revenue': float(r['revenue'])}
            for r in sales_trend
        ]

        # Category mix
        category_mix = (
            OrderItem.objects.filter(order__in=orders)
            .values(name=F('product__category'))
            .annotate(value=Coalesce(Sum('total_price'), Value(0, output_field=DecimalField())))
            .order_by('-value')
        )
        category_data = [
            {'name': r['name'].capitalize(), 'value': float(r['value'])}
            for r in category_mix
        ]

        return Response({
            'total_revenue':   float(total_revenue),
            'revenue_delta':   delta_pct(total_revenue, prev_revenue),
            'total_orders':    total_orders,
            'orders_delta':    delta_pct(total_orders,  prev_total_orders),
            'items_sold':      items_sold,
            'avg_order_value': float(avg_order_value),
            'aov_delta':       delta_pct(avg_order_value, prev_aov),
            'sales_trend':     trend_data,
            'category_mix':    category_data,
        })


# ─────────────────────────────────────────
# SALES TREND
# ─────────────────────────────────────────
class SalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, prev_start, prev_end = get_date_range(request)
        period = request.query_params.get('period', 'month')
        trunc  = get_trunc(period)

        orders = Order.objects.filter(created_at__gte=start, created_at__lte=end, status='paid')

        daily = (
            orders.annotate(label=trunc)
            .values('label')
            .annotate(
                orders=Count('id'),
                revenue=Coalesce(Sum('total'), Value(0, output_field=DecimalField())),
            )
            .order_by('label')
        )

        # COGS per day
        result = []
        for row in daily:
            day_label = row['label']
            day_items = OrderItem.objects.filter(
                order__in=orders.filter(**{f'created_at__date': day_label} if period not in ('quarter','year') else {}),
            ).select_related('product')

            # For month/quarter/year we group by truncated date
            if period in ('today', 'week', 'month'):
                day_items = OrderItem.objects.filter(
                    order__status='paid',
                    order__created_at__date=day_label,
                ).select_related('product')
            else:
                day_items = OrderItem.objects.filter(
                    order__status='paid',
                    order__created_at__year=day_label.year,
                    order__created_at__month=day_label.month,
                ).select_related('product')

            cogs = sum(
                float(item.qty) * float(item.product.cost_price or 0)
                for item in day_items
            )
            revenue     = float(row['revenue'])
            gross_profit= revenue - cogs
            margin      = round((gross_profit / revenue) * 100, 1) if revenue > 0 else 0

            result.append({
                'label':        str(day_label),
                'orders':       row['orders'],
                'revenue':      revenue,
                'cogs':         round(cogs, 2),
                'gross_profit': round(gross_profit, 2),
                'margin':       margin,
            })

        return Response({'daily': result})


# ─────────────────────────────────────────
# BEST SELLERS
# ─────────────────────────────────────────
class TopProductsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, _, _ = get_date_range(request)

        items = (
            OrderItem.objects.filter(
                order__created_at__gte=start,
                order__created_at__lte=end,
                order__status='paid',
            )
            .values(
                'product__id',
                'product__name',
                'product__category',
                'product__cost_price',
                'product__retail_price',
            )
            .annotate(
                units_sold=Sum('qty'),
                revenue=Coalesce(Sum('total_price'), Value(0, output_field=DecimalField())),
            )
            .order_by('-revenue')[:20]
        )

        result = []
        for r in items:
            revenue    = float(r['revenue'])
            cost_price = float(r['product__cost_price'] or 0)
            units      = r['units_sold'] or 0
            cogs       = cost_price * units
            profit     = revenue - cogs
            margin     = round((profit / revenue) * 100, 1) if revenue > 0 else 0

            result.append({
                'product_id':  r['product__id'],
                'name':        r['product__name'],
                'category':    r['product__category'],
                'cost_price':  cost_price,
                'sell_price':  float(r['product__retail_price'] or 0),
                'units_sold':  units,
                'revenue':     revenue,
                'profit':      round(profit, 2),
                'margin':      margin,
            })

        return Response({'best_sellers': result})


# ─────────────────────────────────────────
# PROFIT MARGINS
# ─────────────────────────────────────────
class ProfitReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, _, _ = get_date_range(request)

        orders = Order.objects.filter(
            created_at__gte=start, created_at__lte=end, status='paid'
        )
        total_revenue = float(
            orders.aggregate(v=Coalesce(Sum('total'), Value(0, output_field=DecimalField())))['v']
        )

        # COGS
        order_items = OrderItem.objects.filter(
            order__in=orders
        ).select_related('product')
        total_cogs = sum(
            float(i.qty) * float(i.product.cost_price or 0)
            for i in order_items
        )

        # Expenses
        expenses        = Expense.objects.filter(date__gte=start.date(), date__lte=end.date())
        total_expenses  = float(expenses.aggregate(v=Coalesce(Sum('amount'), Value(0, output_field=DecimalField())))['v'])
        gross_profit    = total_revenue - total_cogs
        net_profit      = gross_profit  - total_expenses
        avg_margin      = round((gross_profit / total_revenue) * 100, 1) if total_revenue > 0 else 0

        # Per product
        per_product = (
            OrderItem.objects.filter(order__in=orders)
            .values('product__name', 'product__category', 'product__cost_price', 'product__retail_price')
            .annotate(
                units_sold=Sum('qty'),
                revenue=Coalesce(Sum('total_price'), Value(0, output_field=DecimalField())),
            )
            .order_by('-revenue')
        )

        profit_by_product = []
        for r in per_product:
            rev   = float(r['revenue'])
            units = r['units_sold'] or 0
            cost  = float(r['product__cost_price'] or 0)
            cogs  = cost * units
            gp    = rev - cogs
            margin= round((gp / rev) * 100, 1) if rev > 0 else 0
            profit_by_product.append({
                'name':        r['product__name'],
                'category':    r['product__category'],
                'cost_price':  cost,
                'sell_price':  float(r['product__retail_price'] or 0),
                'units_sold':  units,
                'revenue':     rev,
                'gross_profit':round(gp, 2),
                'margin':      margin,
            })

        expenses_by_category = list(
            expenses.values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        return Response({
            'gross_profit':          round(gross_profit, 2),
            'net_profit':            round(net_profit, 2),
            'total_cogs':            round(total_cogs, 2),
            'total_expenses':        round(total_expenses, 2),
            'avg_margin':            avg_margin,
            'profit_by_product':     profit_by_product,
            'expenses_by_category':  expenses_by_category,
        })


# ─────────────────────────────────────────
# SUPPLIER PURCHASES
# ─────────────────────────────────────────
class SupplierReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, _, _ = get_date_range(request)

        suppliers = Supplier.objects.filter(is_deleted=False, is_active=True)
        result = []

        for supplier in suppliers:
            pos = PurchaseOrder.objects.filter(
                supplier=supplier,
                order_date__gte=start,
                order_date__lte=end,
            )
            total_orders   = pos.count()
            total_amount   = float(pos.aggregate(v=Coalesce(Sum('total_amount'), Value(0, output_field=DecimalField())))['v'])
            pending_pos    = pos.filter(status__in=['draft', 'sent', 'partial']).count()
            items_received = PurchaseOrderItem.objects.filter(
                purchase_order__in=pos
            ).aggregate(v=Coalesce(Sum('quantity_received'), Value(0)))['v'] or 0
            last_order = pos.order_by('-order_date').values_list('order_date', flat=True).first()

            if total_orders == 0:
                continue

            result.append({
                'supplier':       supplier.name,
                'total_orders':   total_orders,
                'items_received': items_received,
                'total_amount':   total_amount,
                'pending_pos':    pending_pos,
                'last_order':     str(last_order.date()) if last_order else None,
            })

        result.sort(key=lambda x: x['total_amount'], reverse=True)
        return Response({'supplier_purchases': result})


# ─────────────────────────────────────────
# CUSTOMER HISTORY
# ─────────────────────────────────────────
class CustomerReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, _, _ = get_date_range(request)

        orders = Order.objects.filter(
            created_at__gte=start,
            created_at__lte=end,
            status='paid',
        )

        # Customer wise group
        # customer=None wale walk-in hain — unhe alag handle karo
        customer_data = (
            orders
            .values(
                'customer__id',
                'customer__name',
                'customer__phone',
                'customer__customer_type',   # Customer model se
            )
            .annotate(
                total_orders=Count('id'),
                total_spent=Coalesce(Sum('total'), Value(0, output_field=DecimalField())),
                last_purchase=Sum('created_at'),   # placeholder — overridden below
            )
            .order_by('-total_spent')
        )

        # last_purchase ke liye alag query (F() annotate datetime pe aggregate nahi hoti)
        last_purchase_map = {
            r['customer__id']: r['lp']
            for r in orders.values('customer__id')
                           .annotate(lp=F('created_at'))
                           .order_by('customer__id', '-created_at')
                           .distinct('customer__id')
        } if hasattr(Order, 'customer_id') else {}

        result = []
        seen   = set()
        for r in customer_data:
            cid   = r.get('customer__id')
            key   = cid or 'walkin'
            if key in seen:
                continue
            seen.add(key)

            # Last purchase — fresh query
            lp_qs = orders.filter(customer_id=cid).order_by('-created_at').values_list('created_at', flat=True).first()

            spent = float(r['total_spent'])
            count = r['total_orders']
            result.append({
                'customer':      r.get('customer__name') or 'Walk-in Customer',
                'phone':         r.get('customer__phone') or '',
                'customer_type': r.get('customer__customer_type') or 'retail',
                'total_orders':  count,
                'total_spent':   spent,
                'avg_order':     round(spent / count, 2) if count else 0,
                'last_purchase': str(lp_qs)[:10] if lp_qs else None,
            })

        return Response({'customer_history': result})


# ─────────────────────────────────────────
# TAX REPORT
# ─────────────────────────────────────────
class TaxReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end, _, _ = get_date_range(request)
        period = request.query_params.get('period', 'month')

        orders = Order.objects.filter(
            created_at__gte=start,
            created_at__lte=end,
            status='paid',
        )

        # Order mein discount_amount field nahi — discount_type + discount_value hai
        # Actual discount = subtotal - total - tax_amount
        # Formula: discount = subtotal - (total - tax_amount)
        monthly = (
            orders.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                gross_sales=Coalesce(Sum('subtotal'),   Value(0, output_field=DecimalField())),
                tax_amount= Coalesce(Sum('tax_amount'), Value(0, output_field=DecimalField())),
                net_total=  Coalesce(Sum('total'),      Value(0, output_field=DecimalField())),
            )
            .order_by('month')
        )

        tax_rows = []
        for r in monthly:
            gross    = float(r['gross_sales'])
            tax      = float(r['tax_amount'])
            net_tot  = float(r['net_total'])
            # discount = subtotal - total + tax  (kyunki total = subtotal - discount + tax)
            disc     = round(gross - net_tot + tax, 2)
            taxable  = gross - disc
            tax_rate = round((tax / taxable) * 100, 1) if taxable > 0 else 0
            net      = taxable - tax

            tax_rows.append({
                'period':         r['month'].strftime('%b %Y'),
                'gross_sales':    gross,
                'discounts':      max(disc, 0),
                'taxable_amount': round(taxable, 2),
                'tax_rate':       tax_rate,
                'tax_amount':     round(tax, 2),
                'net_amount':     round(net, 2),
            })

        totals_qs = orders.aggregate(
            gross=Coalesce(Sum('subtotal'),   Value(0, output_field=DecimalField())),
            tax=  Coalesce(Sum('tax_amount'), Value(0, output_field=DecimalField())),
            nett= Coalesce(Sum('total'),      Value(0, output_field=DecimalField())),
        )
        gross    = float(totals_qs['gross'])
        tax      = float(totals_qs['tax'])
        nett     = float(totals_qs['nett'])
        disc     = gross - nett + tax
        taxable  = gross - max(disc, 0)

        return Response({
            'taxable_sales': round(taxable, 2),
            'tax_collected': round(tax, 2),
            'net_after_tax': round(taxable - tax, 2),
            'tax_rows':      tax_rows,
        })


# ─────────────────────────────────────────
# EXPENSE VIEWSET
# ─────────────────────────────────────────
class ExpenseViewSet(viewsets.ModelViewSet):
    queryset           = Expense.objects.all().order_by('-date')
    serializer_class   = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['category', 'date']
    ordering_fields    = ['date', 'amount']