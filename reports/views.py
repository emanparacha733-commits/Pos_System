from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.db.models import Sum, Count, F, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from datetime import datetime, timedelta
from pos.models import Order, OrderItem
from .models import Expense
from .serializers import ExpenseSerializer


class SalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'daily')  # daily, weekly, monthly
        days = int(request.query_params.get('days', 30))

        start_date = datetime.now() - timedelta(days=days)
        orders = Order.objects.filter(
            created_at__gte=start_date,
            status='paid'
        )

        if period == 'daily':
            trunc = TruncDate('created_at')
        elif period == 'weekly':
            trunc = TruncWeek('created_at')
        else:
            trunc = TruncMonth('created_at')

        sales_data = orders.annotate(period=trunc).values('period').annotate(
            total_sales=Sum('total'),
            total_orders=Count('id'),
        ).order_by('period')

        # Summary
        total_revenue = orders.aggregate(Sum('total'))['total__sum'] or 0
        total_orders = orders.count()
        avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0

        return Response({
            'summary': {
                'total_revenue': total_revenue,
                'total_orders': total_orders,
                'avg_order_value': avg_order_value,
            },
            'chart_data': list(sales_data),
        })


class ProfitReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = datetime.now() - timedelta(days=days)

        # Revenue from paid orders
        orders = Order.objects.filter(created_at__gte=start_date, status='paid')
        total_revenue = orders.aggregate(Sum('total'))['total__sum'] or 0

        # Cost of goods sold
        order_items = OrderItem.objects.filter(
            order__created_at__gte=start_date,
            order__status='paid'
        )
        total_cogs = sum(
            item.qty * (item.product.cost_price or 0)
            for item in order_items.select_related('product')
        )

        # Expenses
        expenses = Expense.objects.filter(date__gte=start_date.date())
        total_expenses = expenses.aggregate(Sum('amount'))['amount__sum'] or 0

        gross_profit = total_revenue - total_cogs
        net_profit = gross_profit - total_expenses

        # Expenses by category
        expenses_by_category = expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')

        return Response({
            'total_revenue': total_revenue,
            'total_cogs': total_cogs,
            'gross_profit': gross_profit,
            'total_expenses': total_expenses,
            'net_profit': net_profit,
            'expenses_by_category': list(expenses_by_category),
        })


class TopProductsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = datetime.now() - timedelta(days=days)

        top_products = OrderItem.objects.filter(
            order__created_at__gte=start_date,
            order__status='paid'
        ).values(
            'product__id',
            'product__name',
        ).annotate(
            total_qty=Sum('qty'),
            total_revenue=Sum('total_price'),
        ).order_by('-total_qty')[:10]

        return Response(list(top_products))


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]