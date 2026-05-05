# inventory/management/commands/seed_inventory.py
"""
Al-Junaid Books & Stationery — Inventory Seed Data
Models: Supplier, Warehouse, Category, Product, StockBatch,
        PurchaseOrder, PurchaseOrderItem, StockMovement, LowStockNotification

Run : python manage.py seed_inventory
Fresh: python manage.py seed_inventory --flush
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta, date


class Command(BaseCommand):
    help = 'Inventory ka mukammal sample data seed karta hai — Al-Junaid Books'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Pehle existing inventory data delete karo, phir seed karo',
        )

    def handle(self, *args, **options):
        from inventory.models import (
            Supplier, Warehouse, Category, Product,
            StockBatch, PurchaseOrder, PurchaseOrderItem,
            StockMovement, LowStockNotification,
        )

        now = timezone.now()

        if options['flush']:
            self.stdout.write(self.style.WARNING('⚠  Purana inventory data delete ho raha hai...'))
            LowStockNotification.objects.all().delete()
            StockMovement.objects.all().delete()
            StockBatch.objects.all().delete()
            PurchaseOrderItem.objects.all().delete()
            PurchaseOrder.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Supplier.objects.all().delete()
            Warehouse.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✓  Saaf ho gaya\n'))

        # ─────────────────────────────────────────────────────────
        # 1. WAREHOUSES
        # ─────────────────────────────────────────────────────────
        self.stdout.write('🏠  Warehouses bana raha hoon...')

        warehouses_data = [
            {
                'name': 'Main Store — Raja Bazar',
                'location': 'Shop 12, Raja Bazar, Rawalpindi',
                'is_active': True,
                'is_default': True,
            },
            {
                'name': 'Back Storage Room',
                'location': 'Peeche wala kamra — Same building',
                'is_active': True,
                'is_default': False,
            },
        ]

        warehouses = {}
        for w in warehouses_data:
            obj, created = Warehouse.objects.get_or_create(
                name=w['name'], defaults=w
            )
            warehouses[obj.name] = obj
            self.stdout.write(f'   {"✓ Naya" if created else "→ Pehle se"}: {obj.name}')

        main_warehouse = warehouses['Main Store — Raja Bazar']

        # ─────────────────────────────────────────────────────────
        # 2. SUPPLIERS
        # ─────────────────────────────────────────────────────────
        self.stdout.write('\n🏭  Suppliers bana raha hoon...')

        suppliers_data = [
            {
                'name': 'Maktaba Al-Bushra',
                'contact_person': 'Hafiz Imran',
                'phone': '042-35761234',
                'email': 'maktaba.bushra@gmail.com',
                'address': 'Urdu Bazar, Lahore',
                'is_active': True,
            },
            {
                'name': 'Oxford University Press Pakistan',
                'contact_person': 'Mr. Saleem Akhtar',
                'phone': '021-35640610',
                'email': 'orders@oup.com.pk',
                'address': 'Korangi Industrial Area, Karachi',
                'is_active': True,
            },
            {
                'name': 'Sang-e-Meel Publications',
                'contact_person': 'Afzal Sahib',
                'phone': '042-37220100',
                'email': 'info@sang-e-meel.com',
                'address': '25 Lower Mall, Lahore',
                'is_active': True,
            },
            {
                'name': 'Al-Faisal Stationery Wholesale',
                'contact_person': 'Faisal Mehmood',
                'phone': '051-2255443',
                'email': 'alfaisal.stat@gmail.com',
                'address': 'Raja Bazar, Rawalpindi',
                'is_active': True,
            },
            {
                'name': 'Ferozesons Publishers',
                'contact_person': 'Ms. Nadia Feroz',
                'phone': '042-36360071',
                'email': 'orders@ferozesons.com',
                'address': '60 Shahrah-e-Quaid-e-Azam, Lahore',
                'is_active': True,
            },
        ]

        suppliers = {}
        for s in suppliers_data:
            obj, created = Supplier.objects.get_or_create(
                name=s['name'], defaults=s
            )
            suppliers[obj.name] = obj
            self.stdout.write(f'   {"✓ Naya" if created else "→ Pehle se"}: {obj.name}')

        # ─────────────────────────────────────────────────────────
        # 3. CATEGORIES
        # ─────────────────────────────────────────────────────────
        self.stdout.write('\n📁  Categories bana raha hoon...')

        categories_data = [
            {'name': 'Islamic Books',       'icon': '🕌', 'description': 'Quran, Hadees, Fiqh, Seerat'},
            {'name': 'Educational Books',   'icon': '📚', 'description': 'Matric, FSc, O-Level, CSS'},
            {'name': 'Stationery',          'icon': '✏️',  'description': 'Pens, notebooks, geometry sets'},
            {'name': 'Children Books',      'icon': '🧒', 'description': 'Qaida, stories, coloring books'},
            {'name': 'Urdu Literature',     'icon': '📖', 'description': 'Afsane, novels, shayari'},
            {'name': 'English Literature',  'icon': '🌍', 'description': 'Novels, self-help, classics'},
        ]

        categories = {}
        for c in categories_data:
            obj, created = Category.objects.get_or_create(
                name=c['name'], defaults=c
            )
            categories[obj.name] = obj
            self.stdout.write(f'   {"✓ Naya" if created else "→ Pehle se"}: {obj.name}')

        # ─────────────────────────────────────────────────────────
        # 4. PRODUCTS
        # ─────────────────────────────────────────────────────────
        self.stdout.write('\n📦  Products bana raha hoon...')

        products_data = [
            # ── Islamic Books ──────────────────────────────────
            {
                'name': 'Riyaaz ul Jannah',
                'sku': 'ISL-001',
                'barcode': '6920000000001',
                'description': 'Imam Nawawi ki mashhoor hadees ki kitab. Roz marra ke liye zaroori.',
                'category': 'Islamic Books',
                'supplier': 'Maktaba Al-Bushra',
                'cost_price': Decimal('300.00'),
                'retail_price': Decimal('450.00'),
                'wholesale_price': Decimal('337.50'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 85,
                'low_stock_threshold': 15,
                'reorder_quantity': 50,
                'unit': 'piece',
                'is_featured': True,
            },
            {
                'name': 'Al-Hidaayah (4 Volumes)',
                'sku': 'ISL-002',
                'barcode': '6920000000002',
                'description': 'Hanafi fiqh ki bunyaadi reference kitab. Madaris ke liye.',
                'category': 'Islamic Books',
                'supplier': 'Maktaba Al-Bushra',
                'cost_price': Decimal('1800.00'),
                'retail_price': Decimal('2800.00'),
                'wholesale_price': Decimal('2240.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 12,
                'low_stock_threshold': 5,
                'reorder_quantity': 10,
                'unit': 'piece',
                'is_featured': True,
            },
            {
                'name': 'Seerat-un-Nabi (SAW) — Shibli Nomani',
                'sku': 'ISL-003',
                'barcode': '6920000000003',
                'description': '6 jildon mein mukammal seerat. Urdu mein behtareen.',
                'category': 'Islamic Books',
                'supplier': 'Maktaba Al-Bushra',
                'cost_price': Decimal('750.00'),
                'retail_price': Decimal('1200.00'),
                'wholesale_price': Decimal('936.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 34,
                'low_stock_threshold': 10,
                'reorder_quantity': 20,
                'unit': 'piece',
                'is_featured': True,
            },
            {
                'name': 'Fazail-e-Amaal',
                'sku': 'ISL-004',
                'barcode': '6920000000004',
                'description': 'Hazrat Sheikh Zakariyya ki kitab. Ghar mein zaroori.',
                'category': 'Islamic Books',
                'supplier': 'Maktaba Al-Bushra',
                'cost_price': Decimal('240.00'),
                'retail_price': Decimal('380.00'),
                'wholesale_price': Decimal('266.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 120,
                'low_stock_threshold': 20,
                'reorder_quantity': 60,
                'unit': 'piece',
                'is_featured': False,
            },
            {
                'name': 'Quran Majeed (Tajweedi)',
                'sku': 'ISL-005',
                'barcode': '6920000000005',
                'description': 'Rang birangi tajweed marks ke sath. A4. Makkah print.',
                'category': 'Islamic Books',
                'supplier': 'Maktaba Al-Bushra',
                'cost_price': Decimal('420.00'),
                'retail_price': Decimal('650.00'),
                'wholesale_price': Decimal('468.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 200,
                'low_stock_threshold': 25,
                'reorder_quantity': 100,
                'unit': 'piece',
                'is_featured': True,
            },

            # ── Educational Books ──────────────────────────────
            {
                'name': 'Matric Chemistry Complete Guide',
                'sku': 'EDU-001',
                'barcode': '6920000000006',
                'description': 'Class 9 & 10. Punjab Board. Solved past papers included.',
                'category': 'Educational Books',
                'supplier': 'Oxford University Press Pakistan',
                'cost_price': Decimal('200.00'),
                'retail_price': Decimal('320.00'),
                'wholesale_price': Decimal('224.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 67,
                'low_stock_threshold': 15,
                'reorder_quantity': 40,
                'unit': 'piece',
                'is_featured': False,
            },
            {
                'name': 'FSc Physics Part 1 — Key Book',
                'sku': 'EDU-002',
                'barcode': '6920000000007',
                'description': 'FSc Part 1 Physics. Numerical aur MCQs ke sath.',
                'category': 'Educational Books',
                'supplier': 'Oxford University Press Pakistan',
                'cost_price': Decimal('175.00'),
                'retail_price': Decimal('280.00'),
                'wholesale_price': Decimal('196.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 95,
                'low_stock_threshold': 20,
                'reorder_quantity': 50,
                'unit': 'piece',
                'is_featured': False,
            },
            {
                'name': 'O-Level Mathematics Workbook',
                'sku': 'EDU-003',
                'barcode': '6920000000008',
                'description': 'Cambridge O-Level Maths. Past papers 2010–2024.',
                'category': 'Educational Books',
                'supplier': 'Oxford University Press Pakistan',
                'cost_price': Decimal('1200.00'),
                'retail_price': Decimal('1800.00'),
                'wholesale_price': Decimal('1476.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 18,
                'low_stock_threshold': 5,
                'reorder_quantity': 15,
                'unit': 'piece',
                'is_featured': True,
            },
            {
                'name': 'CSS Complete Guide — Political Science',
                'sku': 'EDU-004',
                'barcode': '6920000000009',
                'description': 'CSS/PMS preparation. Current affairs + past papers.',
                'category': 'Educational Books',
                'supplier': 'Oxford University Press Pakistan',
                'cost_price': Decimal('600.00'),
                'retail_price': Decimal('950.00'),
                'wholesale_price': Decimal('779.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 22,
                'low_stock_threshold': 8,
                'reorder_quantity': 20,
                'unit': 'piece',
                'is_featured': False,
            },

            # ── Stationery ─────────────────────────────────────
            {
                'name': 'Classmate Notebook Pack (10 pcs)',
                'sku': 'STA-001',
                'barcode': '6920000000010',
                'description': '200 page notebooks. Ruled + unruled.',
                'category': 'Stationery',
                'supplier': 'Al-Faisal Stationery Wholesale',
                'cost_price': Decimal('165.00'),
                'retail_price': Decimal('250.00'),
                'wholesale_price': Decimal('170.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 300,
                'low_stock_threshold': 50,
                'reorder_quantity': 100,
                'unit': 'box',
                'is_featured': False,
            },
            {
                'name': 'Pilot G2 Pen Set (12 pcs)',
                'sku': 'STA-002',
                'barcode': '6920000000011',
                'description': 'Original Pilot G2. Assorted colors.',
                'category': 'Stationery',
                'supplier': 'Al-Faisal Stationery Wholesale',
                'cost_price': Decimal('300.00'),
                'retail_price': Decimal('480.00'),
                'wholesale_price': Decimal('360.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 150,
                'low_stock_threshold': 20,
                'reorder_quantity': 50,
                'unit': 'box',
                'is_featured': True,
            },
            {
                'name': 'Geometry Box — Maped',
                'sku': 'STA-003',
                'barcode': '6920000000012',
                'description': 'Complete set. Compass, protractor, set squares.',
                'category': 'Stationery',
                'supplier': 'Al-Faisal Stationery Wholesale',
                'cost_price': Decimal('240.00'),
                'retail_price': Decimal('380.00'),
                'wholesale_price': Decimal('273.60'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 75,
                'low_stock_threshold': 15,
                'reorder_quantity': 30,
                'unit': 'piece',
                'is_featured': False,
            },
            {
                'name': 'A4 Paper Ream — Double A (500 sheets)',
                'sku': 'STA-004',
                'barcode': '6920000000013',
                'description': '80gsm. Printer aur photocopy ke liye.',
                'category': 'Stationery',
                'supplier': 'Al-Faisal Stationery Wholesale',
                'cost_price': Decimal('750.00'),
                'retail_price': Decimal('1100.00'),
                'wholesale_price': Decimal('880.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 8,           # ⚠️ LOW STOCK
                'low_stock_threshold': 10,
                'reorder_quantity': 20,
                'unit': 'piece',
                'is_featured': False,
            },
            {
                'name': 'Stapler + 1000 Pins Set',
                'sku': 'STA-005',
                'barcode': '6920000000014',
                'description': 'Heavy duty stapler. 1000 pins free.',
                'category': 'Stationery',
                'supplier': 'Al-Faisal Stationery Wholesale',
                'cost_price': Decimal('180.00'),
                'retail_price': Decimal('280.00'),
                'wholesale_price': Decimal('210.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 40,
                'low_stock_threshold': 10,
                'reorder_quantity': 25,
                'unit': 'piece',
                'is_featured': False,
            },

            # ── Children Books ─────────────────────────────────
            {
                'name': 'Alif Bay Pay — Qaida for Kids',
                'sku': 'CHD-001',
                'barcode': '6920000000015',
                'description': 'Bachon ke liye pehli Urdu qaida. Colorful.',
                'category': 'Children Books',
                'supplier': 'Ferozesons Publishers',
                'cost_price': Decimal('75.00'),
                'retail_price': Decimal('120.00'),
                'wholesale_price': Decimal('78.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 180,
                'low_stock_threshold': 30,
                'reorder_quantity': 80,
                'unit': 'piece',
                'is_featured': True,
            },
            {
                'name': 'Moral Stories for Children (Urdu)',
                'sku': 'CHD-002',
                'barcode': '6920000000016',
                'description': '50 kahaniyan. 5–12 saal ke bachon ke liye.',
                'category': 'Children Books',
                'supplier': 'Ferozesons Publishers',
                'cost_price': Decimal('220.00'),
                'retail_price': Decimal('350.00'),
                'wholesale_price': Decimal('262.50'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 55,
                'low_stock_threshold': 10,
                'reorder_quantity': 30,
                'unit': 'piece',
                'is_featured': False,
            },
            {
                'name': 'Noorani Qaida (Color)',
                'sku': 'CHD-003',
                'barcode': '6920000000017',
                'description': 'Quran sikhne ki pehli kitab. Rang birangi.',
                'category': 'Children Books',
                'supplier': 'Maktaba Al-Bushra',
                'cost_price': Decimal('60.00'),
                'retail_price': Decimal('100.00'),
                'wholesale_price': Decimal('70.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 7,           # ⚠️ LOW STOCK
                'low_stock_threshold': 20,
                'reorder_quantity': 50,
                'unit': 'piece',
                'is_featured': False,
            },

            # ── Urdu Literature ────────────────────────────────
            {
                'name': 'Manto ke Afsane',
                'sku': 'URD-001',
                'barcode': '6920000000018',
                'description': 'Saadat Hasan Manto ke muntakhab afsane.',
                'category': 'Urdu Literature',
                'supplier': 'Sang-e-Meel Publications',
                'cost_price': Decimal('340.00'),
                'retail_price': Decimal('520.00'),
                'wholesale_price': Decimal('416.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 30,
                'low_stock_threshold': 8,
                'reorder_quantity': 20,
                'unit': 'piece',
                'is_featured': True,
            },
            {
                'name': 'Bano Qudsia — Raja Gidh',
                'sku': 'URD-002',
                'barcode': '6920000000019',
                'description': 'Urdu adab ka masterpiece.',
                'category': 'Urdu Literature',
                'supplier': 'Sang-e-Meel Publications',
                'cost_price': Decimal('440.00'),
                'retail_price': Decimal('680.00'),
                'wholesale_price': Decimal('544.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 25,
                'low_stock_threshold': 8,
                'reorder_quantity': 15,
                'unit': 'piece',
                'is_featured': False,
            },

            # ── English Literature ─────────────────────────────
            {
                'name': 'Atomic Habits — James Clear',
                'sku': 'ENG-001',
                'barcode': '6920000000020',
                'description': 'International bestseller. Habits ka scientific tarika.',
                'category': 'English Literature',
                'supplier': 'Oxford University Press Pakistan',
                'cost_price': Decimal('800.00'),
                'retail_price': Decimal('1250.00'),
                'wholesale_price': Decimal('1000.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 40,
                'low_stock_threshold': 10,
                'reorder_quantity': 20,
                'unit': 'piece',
                'is_featured': True,
            },
            {
                'name': 'To Kill a Mockingbird — Harper Lee',
                'sku': 'ENG-002',
                'barcode': '6920000000021',
                'description': 'Pulitzer Prize winning novel. Original edition.',
                'category': 'English Literature',
                'supplier': 'Oxford University Press Pakistan',
                'cost_price': Decimal('580.00'),
                'retail_price': Decimal('890.00'),
                'wholesale_price': Decimal('712.00'),
                'tax_rate': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'stock_quantity': 4,           # ⚠️ LOW STOCK
                'low_stock_threshold': 5,
                'reorder_quantity': 15,
                'unit': 'piece',
                'is_featured': False,
            },
        ]

        products = {}
        for p_data in products_data:
            cat_name = p_data.pop('category')
            sup_name = p_data.pop('supplier')
            name = p_data['name']

            obj, created = Product.objects.get_or_create(
                sku=p_data['sku'],
                defaults={
                    **p_data,
                    'category': categories[cat_name],
                    'supplier': suppliers[sup_name],
                }
            )
            products[obj.name] = obj
            low = ' ⚠️ LOW' if obj.is_low_stock else ''
            self.stdout.write(
                f'   {"✓ Naya" if created else "→ Pehle se"}: '
                f'{obj.name[:40]:<40} stock={obj.stock_quantity:>4}{low}'
            )

        # ─────────────────────────────────────────────────────────
        # 5. STOCK BATCHES (FIFO)
        # ─────────────────────────────────────────────────────────
        self.stdout.write('\n📋  Stock Batches bana raha hoon (FIFO)...')

        batch_data = [
            # Old batch (almost used up)
            ('Riyaaz ul Jannah',         main_warehouse, 50,  10, Decimal('295.00'), now - timedelta(days=60), 'PO-INIT-001'),
            ('Riyaaz ul Jannah',         main_warehouse, 50,  75, Decimal('300.00'), now - timedelta(days=20), 'PO-2025-001'),

            ('Al-Hidaayah (4 Volumes)',  main_warehouse, 10,   7, Decimal('1750.00'), now - timedelta(days=90), 'PO-INIT-002'),
            ('Al-Hidaayah (4 Volumes)',  main_warehouse, 10,   5, Decimal('1800.00'), now - timedelta(days=25), 'PO-2025-001'),

            ('Quran Majeed (Tajweedi)',   main_warehouse, 100, 100, Decimal('415.00'), now - timedelta(days=45), 'PO-INIT-003'),
            ('Quran Majeed (Tajweedi)',   main_warehouse, 100, 100, Decimal('420.00'), now - timedelta(days=20), 'PO-2025-001'),

            ('Fazail-e-Amaal',           main_warehouse, 60,  60, Decimal('235.00'), now - timedelta(days=30), 'PO-INIT-004'),
            ('Fazail-e-Amaal',           main_warehouse, 60,  60, Decimal('240.00'), now - timedelta(days=20), 'PO-2025-001'),

            ('Matric Chemistry Complete Guide', main_warehouse, 40, 40, Decimal('200.00'), now - timedelta(days=12), 'PO-2025-002'),
            ('FSc Physics Part 1 — Key Book',   main_warehouse, 50, 50, Decimal('175.00'), now - timedelta(days=12), 'PO-2025-002'),
            ('O-Level Mathematics Workbook',    main_warehouse, 15, 15, Decimal('1200.00'), now - timedelta(days=12), 'PO-2025-002'),

            ('Classmate Notebook Pack (10 pcs)', main_warehouse, 150, 150, Decimal('162.00'), now - timedelta(days=40), 'PO-INIT-005'),
            ('Classmate Notebook Pack (10 pcs)', main_warehouse, 150, 150, Decimal('165.00'), now - timedelta(days=5),  'PO-2025-003'),

            ('Pilot G2 Pen Set (12 pcs)',        main_warehouse, 100, 100, Decimal('295.00'), now - timedelta(days=35), 'PO-INIT-006'),
            ('Pilot G2 Pen Set (12 pcs)',        main_warehouse,  50,  50, Decimal('300.00'), now - timedelta(days=5),  'PO-2025-003'),

            ('A4 Paper Ream — Double A (500 sheets)', main_warehouse, 10, 8, Decimal('750.00'), now - timedelta(days=5), 'PO-2025-003'),

            ('Alif Bay Pay — Qaida for Kids',    main_warehouse, 80, 80, Decimal('75.00'), now - timedelta(days=25), 'PO-INIT-007'),
            ('Alif Bay Pay — Qaida for Kids',    main_warehouse, 100, 100, Decimal('75.00'), now - timedelta(days=5), 'PO-FEROZESONS'),

            ('Noorani Qaida (Color)',             main_warehouse, 50, 7, Decimal('60.00'), now - timedelta(days=50), 'PO-INIT-008'),

            ('Atomic Habits — James Clear',      main_warehouse, 40, 40, Decimal('800.00'), now - timedelta(days=15), 'PO-INIT-009'),
            ('To Kill a Mockingbird — Harper Lee', main_warehouse, 15, 4, Decimal('580.00'), now - timedelta(days=20), 'PO-INIT-010'),
        ]

        for pname, warehouse, qty, remaining, cost, recv_date, ref in batch_data:
            product = products.get(pname)
            if not product:
                continue
            if not StockBatch.objects.filter(product=product, reference=ref).exists():
                StockBatch.objects.create(
                    product=product,
                    warehouse=warehouse,
                    quantity=qty,
                    remaining_qty=remaining,
                    cost_per_unit=cost,
                    received_date=recv_date,
                    reference=ref,
                )
        self.stdout.write(f'   ✓ {StockBatch.objects.count()} batches created')

        # ─────────────────────────────────────────────────────────
        # 6. PURCHASE ORDERS
        # ─────────────────────────────────────────────────────────
        self.stdout.write('\n🛒  Purchase Orders bana raha hoon...')

        po_data = [
            {
                'supplier': 'Maktaba Al-Bushra',
                'warehouse': main_warehouse,
                'status': 'received',
                'order_date': now - timedelta(days=22),
                'expected_date': (now - timedelta(days=15)).date(),
                'notes': 'Eid se pehle urgent Islamic books order',
                'items': [
                    ('Riyaaz ul Jannah',         50, Decimal('300.00'), 50),
                    ('Fazail-e-Amaal',            60, Decimal('240.00'), 60),
                    ('Quran Majeed (Tajweedi)',   30, Decimal('420.00'), 30),
                ],
            },
            {
                'supplier': 'Oxford University Press Pakistan',
                'warehouse': main_warehouse,
                'status': 'received',
                'order_date': now - timedelta(days=14),
                'expected_date': (now - timedelta(days=8)).date(),
                'notes': 'Back to school season — educational books',
                'items': [
                    ('Matric Chemistry Complete Guide', 40, Decimal('200.00'), 40),
                    ('FSc Physics Part 1 — Key Book',   50, Decimal('175.00'), 50),
                    ('O-Level Mathematics Workbook',    15, Decimal('1200.00'), 15),
                ],
            },
            {
                'supplier': 'Al-Faisal Stationery Wholesale',
                'warehouse': main_warehouse,
                'status': 'partial',
                'order_date': now - timedelta(days=6),
                'expected_date': (now + timedelta(days=2)).date(),
                'notes': 'Stationery restock — A4 paper urgent',
                'items': [
                    ('Classmate Notebook Pack (10 pcs)',       100, Decimal('165.00'), 100),
                    ('Pilot G2 Pen Set (12 pcs)',               50, Decimal('300.00'),  50),
                    ('A4 Paper Ream — Double A (500 sheets)',   20, Decimal('750.00'),  10),  # partial
                ],
            },
            {
                'supplier': 'Sang-e-Meel Publications',
                'warehouse': main_warehouse,
                'status': 'sent',
                'order_date': now - timedelta(days=2),
                'expected_date': (now + timedelta(days=5)).date(),
                'notes': 'Urdu adab restock',
                'items': [
                    ('Manto ke Afsane',          20, Decimal('340.00'), 0),
                    ('Bano Qudsia — Raja Gidh',  15, Decimal('440.00'), 0),
                ],
            },
            {
                'supplier': 'Maktaba Al-Bushra',
                'warehouse': main_warehouse,
                'status': 'draft',
                'order_date': now,
                'expected_date': (now + timedelta(days=7)).date(),
                'notes': 'Noorani Qaida urgent — stock khatam ho raha hai',
                'items': [
                    ('Noorani Qaida (Color)',                50, Decimal('60.00'),  0),
                    ('To Kill a Mockingbird — Harper Lee',   15, Decimal('580.00'), 0),
                ],
            },
        ]

        for po in po_data:
            items = po.pop('items')
            sup = suppliers[po.pop('supplier')]
            order_date = po.pop('order_date')

            existing = PurchaseOrder.objects.filter(
                supplier=sup, status=po['status'],
                notes=po['notes']
            ).first()

            if existing:
                self.stdout.write(f'   → Pehle se: PO-{existing.id:04d}')
                continue

            new_po = PurchaseOrder.objects.create(supplier=sup, **po)
            PurchaseOrder.objects.filter(pk=new_po.pk).update(order_date=order_date)

            total = Decimal('0')
            for pname, qty_ord, cost, qty_recv in items:
                product = products.get(pname)
                if product:
                    PurchaseOrderItem.objects.create(
                        purchase_order=new_po,
                        product=product,
                        quantity_ordered=qty_ord,
                        quantity_received=qty_recv,
                        unit_cost=cost,
                    )
                    total += cost * qty_ord

            PurchaseOrder.objects.filter(pk=new_po.pk).update(total_amount=total)
            self.stdout.write(
                f'   ✓ PO-{new_po.id:04d} [{po["status"]:10}] '
                f'{sup.name[:30]:<30} Rs. {total:>10,.0f}'
            )

        # ─────────────────────────────────────────────────────────
        # 7. STOCK MOVEMENTS
        # ─────────────────────────────────────────────────────────
        self.stdout.write('\n📊  Stock Movements record kar raha hoon...')

        movements = [
            # Purchase received
            ('Riyaaz ul Jannah',          'purchase',   50,  35,  85, Decimal('300.00'), 'PO-2025-001', 'Maktaba Al-Bushra se maal aaya'),
            ('Fazail-e-Amaal',            'purchase',   60,  60, 120, Decimal('240.00'), 'PO-2025-001', 'Maktaba Al-Bushra se maal aaya'),
            ('Quran Majeed (Tajweedi)',    'purchase',  100, 100, 200, Decimal('420.00'), 'PO-2025-001', 'Maktaba Al-Bushra se maal aaya'),
            ('Matric Chemistry Complete Guide','purchase', 40, 27,  67, Decimal('200.00'), 'PO-2025-002', 'OUP se maal aaya'),
            ('FSc Physics Part 1 — Key Book', 'purchase', 50, 45,  95, Decimal('175.00'), 'PO-2025-002', 'OUP se maal aaya'),
            ('Classmate Notebook Pack (10 pcs)','purchase',100,200,300,Decimal('165.00'), 'PO-2025-003', 'Al-Faisal se maal aaya'),
            ('Pilot G2 Pen Set (12 pcs)', 'purchase',   50, 100, 150, Decimal('300.00'), 'PO-2025-003', 'Al-Faisal se maal aaya'),

            # Sales
            ('Riyaaz ul Jannah',          'sale',       -2,  87,  85, Decimal('450.00'), 'TXN-001', 'Walk-in sale'),
            ('Fazail-e-Amaal',            'sale',       -1, 121, 120, Decimal('380.00'), 'TXN-001', 'Walk-in sale'),
            ('Quran Majeed (Tajweedi)',    'sale',       -1, 201, 200, Decimal('650.00'), 'TXN-002', 'JazzCash payment'),
            ('Matric Chemistry Complete Guide','sale',   -2,  69,  67, Decimal('320.00'), 'TXN-003', 'Student walk-in'),
            ('Geometry Box — Maped',      'sale',       -1,  76,  75, Decimal('380.00'), 'TXN-003', 'Student walk-in'),
            ('Atomic Habits — James Clear','sale',      -1,  41,  40, Decimal('1250.00'),'TXN-004', 'Card + Easypaisa split'),
            ('Pilot G2 Pen Set (12 pcs)', 'sale',       -2, 152, 150, Decimal('480.00'), 'TXN-006', 'Walk-in sale'),
            ('Manto ke Afsane',           'sale',       -1,  31,  30, Decimal('520.00'), 'TXN-005', 'Cash sale'),

            # Customer return
            ('FSc Physics Part 1 — Key Book', 'return_in', 1, 94,  95, Decimal('280.00'), 'RTN-001', 'Galat subject ki kitab wapas'),

            # Damage
            ('Matric Chemistry Complete Guide','damage', -3,  70,  67, Decimal('200.00'), 'DMG-001', 'Transport mein bheegh gayin'),
            ('A4 Paper Ream — Double A (500 sheets)','damage',-2, 10,  8, Decimal('750.00'), 'DMG-002', 'Naami mein paani lag gaya'),
            ('Noorani Qaida (Color)',       'damage',   -3,  10,   7, Decimal('60.00'),  'DMG-003', 'Purani stock — torn pages'),

            # Manual adjustment
            ('Alif Bay Pay — Qaida for Kids','adjustment', 0, 180, 180, Decimal('0.00'), 'ADJ-001', 'Annual stock count — confirmed correct'),
        ]

        for pname, mtype, qty, before, after, cost, ref, note in movements:
            product = products.get(pname)
            if not product:
                continue
            if not StockMovement.objects.filter(product=product, reference=ref, movement_type=mtype).exists():
                StockMovement.objects.create(
                    product=product,
                    warehouse=main_warehouse,
                    movement_type=mtype,
                    quantity=qty,
                    stock_before=before,
                    stock_after=after,
                    unit_cost=cost,
                    reference=ref,
                    notes=note,
                )

        self.stdout.write(f'   ✓ {StockMovement.objects.count()} movements recorded')

        # ─────────────────────────────────────────────────────────
        # 8. LOW STOCK NOTIFICATIONS
        # ─────────────────────────────────────────────────────────
        self.stdout.write('\n🔔  Low Stock Notifications check kar raha hoon...')

        low_stock_products = Product.objects.filter(is_active=True, is_deleted=False)
        notif_count = 0
        for product in low_stock_products:
            if product.is_low_stock:
                notif, created = LowStockNotification.objects.get_or_create(
                    product=product,
                    is_resolved=False,
                    defaults={'stock_level': product.stock_quantity}
                )
                if created:
                    notif_count += 1
                    self.stdout.write(
                        f'   🔴 {product.name[:45]:<45} '
                        f'stock={product.stock_quantity} '
                        f'(threshold={product.low_stock_threshold})'
                    )

        if notif_count == 0:
            self.stdout.write('   ✓ Koi low stock nahi')

        # ─────────────────────────────────────────────────────────
        # SUMMARY
        # ─────────────────────────────────────────────────────────
        self.stdout.write('\n' + '─' * 60)
        self.stdout.write(self.style.SUCCESS('✅  Inventory seed complete!\n'))
        self.stdout.write(f'   🏠 Warehouses          : {Warehouse.objects.count()}')
        self.stdout.write(f'   🏭 Suppliers           : {Supplier.objects.count()}')
        self.stdout.write(f'   📁 Categories          : {Category.objects.count()}')
        self.stdout.write(f'   📦 Products            : {Product.objects.count()}')
        self.stdout.write(f'   📋 Stock Batches       : {StockBatch.objects.count()} (FIFO)')
        self.stdout.write(f'   🛒 Purchase Orders     : {PurchaseOrder.objects.count()} ({PurchaseOrder.objects.filter(status="draft").count()} draft, {PurchaseOrder.objects.filter(status="sent").count()} sent, {PurchaseOrder.objects.filter(status="partial").count()} partial, {PurchaseOrder.objects.filter(status="received").count()} received)')
        self.stdout.write(f'   📊 Stock Movements     : {StockMovement.objects.count()}')
        self.stdout.write(f'   🔴 Low Stock Alerts    : {LowStockNotification.objects.filter(is_resolved=False).count()} products')

        low_items = Product.objects.filter(is_active=True, is_deleted=False, stock_quantity__lte=10)
        if low_items.exists():
            self.stdout.write('\n   ⚠️  Urgent reorder list:')
            for p in low_items:
                self.stdout.write(f'      • {p.name} — sirf {p.stock_quantity} bacha hai')

        self.stdout.write('\n   🚀 Run karein:')
        self.stdout.write('   python manage.py seed_inventory')
        self.stdout.write('   python manage.py seed_inventory --flush')
        self.stdout.write('─' * 60)