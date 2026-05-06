from django.core.management.base import BaseCommand
from customers.models import Customer


class Command(BaseCommand):
    help = 'Seed customers with test data for Al-Junaid Books & Stationery'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true', help='Pehle sab delete karo')

    def handle(self, *args, **kwargs):
        if kwargs['flush']:
            Customer.objects.all().delete()
            self.stdout.write('🗑️  Purana data delete kar diya')

        self.stdout.write('🌱 Customers seed shuru...\n')
        self.stdout.write('👥  Customers bana raha hoon...')

        customers_data = [
            # Retail Customers
            {'name': 'Ahmed Ali',          'phone': '0300-1111111', 'email': 'ahmed@gmail.com',    'address': 'Raja Bazaar, Rawalpindi',     'customer_type': 'retail',    'loyalty_points': 150,  'credit_balance': 0},
            {'name': 'Fatima Malik',       'phone': '0301-2222222', 'email': 'fatima@gmail.com',   'address': 'Saddar, Rawalpindi',          'customer_type': 'retail',    'loyalty_points': 320,  'credit_balance': 500},
            {'name': 'Hassan Raza',        'phone': '0302-3333333', 'email': 'hassan@gmail.com',   'address': 'Satellite Town, Rawalpindi',  'customer_type': 'retail',    'loyalty_points': 80,   'credit_balance': 0},
            {'name': 'Ayesha Khan',        'phone': '0303-4444444', 'email': 'ayesha@gmail.com',   'address': 'Bahria Town, Rawalpindi',     'customer_type': 'retail',    'loyalty_points': 450,  'credit_balance': 1200},
            {'name': 'Usman Tariq',        'phone': '0304-5555555', 'email': '',                   'address': 'Chaklala, Rawalpindi',        'customer_type': 'retail',    'loyalty_points': 60,   'credit_balance': 0},
            {'name': 'Zainab Hussain',     'phone': '0305-6666666', 'email': 'zainab@yahoo.com',   'address': 'Peshawar Road, Rawalpindi',   'customer_type': 'retail',    'loyalty_points': 200,  'credit_balance': 0},
            {'name': 'Bilal Ahmed',        'phone': '0306-7777777', 'email': '',                   'address': 'Committee Chowk, Rawalpindi', 'customer_type': 'retail',    'loyalty_points': 35,   'credit_balance': 300},
            {'name': 'Sana Iqbal',         'phone': '0307-8888888', 'email': 'sana@gmail.com',     'address': 'Westridge, Rawalpindi',       'customer_type': 'retail',    'loyalty_points': 520,  'credit_balance': 0},
            {'name': 'Tariq Mehmood',      'phone': '0308-9999999', 'email': '',                   'address': 'Morgah, Rawalpindi',          'customer_type': 'retail',    'loyalty_points': 10,   'credit_balance': 0},
            {'name': 'Rabia Noor',         'phone': '0309-1010101', 'email': 'rabia@gmail.com',    'address': 'Gulraiz, Rawalpindi',         'customer_type': 'retail',    'loyalty_points': 275,  'credit_balance': 750},
            {'name': 'Imran Sheikh',       'phone': '0310-1111112', 'email': '',                   'address': 'Dhoke Syedan, Rawalpindi',    'customer_type': 'retail',    'loyalty_points': 90,   'credit_balance': 0},
            {'name': 'Maira Zaidi',        'phone': '0311-2222223', 'email': 'maira@hotmail.com',  'address': 'Chakri Road, Rawalpindi',     'customer_type': 'retail',    'loyalty_points': 180,  'credit_balance': 0},
            {'name': 'Faisal Qureshi',     'phone': '0312-3333334', 'email': '',                   'address': 'Adiala Road, Rawalpindi',     'customer_type': 'retail',    'loyalty_points': 40,   'credit_balance': 200},
            {'name': 'Nadia Pervez',       'phone': '0313-4444445', 'email': 'nadia@gmail.com',    'address': 'Taxila, Rawalpindi',          'customer_type': 'retail',    'loyalty_points': 330,  'credit_balance': 0},
            {'name': 'Kamran Baig',        'phone': '0314-5555556', 'email': '',                   'address': 'Wah Cantt, Rawalpindi',       'customer_type': 'retail',    'loyalty_points': 125,  'credit_balance': 0},

            # Wholesale Customers
            {'name': 'City Book Center',   'phone': '0321-1234567', 'email': 'city@books.pk',      'address': 'Urdu Bazaar, Lahore',         'customer_type': 'wholesale', 'loyalty_points': 1200, 'credit_balance': 15000},
            {'name': 'Al-Noor Stationers', 'phone': '0322-2345678', 'email': 'alnoor@stat.pk',     'address': 'Saddar Bazaar, Karachi',      'customer_type': 'wholesale', 'loyalty_points': 850,  'credit_balance': 8500},
            {'name': 'Star Book Depot',    'phone': '0333-3456789', 'email': 'star@depot.pk',      'address': 'Anarkali, Lahore',            'customer_type': 'wholesale', 'loyalty_points': 2100, 'credit_balance': 25000},
            {'name': 'Pak Stationery',     'phone': '0344-4567890', 'email': 'pak@stat.pk',        'address': 'Bolton Market, Karachi',      'customer_type': 'wholesale', 'loyalty_points': 670,  'credit_balance': 5000},
            {'name': 'National Books',     'phone': '0355-5678901', 'email': 'national@books.pk',  'address': 'Urdu Bazaar, Rawalpindi',     'customer_type': 'wholesale', 'loyalty_points': 1500, 'credit_balance': 20000},
        ]

        created_count = 0
        retail_count = 0
        wholesale_count = 0

        for cd in customers_data:
            obj, created = Customer.objects.get_or_create(
                phone=cd['phone'],
                defaults={
                    'name':           cd['name'],
                    'email':          cd['email'] or None,
                    'address':        cd['address'],
                    'customer_type':  cd['customer_type'],
                    'loyalty_points': cd['loyalty_points'],
                    'credit_balance': cd['credit_balance'],
                    'is_active':      True,
                }
            )
            if created:
                created_count += 1
                if cd['customer_type'] == 'retail':
                    retail_count += 1
                else:
                    wholesale_count += 1

            status = '✓ Naya' if created else '→ Exists'
            type_icon = '🛒' if cd['customer_type'] == 'retail' else '🏭'
            credit = f" | Credit: Rs.{cd['credit_balance']:,}" if cd['credit_balance'] > 0 else ''
            self.stdout.write(
                f'   {status} {type_icon} {cd["name"]:<25} Points: {cd["loyalty_points"]:<5}{credit}'
            )

        # ── Summary ───────────────────────────────────────
        total = Customer.objects.count()
        self.stdout.write('\n' + '─' * 60)
        self.stdout.write(self.style.SUCCESS('✅  Customers seed complete!'))
        self.stdout.write(f'   👥 Total Customers : {total}')
        self.stdout.write(f'   🛒 Retail          : {retail_count} naye')
        self.stdout.write(f'   🏭 Wholesale       : {wholesale_count} naye')
        self.stdout.write(f'   ⭐ Total Points    : {sum(c["loyalty_points"] for c in customers_data):,}')
        self.stdout.write(f'   💳 Total Credit    : Rs. {sum(c["credit_balance"] for c in customers_data):,}')
        self.stdout.write('─' * 60)