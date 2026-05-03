import { useState, useEffect, useRef, useCallback } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdSearch, MdAdd, MdRemove, MdDelete, MdShoppingCart,
  MdPerson, MdPause, MdPlayArrow, MdPrint, MdClose,
  MdReceipt, MdQrCodeScanner, MdStar, MdLocalOffer,
  MdSplitscreen, MdCheck, MdStorefront
} from 'react-icons/md'

// ─── CONSTANTS ────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'cash',      label: 'Cash',      icon: '💵' },
  { id: 'card',      label: 'Card',      icon: '💳' },
  { id: 'jazzcash',  label: 'JazzCash',  icon: '🟠' },
  { id: 'easypaisa', label: 'Easypaisa', icon: '🟢' },
]

const LOYALTY_RATE = 1   // 1 point per Rs.100
const LOYALTY_VALUE = 1  // 1 point = Rs.1

// ─── RECEIPT MODAL ────────────────────────────────────────────────
const ReceiptModal = ({ order, business, onClose }) => {
  const printRef = useRef()

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body{font-family:monospace;padding:20px;max-width:300px;margin:auto}
        .divider{border-top:1px dashed #000;margin:8px 0}
        .row{display:flex;justify-content:space-between;font-size:13px}
        .title{text-align:center;font-size:16px;font-weight:bold}
        .sub{text-align:center;font-size:12px;color:#555}
        .total-row{font-weight:bold;font-size:14px}
      </style></head><body>${content}</body></html>
    `)
    win.document.close(); win.print()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MdReceipt size={20} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Receipt</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <MdClose size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto" ref={printRef}>
          <div className="title">{business?.name || 'POS System'}</div>
          {business?.address && <div className="sub">{business.address}</div>}
          {business?.phone && <div className="sub">{business.phone}</div>}
          {business?.email && <div className="sub">{business.email}</div>}
          <div className="divider mt-2" />
          <div className="text-xs text-gray-500 mb-2">
            <div>Order #{order.id}</div>
            <div>{new Date().toLocaleString()}</div>
            {order.customer_name && <div>Customer: {order.customer_name}</div>}
            {order.customer_type === 'wholesale' && <div>🏪 Wholesale Customer</div>}
            <div>Payment: {order.payment_label}</div>
          </div>
          <div className="divider" />
          {order.items.map((item, i) => (
            <div key={i} className="row py-1">
              <span className="flex-1 text-sm">{item.name} x{item.qty}</span>
              <span className="text-sm">Rs. {(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="row"><span>Subtotal</span><span>Rs. {order.subtotal.toFixed(2)}</span></div>
          {order.categoryDiscount > 0 && (
            <div className="row text-purple-600"><span>Category Discount</span><span>- Rs. {order.categoryDiscount.toFixed(2)}</span></div>
          )}
          {order.discount > 0 && (
            <div className="row text-red-500"><span>Discount</span><span>- Rs. {order.discount.toFixed(2)}</span></div>
          )}
          {order.loyaltyUsed > 0 && (
            <div className="row text-yellow-600"><span>Loyalty Points</span><span>- Rs. {order.loyaltyUsed.toFixed(2)}</span></div>
          )}
          {order.tax > 0 && (
            <div className="row"><span>Tax ({order.taxRate}%)</span><span>Rs. {order.tax.toFixed(2)}</span></div>
          )}
          <div className="divider" />
          <div className="row total-row"><span>TOTAL</span><span>Rs. {order.total.toFixed(2)}</span></div>
          {order.splitPayment && (
            <>
              <div className="divider" />
              <div className="text-xs text-gray-500 font-semibold mt-1">Split Payment:</div>
              {order.splitPayment.map((sp, i) => (
                <div key={i} className="row text-xs">
                  <span>{sp.label}</span><span>Rs. {sp.amount.toFixed(2)}</span>
                </div>
              ))}
            </>
          )}
          {order.pointsEarned > 0 && (
            <div className="text-center text-xs text-yellow-600 mt-2 font-medium">
              ⭐ +{order.pointsEarned} Loyalty Points Earned!
            </div>
          )}
          <div className="divider mt-2" />
          <div className="sub mt-2">Thank you for your purchase!</div>
        </div>

        <div className="flex gap-2 p-4 border-t">
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition font-medium">
            <MdPrint size={18} /> Print
          </button>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SPLIT PAYMENT MODAL ──────────────────────────────────────────
const SplitPaymentModal = ({ total, onConfirm, onClose }) => {
  const [splits, setSplits] = useState(
    PAYMENT_METHODS.slice(0, 2).map(m => ({ ...m, amount: '' }))
  )

  const splitTotal = splits.reduce((s, sp) => s + (Number(sp.amount) || 0), 0)
  const remaining = total - splitTotal

  const updateAmount = (id, val) => {
    setSplits(splits.map(sp => sp.id === id ? { ...sp, amount: val } : sp))
  }

  const addMethod = () => {
    const used = splits.map(s => s.id)
    const available = PAYMENT_METHODS.find(m => !used.includes(m.id))
    if (available) setSplits([...splits, { ...available, amount: '' }])
  }

  const removeMethod = (id) => setSplits(splits.filter(sp => sp.id !== id))

  const isValid = Math.abs(remaining) < 0.01 && splits.every(sp => Number(sp.amount) > 0)

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MdSplitscreen size={20} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Split Payment</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-sm text-gray-500">Total Amount</div>
            <div className="text-2xl font-bold text-blue-600">Rs. {total.toFixed(2)}</div>
          </div>

          {splits.map((sp, i) => (
            <div key={sp.id} className="flex items-center gap-2">
              <span className="text-lg">{sp.icon}</span>
              <span className="text-sm font-medium text-gray-700 w-24">{sp.label}</span>
              <input
                type="number"
                value={sp.amount}
                onChange={e => updateAmount(sp.id, e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              {splits.length > 2 && (
                <button onClick={() => removeMethod(sp.id)} className="text-red-400 hover:text-red-600">
                  <MdDelete size={18} />
                </button>
              )}
            </div>
          ))}

          {splits.length < PAYMENT_METHODS.length && (
            <button onClick={addMethod}
              className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition">
              + Add Payment Method
            </button>
          )}

          <div className={`flex justify-between text-sm font-medium px-1 ${Math.abs(remaining) < 0.01 ? 'text-green-600' : remaining < 0 ? 'text-red-500' : 'text-orange-500'}`}>
            <span>{remaining < 0 ? 'Over by' : remaining > 0 ? 'Remaining' : '✓ Balanced'}</span>
            <span>Rs. {Math.abs(remaining).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">
            Cancel
          </button>
          <button
            onClick={() => isValid && onConfirm(splits.map(sp => ({ ...sp, amount: Number(sp.amount) })))}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed">
            <MdCheck size={18} /> Confirm Split
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BARCODE SCANNER ──────────────────────────────────────────────
const useBarcodeScanner = (onScan) => {
  const buffer = useRef('')
  const timer = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type !== 'hidden') return
      if (e.key === 'Enter') {
        if (buffer.current.length > 3) onScan(buffer.current.trim())
        buffer.current = ''
        clearTimeout(timer.current)
        return
      }
      if (e.key.length === 1) {
        buffer.current += e.key
        clearTimeout(timer.current)
        timer.current = setTimeout(() => { buffer.current = '' }, 200)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onScan])
}

// ─── CUSTOMER SELECT ──────────────────────────────────────────────
const CustomerSelect = ({ customers, selectedCustomer, onSelect }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition bg-white">
        <MdPerson size={18} className="text-blue-600" />
        <span className="text-sm text-gray-700 flex-1">
          {selectedCustomer ? (
            <span className="flex items-center gap-1">
              {selectedCustomer.name}
              {selectedCustomer.customer_type === 'wholesale' && (
                <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Wholesale</span>
              )}
              {selectedCustomer.loyalty_points > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-600 px-1 rounded">⭐{selectedCustomer.loyalty_points}pts</span>
              )}
            </span>
          ) : 'Walk-in Customer'}
        </span>
        {selectedCustomer && (
          <button onClick={e => { e.stopPropagation(); onSelect(null) }}
            className="text-gray-400 hover:text-red-500"><MdClose size={14} /></button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
          <div className="p-2">
            <input autoFocus type="text" placeholder="Search by name or phone..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <div onClick={() => { onSelect(null); setOpen(false) }}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer">
              Walk-in Customer
            </div>
            {filtered.map(c => (
              <div key={c.id} onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  {c.customer_type === 'wholesale' && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">🏪 Wholesale</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{c.phone}</span>
                  {c.loyalty_points > 0 && (
                    <span className="text-xs text-yellow-600">⭐ {c.loyalty_points} pts</span>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="px-4 py-2 text-sm text-gray-400">No customers found</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN POS ────────────────────────────────────────────────────
const POS = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [customers, setCustomers] = useState([])
  const [business, setBusiness] = useState(null)
  const [cart, setCart] = useState([])
  const [heldOrders, setHeldOrders] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState('percent')
  const [taxRate, setTaxRate] = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [showHeld, setShowHeld] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [splitPayments, setSplitPayments] = useState(null)
  const [useLoyalty, setUseLoyalty] = useState(false)
  const [categoryDiscounts, setCategoryDiscounts] = useState({}) // { catId: percent }
  const [barcodeFlash, setBarcodeFlash] = useState(false)

  useEffect(() => {
    fetchProducts(); fetchCategories(); fetchCustomers(); fetchBusiness()
  }, [])

  const fetchProducts  = async () => { try { const r = await API.get('/products/products/');   setProducts(r.data)  } catch(e){console.error(e)} }
  const fetchCategories= async () => { try { const r = await API.get('/products/categories/');  setCategories(r.data)} catch(e){console.error(e)} }
  const fetchCustomers = async () => { try { const r = await API.get('/customers/customers/');  setCustomers(r.data) } catch(e){console.error(e)} }
  const fetchBusiness  = async () => { try { const r = await API.get('/business/');             setBusiness(r.data[0])} catch(e){console.error(e)} }

  // ── Wholesale Pricing ──
  const getPrice = useCallback((product) => {
    if (selectedCustomer?.customer_type === 'wholesale' && product.wholesale_price) {
      return Number(product.wholesale_price)
    }
    return Number(product.price)
  }, [selectedCustomer])

  // ── Barcode Scanner ──
  const handleBarcodeScan = useCallback((barcode) => {
    const product = products.find(p => p.barcode === barcode || String(p.id) === barcode)
    if (product) {
      addToCart(product)
      setBarcodeFlash(true)
      setTimeout(() => setBarcodeFlash(false), 600)
    }
  }, [products, selectedCustomer])

  useBarcodeScanner(handleBarcodeScan)

  // ── Filtering ──
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.barcode?.includes(search)
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory
    return matchSearch && matchCat
  })

  // ── Cart Actions ──
  const addToCart = (product) => {
    if (product.stock_qty <= 0) return
    const price = getPrice(product)
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1, price } : item)
      return [...prev, { ...product, qty: 1, price }]
    })
  }

  const updateQty = (id, change) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + change) } : item
    ).filter(item => item.qty > 0))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id))

  // ── Update prices when customer type changes ──
  useEffect(() => {
    if (cart.length > 0) {
      setCart(prev => prev.map(item => {
        const product = products.find(p => p.id === item.id)
        if (product) return { ...item, price: getPrice(product) }
        return item
      }))
    }
  }, [selectedCustomer])

  // ── Category Discount ──
  const getCategoryDiscount = (item) => {
    const prd = products.find(p => p.id === item.id)
    if (!prd) return 0
    const catDisc = categoryDiscounts[prd.category] || 0
    return (item.price * item.qty * catDisc) / 100
  }

  // ── Calculations ──
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const totalCategoryDiscount = cart.reduce((sum, item) => sum + getCategoryDiscount(item), 0)
  const afterCategoryDiscount = subtotal - totalCategoryDiscount

  const discountAmount = discountType === 'percent'
    ? (afterCategoryDiscount * discount) / 100
    : Number(discount)
  const afterDiscount = afterCategoryDiscount - discountAmount

  // Loyalty
  const availableLoyaltyPoints = selectedCustomer?.loyalty_points || 0
  const maxLoyaltyDiscount = Math.min(availableLoyaltyPoints * LOYALTY_VALUE, afterDiscount * 0.5) // max 50%
  const loyaltyDiscount = useLoyalty && selectedCustomer ? maxLoyaltyDiscount : 0

  const afterLoyalty = afterDiscount - loyaltyDiscount
  const taxAmount = (afterLoyalty * taxRate) / 100
  const total = afterLoyalty + taxAmount

  const pointsEarned = Math.floor(total / 100) * LOYALTY_RATE

  // ── Hold Order ──
  const holdOrder = () => {
    if (cart.length === 0) return
    setHeldOrders(prev => [...prev, {
      id: Date.now(), cart, discount, discountType, taxRate, paymentMethod,
      selectedCustomer, splitPayments, useLoyalty, categoryDiscounts
    }])
    resetCart()
  }

  const resumeOrder = (held) => {
    setCart(held.cart); setDiscount(held.discount); setDiscountType(held.discountType)
    setTaxRate(held.taxRate); setPaymentMethod(held.paymentMethod)
    setSelectedCustomer(held.selectedCustomer); setSplitPayments(held.splitPayments)
    setUseLoyalty(held.useLoyalty || false)
    setCategoryDiscounts(held.categoryDiscounts || {})
    setHeldOrders(prev => prev.filter(o => o.id !== held.id))
    setShowHeld(false)
  }

  const resetCart = () => {
    setCart([]); setDiscount(0); setTaxRate(0); setSelectedCustomer(null)
    setPaymentMethod('cash'); setSplitPayments(null); setUseLoyalty(false)
  }

  // ── Checkout ──
  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty!')
    setLoading(true)
    try {
      const paymentLabel = splitPayments
        ? 'Split: ' + splitPayments.map(sp => `${sp.label} Rs.${sp.amount}`).join(' + ')
        : PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod

      const res = await API.post('/pos/orders/', {
        customer: selectedCustomer?.id || null,
        items: cart.map(item => ({
          product: item.id, qty: item.qty,
          unit_price: item.price, total_price: item.price * item.qty,
        })),
        subtotal,
        category_discount: totalCategoryDiscount,
        discount_type: discountType,
        discount_value: discount,
        loyalty_discount: loyaltyDiscount,
        tax_amount: taxAmount,
        total,
        payment_method: splitPayments ? 'split' : paymentMethod,
        split_payments: splitPayments || null,
        status: 'paid',
        points_earned: pointsEarned,
      })

      setReceipt({
        id: res.data.id || Math.floor(Math.random() * 10000),
        items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
        customer_name: selectedCustomer?.name || null,
        customer_type: selectedCustomer?.customer_type || null,
        payment_label: paymentLabel,
        subtotal,
        categoryDiscount: totalCategoryDiscount,
        discount: discountAmount,
        loyaltyUsed: loyaltyDiscount,
        tax: taxAmount,
        taxRate,
        total,
        splitPayment: splitPayments,
        pointsEarned,
      })

      resetCart()
      fetchProducts()
    } catch (err) {
      const errorData = err.response?.data
      console.error('ORDER ERROR:', JSON.stringify(errorData, null, 2))
      alert('Error: ' + JSON.stringify(errorData))
    } finally {
      setLoading(false)
    }
  }

  const isWholesale = selectedCustomer?.customer_type === 'wholesale'

  return (
    <Layout>
      <div className="flex gap-4 h-full">

        {/* ── LEFT — Products ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Top Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex gap-2">
              <div className={`relative flex-1 transition-all ${barcodeFlash ? 'ring-2 ring-green-400 rounded-lg' : ''}`}>
                <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="text" placeholder="Search products or scan barcode..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <MdQrCodeScanner className="absolute right-3 top-3 text-gray-300" size={20} />
              </div>
              {heldOrders.length > 0 && (
                <button onClick={() => setShowHeld(true)}
                  className="relative flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 transition">
                  <MdPause size={18} /> Held
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {heldOrders.length}
                  </span>
                </button>
              )}
            </div>

            {/* Categories with discount badge */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`relative px-3 py-1 rounded-full text-sm font-medium transition ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat.name}
                  {categoryDiscounts[cat.id] > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full px-1">
                      -{categoryDiscounts[cat.id]}%
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Category Discount Controls */}
            {selectedCategory !== 'all' && (
              <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-2">
                <MdLocalOffer size={16} className="text-purple-500" />
                <span className="text-xs text-purple-700 font-medium flex-1">
                  Category Discount for "{categories.find(c => c.id === selectedCategory)?.name}"
                </span>
                <input
                  type="number" min="0" max="100"
                  value={categoryDiscounts[selectedCategory] || ''}
                  onChange={e => setCategoryDiscounts(prev => ({
                    ...prev, [selectedCategory]: Number(e.target.value)
                  }))}
                  placeholder="0"
                  className="w-16 px-2 py-1 border border-purple-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <span className="text-xs text-purple-600">%</span>
              </div>
            )}

            {/* Barcode hint */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MdQrCodeScanner size={14} />
              <span>Barcode scanner ready — scan any product barcode to add to cart</span>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pb-2">
            {filteredProducts.length === 0 ? (
              <div className="col-span-4 text-center text-gray-400 py-16">No products found</div>
            ) : filteredProducts.map(product => {
              const displayPrice = getPrice(product)
              const isWholesalePrice = isWholesale && product.wholesale_price && Number(product.wholesale_price) !== Number(product.price)
              const catDisc = categoryDiscounts[product.category] || 0
              return (
                <div key={product.id} onClick={() => addToCart(product)}
                  className={`bg-white rounded-xl shadow-sm p-4 text-center transition border-2 relative ${
                    product.stock_qty <= 0
                      ? 'opacity-50 cursor-not-allowed border-transparent'
                      : 'cursor-pointer hover:border-blue-500 border-transparent hover:shadow-md'
                  }`}>
                  {isWholesalePrice && (
                    <span className="absolute top-1 left-1 text-xs bg-purple-500 text-white px-1.5 rounded-full">W</span>
                  )}
                  {catDisc > 0 && (
                    <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-1.5 rounded-full">-{catDisc}%</span>
                  )}
                  <div className="text-3xl mb-2">📦</div>
                  <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                  <div className="mt-1">
                    <p className="text-blue-600 font-bold text-sm">Rs. {displayPrice.toLocaleString()}</p>
                    {isWholesalePrice && (
                      <p className="text-gray-400 line-through text-xs">Rs. {Number(product.price).toLocaleString()}</p>
                    )}
                  </div>
                  <p className={`text-xs mt-1 font-medium ${product.stock_qty <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                    {product.stock_qty <= 0 ? 'Out of stock' : `Stock: ${product.stock_qty}`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT — Cart ── */}
        <div className="w-80 bg-white rounded-xl shadow-sm flex flex-col flex-shrink-0">

          {/* Cart Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MdShoppingCart size={20} className="text-blue-600" />
                <h2 className="font-semibold text-gray-800">Cart</h2>
                {cart.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((s, i) => s + i.qty, 0)}
                  </span>
                )}
                {isWholesale && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MdStorefront size={12} /> Wholesale
                  </span>
                )}
              </div>
              <button onClick={() => setCart([])} className="text-red-500 text-xs hover:text-red-700">Clear</button>
            </div>
            <CustomerSelect customers={customers} selectedCustomer={selectedCustomer} onSelect={(c) => { setSelectedCustomer(c); setUseLoyalty(false) }} />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center mt-10">
                <MdShoppingCart size={40} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Cart is empty</p>
                <p className="text-gray-300 text-xs mt-1">Click products to add</p>
              </div>
            ) : cart.map(item => {
              const catDisc = getCategoryDiscount(item)
              return (
                <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-blue-600">Rs. {Number(item.price).toLocaleString()}</p>
                      {catDisc > 0 && <span className="text-xs text-green-600">(-{((catDisc/(item.price*item.qty))*100).toFixed(0)}%)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300"><MdRemove size={14} /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300"><MdAdd size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><MdDelete size={16} /></button>
                </div>
              )
            })}
          </div>

          {/* Discount + Tax */}
          <div className="px-4 py-2 border-t space-y-2">
            <div>
              <label className="text-xs text-gray-500 font-medium">Discount</label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setDiscountType('percent')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>%</button>
                <button onClick={() => setDiscountType('flat')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${discountType === 'flat' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Rs.</button>
                <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                  className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full mt-1 px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0" max="100" placeholder="0" />
            </div>

            {/* Loyalty Points */}
            {selectedCustomer && availableLoyaltyPoints > 0 && (
              <div className={`flex items-center justify-between rounded-lg p-2 cursor-pointer transition ${useLoyalty ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50 border border-gray-200'}`}
                onClick={() => setUseLoyalty(!useLoyalty)}>
                <div className="flex items-center gap-2">
                  <MdStar size={16} className={useLoyalty ? 'text-yellow-500' : 'text-gray-400'} />
                  <div>
                    <div className="text-xs font-medium text-gray-700">Loyalty Points</div>
                    <div className="text-xs text-gray-400">{availableLoyaltyPoints} pts available</div>
                  </div>
                </div>
                <div className="text-right">
                  {useLoyalty ? (
                    <div className="text-xs text-yellow-600 font-medium">-Rs. {maxLoyaltyDiscount.toFixed(0)}</div>
                  ) : (
                    <div className="text-xs text-gray-400">Tap to use</div>
                  )}
                  <div className={`w-8 h-4 rounded-full transition-colors ${useLoyalty ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                </div>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="px-4 py-3 border-t space-y-1 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
            {totalCategoryDiscount > 0 && (
              <div className="flex justify-between text-sm text-purple-600"><span>Category Discount</span><span>- Rs. {totalCategoryDiscount.toFixed(2)}</span></div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-500"><span>Discount</span><span>- Rs. {discountAmount.toFixed(2)}</span></div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-sm text-yellow-600"><span>Loyalty Discount</span><span>- Rs. {loyaltyDiscount.toFixed(2)}</span></div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-600"><span>Tax ({taxRate}%)</span><span>+ Rs. {taxAmount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-200 mt-1">
              <span>Total</span><span>Rs. {total.toFixed(2)}</span>
            </div>
            {pointsEarned > 0 && (
              <div className="text-xs text-yellow-600 text-center">⭐ Will earn {pointsEarned} loyalty points</div>
            )}
          </div>

          {/* Payment Method */}
          <div className="px-4 py-2 border-t">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500 font-medium">Payment Method</label>
              <button onClick={() => setShowSplit(true)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                <MdSplitscreen size={14} /> Split
              </button>
            </div>
            {splitPayments ? (
              <div className="bg-blue-50 rounded-lg p-2 space-y-1">
                {splitPayments.map((sp, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-700">
                    <span>{sp.icon} {sp.label}</span>
                    <span className="font-medium">Rs. {sp.amount.toFixed(2)}</span>
                  </div>
                ))}
                <button onClick={() => setSplitPayments(null)}
                  className="w-full text-xs text-red-500 hover:text-red-600 mt-1">Remove Split</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {PAYMENT_METHODS.map(method => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition ${paymentMethod === method.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <span>{method.icon}</span> {method.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 flex flex-col gap-2">
            <button onClick={holdOrder} disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-yellow-400 text-yellow-600 rounded-xl font-medium text-sm hover:bg-yellow-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
              <MdPause size={16} /> Hold Order
            </button>
            <button onClick={handleCheckout} disabled={loading || cart.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Processing...' : `Checkout — Rs. ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Held Orders Modal ── */}
      {showHeld && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Held Orders</h2>
              <button onClick={() => setShowHeld(false)} className="text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {heldOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {order.selectedCustomer?.name || 'Walk-in'} — {order.cart.length} items
                    </p>
                    <p className="text-xs text-gray-400">
                      Rs. {order.cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                    </p>
                  </div>
                  <button onClick={() => resumeOrder(order)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                    <MdPlayArrow size={16} /> Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Split Payment Modal ── */}
      {showSplit && (
        <SplitPaymentModal
          total={total}
          onConfirm={(splits) => { setSplitPayments(splits); setShowSplit(false) }}
          onClose={() => setShowSplit(false)}
        />
      )}

      {/* ── Receipt Modal ── */}
      {receipt && (
        <ReceiptModal order={receipt} business={business} onClose={() => setReceipt(null)} />
      )}
    </Layout>
  )
}

export default POS