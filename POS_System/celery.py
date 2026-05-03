# celery.py (project root mein)

import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')

app = Celery('your_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scheduled tasks
app.conf.beat_schedule = {
    # Rozana subah 8 baje stock report
    'daily-stock-report': {
        'task':     'inventory.tasks.daily_stock_report',
        'schedule': crontab(hour=8, minute=0),
    },
    # Har 6 ghante low stock check
    'auto-purchase-orders': {
        'task':     'inventory.tasks.auto_create_purchase_orders',
        'schedule': crontab(minute=0, hour='*/6'),
    },
}