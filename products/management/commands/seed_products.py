from django.core.management.base import BaseCommand
from products.models import Category, Product, ProductVariant


class Command(BaseCommand):
    help = 'Seed products with test data for Al-Junaid Books & Stationery'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true', help='Pehle sab delete karo')

    def handle(self, *args, **kwargs):
        if kwargs['flush']:
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write('🗑️  Purana data delete kar diya')

        self.stdout.write('🌱 Products seed shuru...\n')

        # ── Categories ────────────────────────────────────
        self.stdout.write('📁  Categories bana raha hoon...')
        categories_data = [
            {'name': 'Islamic Books',      'icon': '📖', 'description': 'Islamic literature, Quran, Hadith'},
            {'name': 'Educational Books',  'icon': '🎓', 'description': 'Academic books for all classes'},
            {'name': 'Stationery',         'icon': '✏️',  'description': 'Pens, notebooks, geometry boxes'},
            {'name': 'Children Books',     'icon': '👶', 'description': 'Kids learning and story books'},
            {'name': 'Urdu Literature',    'icon': '📚', 'description': 'Urdu novels, poetry, afsane'},
            {'name': 'English Literature', 'icon': '📗', 'description': 'English novels and self-help books'},
            {'name': 'Art Supplies',       'icon': '🎨', 'description': 'Colors, sketch books, art material'},
            {'name': 'Office Supplies',    'icon': '🖇️',  'description': 'Staplers, paper, office items'},
        ]
        categories = {}
        for cd in categories_data:
            obj, created = Category.objects.get_or_create(
                name=cd['name'],
                defaults={'icon': cd['icon'], 'description': cd['description'], 'is_active': True}
            )
            categories[cd['name']] = obj
            status = '✓ Naya' if created else '→ Exists'
            self.stdout.write(f'   {status}: {cd["name"]}')

        # ── Products ──────────────────────────────────────
        self.stdout.write('\n📦  Products bana raha hoon...')
        products_data = [
            # Islamic Books
            {'name': 'Quran Majeed (Tajweedi)',           'category': 'Islamic Books',      'price': 650,  'cost_price': 420,  'stock_qty': 200, 'low_stock_alert': 20, 'sku': 'ISL-001', 'unit': 'piece', 'is_featured': True},
            {'name': 'Riyaaz ul Jannah',                  'category': 'Islamic Books',      'price': 380,  'cost_price': 240,  'stock_qty': 85,  'low_stock_alert': 10, 'sku': 'ISL-002', 'unit': 'piece'},
            {'name': 'Al-Hidaayah (4 Volumes)',           'category': 'Islamic Books',      'price': 2800, 'cost_price': 1900, 'stock_qty': 12,  'low_stock_alert': 5,  'sku': 'ISL-003', 'unit': 'piece'},
            {'name': 'Seerat-un-Nabi (SAW) — Shibli',    'category': 'Islamic Books',      'price': 1200, 'cost_price': 800,  'stock_qty': 34,  'low_stock_alert': 8,  'sku': 'ISL-004', 'unit': 'piece'},
            {'name': 'Fazail-e-Amaal',                    'category': 'Islamic Books',      'price': 450,  'cost_price': 290,  'stock_qty': 120, 'low_stock_alert': 15, 'sku': 'ISL-005', 'unit': 'piece'},
            {'name': 'Noorani Qaida (Color)',             'category': 'Islamic Books',      'price': 120,  'cost_price': 75,   'stock_qty': 7,   'low_stock_alert': 20, 'sku': 'ISL-006', 'unit': 'piece'},

            # Educational Books
            {'name': 'Matric Chemistry Complete Guide',   'category': 'Educational Books',  'price': 520,  'cost_price': 340,  'stock_qty': 67,  'low_stock_alert': 10, 'sku': 'EDU-001', 'unit': 'piece'},
            {'name': 'FSc Physics Part 1 — Key Book',    'category': 'Educational Books',  'price': 480,  'cost_price': 310,  'stock_qty': 95,  'low_stock_alert': 10, 'sku': 'EDU-002', 'unit': 'piece'},
            {'name': 'O-Level Mathematics Workbook',     'category': 'Educational Books',  'price': 950,  'cost_price': 650,  'stock_qty': 18,  'low_stock_alert': 5,  'sku': 'EDU-003', 'unit': 'piece'},
            {'name': 'CSS Complete Guide — Pol. Science','category': 'Educational Books',  'price': 1100, 'cost_price': 750,  'stock_qty': 22,  'low_stock_alert': 5,  'sku': 'EDU-004', 'unit': 'piece'},
            {'name': 'English Grammar in Use',           'category': 'Educational Books',  'price': 1800, 'cost_price': 1200, 'stock_qty': 14,  'low_stock_alert': 5,  'sku': 'EDU-005', 'unit': 'piece'},

            # Stationery
            {'name': 'Classmate Notebook Pack (10 pcs)', 'category': 'Stationery',         'price': 350,  'cost_price': 210,  'stock_qty': 300, 'low_stock_alert': 30, 'sku': 'STA-001', 'unit': 'box',   'is_featured': True},
            {'name': 'Pilot G2 Pen Set (12 pcs)',        'category': 'Stationery',         'price': 420,  'cost_price': 270,  'stock_qty': 150, 'low_stock_alert': 20, 'sku': 'STA-002', 'unit': 'box'},
            {'name': 'Geometry Box — Maped',             'category': 'Stationery',         'price': 280,  'cost_price': 175,  'stock_qty': 75,  'low_stock_alert': 10, 'sku': 'STA-003', 'unit': 'piece'},
            {'name': 'Pencil HB (Pack of 12)',           'category': 'Stationery',         'price': 90,   'cost_price': 55,   'stock_qty': 3,   'low_stock_alert': 20, 'sku': 'STA-004', 'unit': 'box'},
            {'name': 'Highlighter Set (5 colors)',       'category': 'Stationery',         'price': 180,  'cost_price': 110,  'stock_qty': 45,  'low_stock_alert': 10, 'sku': 'STA-005', 'unit': 'piece'},
            {'name': 'Correction Pen — Pentel',          'category': 'Stationery',         'price': 60,   'cost_price': 35,   'stock_qty': 80,  'low_stock_alert': 15, 'sku': 'STA-006', 'unit': 'piece'},

            # Children Books
            {'name': 'Alif Bay Pay — Qaida for Kids',    'category': 'Children Books',     'price': 150,  'cost_price': 90,   'stock_qty': 180, 'low_stock_alert': 20, 'sku': 'CHD-001', 'unit': 'piece'},
            {'name': 'Moral Stories (Urdu)',             'category': 'Children Books',     'price': 200,  'cost_price': 125,  'stock_qty': 55,  'low_stock_alert': 10, 'sku': 'CHD-002', 'unit': 'piece'},
            {'name': 'English Alphabet Activity Book',   'category': 'Children Books',     'price': 180,  'cost_price': 110,  'stock_qty': 40,  'low_stock_alert': 10, 'sku': 'CHD-003', 'unit': 'piece'},

            # Urdu Literature
            {'name': 'Manto ke Afsane',                  'category': 'Urdu Literature',    'price': 420,  'cost_price': 270,  'stock_qty': 30,  'low_stock_alert': 5,  'sku': 'URD-001', 'unit': 'piece'},
            {'name': 'Bano Qudsia — Raja Gidh',          'category': 'Urdu Literature',    'price': 550,  'cost_price': 360,  'stock_qty': 25,  'low_stock_alert': 5,  'sku': 'URD-002', 'unit': 'piece'},
            {'name': 'Umrao Jan Ada',                    'category': 'Urdu Literature',    'price': 380,  'cost_price': 240,  'stock_qty': 20,  'low_stock_alert': 5,  'sku': 'URD-003', 'unit': 'piece'},

            # English Literature
            {'name': 'Atomic Habits — James Clear',      'category': 'English Literature', 'price': 1200, 'cost_price': 800,  'stock_qty': 40,  'low_stock_alert': 5,  'sku': 'ENG-001', 'unit': 'piece', 'is_featured': True},
            {'name': 'To Kill a Mockingbird',            'category': 'English Literature', 'price': 900,  'cost_price': 600,  'stock_qty': 4,   'low_stock_alert': 5,  'sku': 'ENG-002', 'unit': 'piece'},
            {'name': 'The Alchemist — Paulo Coelho',     'category': 'English Literature', 'price': 850,  'cost_price': 560,  'stock_qty': 28,  'low_stock_alert': 5,  'sku': 'ENG-003', 'unit': 'piece'},

            # Art Supplies
            {'name': 'Poster Colors Set (12)',           'category': 'Art Supplies',       'price': 380,  'cost_price': 240,  'stock_qty': 35,  'low_stock_alert': 8,  'sku': 'ART-001', 'unit': 'piece'},
            {'name': 'Sketch Book A4',                   'category': 'Art Supplies',       'price': 220,  'cost_price': 135,  'stock_qty': 50,  'low_stock_alert': 8,  'sku': 'ART-002', 'unit': 'piece'},
            {'name': 'Watercolor Brush Set',             'category': 'Art Supplies',       'price': 290,  'cost_price': 180,  'stock_qty': 22,  'low_stock_alert': 5,  'sku': 'ART-003', 'unit': 'piece'},

            # Office Supplies
            {'name': 'A4 Paper Ream — Double A',         'category': 'Office Supplies',    'price': 950,  'cost_price': 680,  'stock_qty': 8,   'low_stock_alert': 10, 'sku': 'OFF-001', 'unit': 'piece'},
            {'name': 'Stapler + 1000 Pins Set',          'category': 'Office Supplies',    'price': 380,  'cost_price': 240,  'stock_qty': 40,  'low_stock_alert': 5,  'sku': 'OFF-002', 'unit': 'piece'},
            {'name': 'Scissors Large',                   'category': 'Office Supplies',    'price': 130,  'cost_price': 80,   'stock_qty': 25,  'low_stock_alert': 5,  'sku': 'OFF-003', 'unit': 'piece'},
            {'name': 'Tape Dispenser + 3 Rolls',         'category': 'Office Supplies',    'price': 250,  'cost_price': 155,  'stock_qty': 18,  'low_stock_alert': 5,  'sku': 'OFF-004', 'unit': 'piece'},
        ]

        created_count = 0
        low_stock = []
        for pd in products_data:
            cat = categories.get(pd['category'])
            obj, created = Product.objects.get_or_create(
                sku=pd['sku'],
                defaults={
                    'name':            pd['name'],
                    'category':        cat,
                    'price':           pd['price'],
                    'cost_price':      pd['cost_price'],
                    'stock_qty':       pd['stock_qty'],
                    'low_stock_alert': pd['low_stock_alert'],
                    'unit':            pd['unit'],
                    'is_active':       True,
                    'is_featured':     pd.get('is_featured', False),
                    'tax_rate':        0,
                    'discount':        0,
                    'description':     '',
                }
            )
            if created:
                created_count += 1
            status = '✓ Naya' if created else '→ Exists'
            low = ' ⚠️ LOW' if pd['stock_qty'] <= pd['low_stock_alert'] else ''
            self.stdout.write(f'   {status}: {pd["name"]:<45} stock={pd["stock_qty"]:>4}{low}')
            if pd['stock_qty'] <= pd['low_stock_alert']:
                low_stock.append(pd)

        # ── ProductVariants ───────────────────────────────
        self.stdout.write('\n🔀  Product Variants bana raha hoon...')
        variants_data = [
            {'product_sku': 'ISL-001', 'variants': [
                {'name': 'Small (Pocket Size)', 'price': 450, 'stock_qty': 80},
                {'name': 'Medium (Standard)',   'price': 650, 'stock_qty': 200},
                {'name': 'Large (Deluxe)',       'price': 950, 'stock_qty': 30},
            ]},
            {'product_sku': 'STA-001', 'variants': [
                {'name': 'Pack of 5',  'price': 180, 'stock_qty': 150},
                {'name': 'Pack of 10', 'price': 350, 'stock_qty': 300},
                {'name': 'Pack of 20', 'price': 650, 'stock_qty': 80},
            ]},
        ]
        variant_count = 0
        for vd in variants_data:
            try:
                product = Product.objects.get(sku=vd['product_sku'])
                for v in vd['variants']:
                    obj, created = ProductVariant.objects.get_or_create(
                        product=product,
                        name=v['name'],
                        defaults={'price': v['price'], 'stock_qty': v['stock_qty'], 'is_active': True}
                    )
                    if created:
                        variant_count += 1
                        self.stdout.write(f'   ✓ {product.name} — {v["name"]}')
            except Product.DoesNotExist:
                pass

        # ── Summary ───────────────────────────────────────
        total_products = Product.objects.count()
        total_categories = Category.objects.count()

        self.stdout.write('\n' + '─' * 60)
        self.stdout.write(self.style.SUCCESS('✅  Products seed complete!'))
        self.stdout.write(f'   📁 Categories : {total_categories}')
        self.stdout.write(f'   📦 Products   : {total_products} ({created_count} naye)')
        self.stdout.write(f'   🔀 Variants   : {variant_count}')
        self.stdout.write(f'\n🔴 Low Stock ({len(low_stock)} products):')
        for p in low_stock:
            self.stdout.write(f'   • {p["name"]} — sirf {p["stock_qty"]} bacha hai')
        self.stdout.write('─' * 60)