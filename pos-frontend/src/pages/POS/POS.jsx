import { useState, useEffect, useRef, useCallback } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdSearch, MdAdd, MdRemove, MdDelete, MdShoppingCart,
  MdPerson, MdPause, MdPlayArrow, MdPrint, MdClose,
  MdReceipt, MdQrCodeScanner, MdStar, MdLocalOffer,
  MdSplitscreen, MdCheck, MdStorefront, MdPointOfSale,
  MdCategory, MdRefresh, MdKeyboard
} from 'react-icons/md'

// ─── CONSTANTS ───────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'cash',      label: 'Cash',      icon: '💵', color: 'bg-emerald-500' },
  { id: 'card',      label: 'Card',      icon: '💳', color: 'bg-blue-500' },
  { id: 'jazzcash',  label: 'JazzCash',  icon: '🟠', color: 'bg-orange-500' },
  { id: 'easypaisa', label: 'Easypaisa', icon: '🟢', color: 'bg-green-600' },
]
const LOYALTY_RATE  = 1
const LOYALTY_VALUE = 1

// ─── RECEIPT MODAL ───────────────────────────────────────────────
const ReceiptModal = ({ order, business, onClose }) => {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>Receipt</title>
      <style>
        body{font-family:monospace;padding:20px;max-width:320px;margin:auto;font-size:13px}
        .divider{border-top:1px dashed #000;margin:8px 0}
        .row{display:flex;justify-content:space-between;padding:2px 0}
        .center{text-align:center}.bold{font-weight:bold}.big{font-size:16px}
        .red{color:#dc2626}.green{color:#16a34a}.yellow{color:#ca8a04}
      </style></head>
      <body>${printRef.current.innerHTML}</body></html>`)
    win.document.close(); win.print()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MdReceipt size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-800">Receipt</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <MdClose size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5" ref={printRef}>
          <div className="center bold big">{business?.name || 'Al-Junaid Books'}</div>
          {business?.address && <div className="center" style={{fontSize:11,color:'#666'}}>{business.address}</div>}
          {business?.phone  && <div className="center" style={{fontSize:11,color:'#666'}}>{business.phone}</div>}
          <div className="divider" />
          <div style={{fontSize:11,color:'#555',marginBottom:6}}>
            <div>Order #{order.id} &nbsp;·&nbsp; {new Date().toLocaleString('en-PK')}</div>
            {order.customer_name && <div>Customer: <b>{order.customer_name}</b></div>}
            {order.customer_type === 'wholesale' && <div>🏪 Wholesale Customer</div>}
            <div>Payment: {order.payment_label}</div>
          </div>
          <div className="divider" />
          {order.items.map((item, i) => (
            <div className="row" key={i}>
              <span style={{flex:1}}>{item.name} ×{item.qty}</span>
              <span>Rs. {(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="row"><span>Subtotal</span><span>Rs. {Number(order.subtotal).toLocaleString()}</span></div>
          {order.categoryDiscount > 0 && <div className="row" style={{color:'#7c3aed'}}><span>Category Disc.</span><span>- Rs. {Number(order.categoryDiscount).toLocaleString()}</span></div>}
          {order.discount > 0 && <div className="row red"><span>Discount</span><span>- Rs. {Number(order.discount).toLocaleString()}</span></div>}
          {order.loyaltyUsed > 0 && <div className="row yellow"><span>Loyalty Points</span><span>- Rs. {Number(order.loyaltyUsed).toLocaleString()}</span></div>}
          {order.tax > 0 && <div className="row"><span>Tax ({order.taxRate}%)</span><span>Rs. {Number(order.tax).toLocaleString()}</span></div>}
          <div className="divider" />
          <div className="row bold big"><span>TOTAL</span><span>Rs. {Number(order.total).toLocaleString()}</span></div>
          {order.splitPayment && <>
            <div className="divider" />
            <div style={{fontSize:11,fontWeight:'bold',marginTop:4}}>Split Payment:</div>
            {order.splitPayment.map((sp, i) => (
              <div className="row" key={i} style={{fontSize:11}}>
                <span>{sp.label}</span><span>Rs. {Number(sp.amount).toLocaleString()}</span>
              </div>
            ))}
          </>}
          {order.pointsEarned > 0 && (
            <div className="center yellow bold" style={{marginTop:8}}>⭐ +{order.pointsEarned} Loyalty Points Earned!</div>
          )}
          <div className="divider" style={{marginTop:12}} />
          <div className="center" style={{fontSize:11,color:'#888',marginTop:4}}>Thank you for shopping with us!</div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">Close</button>
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            <MdPrint size={18} /> Print
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SPLIT PAYMENT MODAL ─────────────────────────────────────────
const SplitPaymentModal = ({ total, onConfirm, onClose }) => {
  const [splits, setSplits] = useState(
    PAYMENT_METHODS.slice(0, 2).map(m => ({ ...m, amount: '' }))
  )
  const splitTotal = splits.reduce((s, sp) => s + (Number(sp.amount) || 0), 0)
  const remaining  = total - splitTotal
  const isValid    = Math.abs(remaining) < 0.01 && splits.every(sp => Number(sp.amount) > 0)

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MdSplitscreen size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-800">Split Payment</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <MdClose size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">Total Amount</p>
            <p className="text-3xl font-black text-blue-600 mt-1">Rs. {total.toLocaleString()}</p>
          </div>

          {splits.map(sp => (
            <div key={sp.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <span className="text-xl">{sp.icon}</span>
              <span className="text-sm font-semibold text-gray-700 w-24">{sp.label}</span>
              <input type="number" value={sp.amount} placeholder="0"
                onChange={e => setSplits(splits.map(s => s.id === sp.id ? { ...s, amount: e.target.value } : s))}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {splits.length > 2 && (
                <button onClick={() => setSplits(splits.filter(s => s.id !== sp.id))}
                  className="text-red-400 hover:text-red-600 transition">
                  <MdDelete size={16} />
                </button>
              )}
            </div>
          ))}

          {splits.length < PAYMENT_METHODS.length && (
            <button onClick={() => {
              const used = splits.map(s => s.id)
              const avail = PAYMENT_METHODS.find(m => !used.includes(m.id))
              if (avail) setSplits([...splits, { ...avail, amount: '' }])
            }} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition font-medium">
              + Add Payment Method
            </button>
          )}

          <div className={`flex justify-between items-center px-1 text-sm font-bold ${Math.abs(remaining) < 0.01 ? 'text-emerald-600' : remaining < 0 ? 'text-red-500' : 'text-orange-500'}`}>
            <span>{remaining < 0 ? 'Over by' : remaining > 0 ? 'Remaining' : '✓ Balanced'}</span>
            <span>Rs. {Math.abs(remaining).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button onClick={() => isValid && onConfirm(splits.map(sp => ({ ...sp, amount: Number(sp.amount) })))}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <MdCheck size={16} /> Confirm Split
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BARCODE HOOK ────────────────────────────────────────────────
const useBarcodeScanner = (onScan) => {
  const buffer = useRef('')
  const timer  = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type !== 'hidden') return
      if (e.key === 'Enter') {
        if (buffer.current.length > 3) onScan(buffer.current.trim())
        buffer.current = ''; clearTimeout(timer.current); return
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

// ─── CUSTOMER SELECT ─────────────────────────────────────────────
const CustomerSelect = ({ customers, selected, onSelect }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen]     = useState(false)
  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl cursor-pointer transition bg-white ${open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}>
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <MdPerson size={16} className="text-blue-600" />
        </div>
        <span className="text-sm text-gray-700 flex-1 truncate">
          {selected ? (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">{selected.name}</span>
              {selected.customer_type === 'wholesale' && (
                <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">Wholesale</span>
              )}
              {selected.loyalty_points > 0 && (
                <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">⭐{selected.loyalty_points}</span>
              )}
            </span>
          ) : <span className="text-gray-400">Walk-in Customer</span>}
        </span>
        {selected && (
          <button onClick={e => { e.stopPropagation(); onSelect(null) }}
            className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-red-100 hover:text-red-500 text-gray-400 transition flex-shrink-0">
            <MdClose size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus type="text" placeholder="Search name or phone..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <div onClick={() => { onSelect(null); setOpen(false) }}
              className="px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
              <MdPerson size={14} /> Walk-in Customer
            </div>
            {filtered.map(c => (
              <div key={c.id} onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                  {c.customer_type === 'wholesale' && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">🏪 Wholesale</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{c.phone}</span>
                  {c.loyalty_points > 0 && <span className="text-xs text-amber-600 font-medium">⭐ {c.loyalty_points} pts</span>}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="px-4 py-4 text-sm text-gray-300 text-center">No customers found</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN POS ────────────────────────────────────────────────────
const POS = () => {
  const [products, setProducts]               = useState([])
  const [categories, setCategories]           = useState([])
  const [customers, setCustomers]             = useState([])
  const [business, setBusiness]               = useState(null)
  const [cart, setCart]                       = useState([])
  const [heldOrders, setHeldOrders]           = useState([])
  const [search, setSearch]                   = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [paymentMethod, setPaymentMethod]     = useState('cash')
  const [discount, setDiscount]               = useState(0)
  const [discountType, setDiscountType]       = useState('percent')
  const [taxRate, setTaxRate]                 = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loading, setLoading]                 = useState(false)
  const [receipt, setReceipt]                 = useState(null)
  const [showHeld, setShowHeld]               = useState(false)
  const [showSplit, setShowSplit]             = useState(false)
  const [splitPayments, setSplitPayments]     = useState(null)
  const [useLoyalty, setUseLoyalty]           = useState(false)
  const [categoryDiscounts, setCategoryDiscounts] = useState({})
  const [barcodeFlash, setBarcodeFlash]       = useState(false)
  const [showCart, setShowCart]               = useState(false)

  useEffect(() => {
    fetchProducts(); fetchCategories(); fetchCustomers(); fetchBusiness()
  }, [])

  const fetchProducts  = async () => { try { const r = await API.get('/products/products/');  setProducts(r.data?.results ?? r.data)  } catch(e){} }
  const fetchCategories= async () => { try { const r = await API.get('/products/categories/'); setCategories(r.data?.results ?? r.data) } catch(e){} }
  const fetchCustomers = async () => { try { const r = await API.get('/customers/customers/'); setCustomers(r.data?.results ?? r.data)  } catch(e){} }
  const fetchBusiness  = async () => { try { const r = await API.get('/business/');            setBusiness(r.data[0]) } catch(e){} }

  // ── Wholesale pricing ──
  const getPrice = useCallback((product) => {
    if (selectedCustomer?.customer_type === 'wholesale' && Number(product.wholesale_price) > 0)
      return Number(product.wholesale_price)
    return Number(product.retail_price || product.price || 0)
  }, [selectedCustomer])

  // ── Barcode scanner ──
  const handleBarcodeScan = useCallback((barcode) => {
    const product = products.find(p => p.barcode === barcode || String(p.id) === barcode)
    if (product) { addToCart(product); setBarcodeFlash(true); setTimeout(() => setBarcodeFlash(false), 700) }
  }, [products, selectedCustomer])
  useBarcodeScanner(handleBarcodeScan)

  // ── Filter ──
  const filteredProducts = products.filter(p => {
    const ms = p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
    const mc = selectedCategory === 'all' || p.category === selectedCategory || p.category?.toString() === selectedCategory?.toString()
    return ms && mc
  })

  // ── Cart ──
  const addToCart = (product) => {
    const stockField = product.stock_quantity ?? product.stock_qty ?? 0
    if (stockField <= 0) return
    const price = getPrice(product)
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id)
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1, price } : i)
      return [...prev, { ...product, qty: 1, price }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
      .filter(i => i.qty > 0)
    )
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  // Update prices when customer changes
  useEffect(() => {
    if (cart.length > 0) {
      setCart(prev => prev.map(item => {
        const p = products.find(p => p.id === item.id)
        return p ? { ...item, price: getPrice(p) } : item
      }))
    }
  }, [selectedCustomer])

  // ── Category discount ──
  const getCatDiscount = (item) => {
    const p = products.find(p => p.id === item.id)
    if (!p) return 0
    const d = categoryDiscounts[p.category] || categoryDiscounts[p.category?.toString()] || 0
    return (item.price * item.qty * d) / 100
  }

  // ── Calculations ──
  const subtotal              = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const totalCatDiscount      = cart.reduce((s, i) => s + getCatDiscount(i), 0)
  const afterCatDiscount      = subtotal - totalCatDiscount
  const discountAmount        = discountType === 'percent' ? (afterCatDiscount * discount) / 100 : Number(discount)
  const afterDiscount         = afterCatDiscount - discountAmount
  const availableLoyalty      = selectedCustomer?.loyalty_points || 0
  const maxLoyaltyDisc        = Math.min(availableLoyalty * LOYALTY_VALUE, afterDiscount * 0.5)
  const loyaltyDiscount       = useLoyalty && selectedCustomer ? maxLoyaltyDisc : 0
  const afterLoyalty          = afterDiscount - loyaltyDiscount
  // ✅ FIX 1: Round to 2 decimal places to avoid backend validation error
  const taxAmount             = parseFloat(((afterLoyalty * taxRate) / 100).toFixed(2))
  const total                 = parseFloat((afterLoyalty + taxAmount).toFixed(2))
  const pointsEarned          = Math.floor(total / 100) * LOYALTY_RATE
  const cartCount             = cart.reduce((s, i) => s + i.qty, 0)
  const isWholesale           = selectedCustomer?.customer_type === 'wholesale'

  // ── Hold / Resume ──
  const holdOrder = () => {
    if (!cart.length) return
    setHeldOrders(p => [...p, { id: Date.now(), cart, discount, discountType, taxRate, paymentMethod, selectedCustomer, splitPayments, useLoyalty, categoryDiscounts }])
    resetCart()
  }
  const resumeOrder = (held) => {
    setCart(held.cart); setDiscount(held.discount); setDiscountType(held.discountType)
    setTaxRate(held.taxRate); setPaymentMethod(held.paymentMethod); setSelectedCustomer(held.selectedCustomer)
    setSplitPayments(held.splitPayments); setUseLoyalty(held.useLoyalty || false)
    setCategoryDiscounts(held.categoryDiscounts || {}); setHeldOrders(p => p.filter(o => o.id !== held.id)); setShowHeld(false)
  }
  const resetCart = () => {
    setCart([]); setDiscount(0); setTaxRate(0); setSelectedCustomer(null)
    setPaymentMethod('cash'); setSplitPayments(null); setUseLoyalty(false); setCategoryDiscounts({})
  }

  // ── Checkout ──
  const handleCheckout = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      const paymentLabel = splitPayments
        ? 'Split: ' + splitPayments.map(sp => `${sp.label} Rs.${sp.amount}`).join(' + ')
        : PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod

      const res = await API.post('/pos/orders/', {
        customer:          selectedCustomer?.id || null,
        items:             cart.map(i => ({
          product:     i.id,
          qty:         i.qty,
          unit_price:  parseFloat(Number(i.price).toFixed(2)),
          total_price: parseFloat((i.price * i.qty).toFixed(2)),
        })),
        subtotal:          parseFloat(subtotal.toFixed(2)),
        category_discount: parseFloat(totalCatDiscount.toFixed(2)),
        discount_type:     discountType,
        discount_value:    parseFloat(Number(discount).toFixed(2)),
        loyalty_discount:  parseFloat(loyaltyDiscount.toFixed(2)),
        // ✅ FIX 1: Already rounded above, sending clean 2-decimal values
        tax_amount:        taxAmount,
        total:             total,
        payment_method:    splitPayments ? 'split' : paymentMethod,
        split_payments:    splitPayments || null,
        status:            'paid',
        points_earned:     pointsEarned,
      })

      setReceipt({
        id:               res.data.id || Math.floor(Math.random() * 9999),
        items:            cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        customer_name:    selectedCustomer?.name || null,
        customer_type:    selectedCustomer?.customer_type || null,
        payment_label:    paymentLabel,
        subtotal, categoryDiscount: totalCatDiscount, discount: discountAmount,
        loyaltyUsed: loyaltyDiscount, tax: taxAmount, taxRate, total,
        splitPayment: splitPayments, pointsEarned,
      })
      resetCart(); fetchProducts()
    } catch (err) {
      alert('Checkout error: ' + JSON.stringify(err.response?.data || err.message))
    } finally {
      setLoading(false)
    }
  }

  // ─── CART PANEL ──────────────────────────────────────────────────
  const CartPanel = () => (
    <div style={{display:'flex', flexDirection:'column', height:'100%', background:'white', overflow:'hidden'}}>

      {/* ── STICKY HEADER ── */}
      <div style={{flexShrink:0, padding:'12px 16px', borderBottom:'1px solid #f3f4f6'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <MdShoppingCart size={18} color="#2563eb" />
            <span style={{fontWeight:700, fontSize:14, color:'#1f2937'}}>Cart</span>
            {cartCount > 0 && (
              <span style={{background:'#2563eb', color:'white', fontSize:11, fontWeight:700, borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center'}}>{cartCount}</span>
            )}
            {isWholesale && (
              <span style={{fontSize:11, background:'#ede9fe', color:'#7c3aed', padding:'2px 8px', borderRadius:999, fontWeight:600}}>WS</span>
            )}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            {heldOrders.length > 0 && (
              <button onClick={() => setShowHeld(true)}
                style={{display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'#fffbeb', border:'1px solid #fcd34d', color:'#b45309', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer'}}>
                <MdPause size={14} /> {heldOrders.length}
              </button>
            )}
            {cart.length > 0 && (
              <button onClick={() => setCart([])} style={{fontSize:11, color:'#f87171', fontWeight:500, background:'none', border:'none', cursor:'pointer'}}>Clear</button>
            )}
          </div>
        </div>
        <CustomerSelect customers={customers} selected={selectedCustomer} onSelect={(c) => { setSelectedCustomer(c); setUseLoyalty(false) }} />
      </div>

      {/* ── SCROLLABLE MIDDLE (cart items + discount + tax + loyalty + totals + payment) ── */}
      <div style={{flex:1, overflowY:'auto', overflowX:'hidden'}}>

        {/* Cart Items */}
        <div style={{padding:'12px 16px', display:'flex', flexDirection:'column', gap:8}}>
          {cart.length === 0 ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:100, textAlign:'center'}}>
              <MdShoppingCart size={36} color="#e5e7eb" />
              <p style={{color:'#d1d5db', fontSize:13, marginTop:8}}>Cart is empty</p>
              <p style={{color:'#e5e7eb', fontSize:11, marginTop:4}}>Click products to add</p>
            </div>
          ) : cart.map(item => {
            const catD = getCatDiscount(item)
            return (
              <div key={item.id} style={{display:'flex', alignItems:'center', gap:8, background:'#f9fafb', borderRadius:12, padding:10}}>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontSize:11, fontWeight:600, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.name}</p>
                  <div style={{display:'flex', alignItems:'center', gap:6, marginTop:2}}>
                    <span style={{fontSize:11, color:'#2563eb', fontWeight:700}}>Rs. {Number(item.price).toLocaleString()}</span>
                    {catD > 0 && <span style={{fontSize:11, color:'#059669'}}>(-{((catD/(item.price*item.qty))*100).toFixed(0)}%)</span>}
                  </div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:4, flexShrink:0}}>
                  <button onClick={() => updateQty(item.id, -1)} style={{width:24, height:24, background:'#e5e7eb', border:'none', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><MdRemove size={12} /></button>
                  <span style={{fontSize:11, fontWeight:900, width:24, textAlign:'center', color:'#1f2937'}}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{width:24, height:24, background:'#dbeafe', border:'none', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#2563eb'}}><MdAdd size={12} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{width:24, height:24, background:'none', border:'none', cursor:'pointer', color:'#fca5a5', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <MdDelete size={14} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Discount + Tax */}
        <div style={{padding:'12px 16px', borderTop:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:12}}>
          <div>
            <p style={{fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6}}>Discount</p>
            <div style={{display:'flex', gap:6}}>
              <button onClick={() => setDiscountType('percent')}
                style={{padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, border:'none', cursor:'pointer', background: discountType==='percent' ? '#2563eb' : '#f3f4f6', color: discountType==='percent' ? 'white' : '#6b7280'}}>%</button>
              <button onClick={() => setDiscountType('flat')}
                style={{padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, border:'none', cursor:'pointer', background: discountType==='flat' ? '#2563eb' : '#f3f4f6', color: discountType==='flat' ? 'white' : '#6b7280'}}>Rs.</button>
              <input type="number" value={discount} min="0"
                onChange={e => setDiscount(Number(e.target.value))}
                style={{flex:1, padding:'6px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:11, outline:'none', background:'#f9fafb'}} />
            </div>
          </div>
          <div>
            <p style={{fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6}}>Tax Rate (%)</p>
            <input type="number" value={taxRate} min="0" max="100"
              onChange={e => setTaxRate(Number(e.target.value))}
              style={{width:'100%', padding:'6px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:11, outline:'none', background:'#f9fafb', boxSizing:'border-box'}} />
          </div>
          {selectedCustomer && availableLoyalty > 0 && (
            <div onClick={() => setUseLoyalty(!useLoyalty)}
              style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:12, padding:12, cursor:'pointer', border: useLoyalty ? '1px solid #fcd34d' : '1px solid #e5e7eb', background: useLoyalty ? '#fffbeb' : '#f9fafb'}}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <MdStar size={16} color={useLoyalty ? '#f59e0b' : '#d1d5db'} />
                <div>
                  <p style={{fontSize:11, fontWeight:600, color:'#374151'}}>Loyalty Points</p>
                  <p style={{fontSize:11, color:'#9ca3af'}}>{availableLoyalty} pts available</p>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                {useLoyalty
                  ? <p style={{fontSize:11, fontWeight:700, color:'#d97706'}}>-Rs. {maxLoyaltyDisc.toFixed(0)}</p>
                  : <p style={{fontSize:11, color:'#d1d5db'}}>Tap to use</p>
                }
                <div style={{width:32, height:16, borderRadius:999, marginTop:4, background: useLoyalty ? '#fbbf24' : '#e5e7eb'}} />
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{padding:'12px 16px', borderTop:'1px solid #f3f4f6', background:'#f9fafb', display:'flex', flexDirection:'column', gap:6}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'#6b7280'}}><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
          {totalCatDiscount > 0 && <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'#7c3aed'}}><span>Category Disc.</span><span>- Rs. {totalCatDiscount.toFixed(0)}</span></div>}
          {discountAmount > 0 && <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'#ef4444'}}><span>Discount</span><span>- Rs. {discountAmount.toFixed(0)}</span></div>}
          {loyaltyDiscount > 0 && <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'#d97706'}}><span>Loyalty</span><span>- Rs. {loyaltyDiscount.toFixed(0)}</span></div>}
          {taxAmount > 0 && <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'#6b7280'}}><span>Tax ({taxRate}%)</span><span>+ Rs. {taxAmount.toFixed(0)}</span></div>}
          <div style={{display:'flex', justifyContent:'space-between', fontWeight:900, color:'#111827', fontSize:16, paddingTop:8, borderTop:'1px solid #e5e7eb'}}>
            <span>Total</span><span style={{color:'#2563eb'}}>Rs. {total.toLocaleString()}</span>
          </div>
          {pointsEarned > 0 && <p style={{textAlign:'center', fontSize:11, color:'#f59e0b', fontWeight:500}}>⭐ Will earn {pointsEarned} loyalty points</p>}
        </div>

        {/* Payment */}
        <div style={{padding:'12px 16px', borderTop:'1px solid #f3f4f6'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
            <p style={{fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em'}}>Payment</p>
            <button onClick={() => setShowSplit(true)}
              style={{display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#2563eb', fontWeight:600, background:'none', border:'none', cursor:'pointer'}}>
              <MdSplitscreen size={13} /> Split
            </button>
          </div>
          {splitPayments ? (
            <div style={{background:'#eff6ff', borderRadius:12, padding:12, border:'1px solid #bfdbfe', display:'flex', flexDirection:'column', gap:4}}>
              {splitPayments.map((sp, i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'#374151'}}>
                  <span>{sp.icon} {sp.label}</span><span style={{fontWeight:600}}>Rs. {sp.amount.toLocaleString()}</span>
                </div>
              ))}
              <button onClick={() => setSplitPayments(null)} style={{fontSize:11, color:'#f87171', background:'none', border:'none', cursor:'pointer', marginTop:4}}>✕ Remove Split</button>
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderRadius:12, fontSize:11, fontWeight:600, border:'none', cursor:'pointer',
                    background: paymentMethod===m.id ? '#2563eb' : '#f3f4f6',
                    color: paymentMethod===m.id ? 'white' : '#4b5563'}}>
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer so last item not hidden behind sticky footer */}
        <div style={{height:8}} />
      </div>

      {/* ── STICKY BOTTOM BUTTONS ── */}
      <div style={{flexShrink:0, padding:'12px 16px 16px', borderTop:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:8, background:'white'}}>
        <button onClick={holdOrder} disabled={!cart.length}
          style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 0', border:'2px solid #fcd34d', color:'#d97706', borderRadius:12, fontSize:13, fontWeight:600, background:'white', cursor: cart.length ? 'pointer' : 'not-allowed', opacity: cart.length ? 1 : 0.4}}>
          <MdPause size={16} /> Hold Order
        </button>
        <button onClick={handleCheckout} disabled={loading || !cart.length}
          style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px 0', background: (loading||!cart.length) ? '#93c5fd' : '#2563eb', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:900, cursor: (loading||!cart.length) ? 'not-allowed' : 'pointer', boxShadow:'0 4px 14px rgba(37,99,235,0.3)'}}>
          {loading
            ? <><div style={{width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} /> Processing...</>
            : <><MdPointOfSale size={18} /> Checkout — Rs. {total.toLocaleString()}</>
          }
        </button>
      </div>
    </div>
  )

  return (
    <Layout>
      <style>{`
        @keyframes barcode-flash { 0%,100%{background:transparent} 50%{background:#dcfce7} }
        .barcode-flash { animation: barcode-flash 0.6s ease-out }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:flex gap-4 h-[calc(100vh-80px)]">

        {/* Left — Products */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

          {/* Search + Controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="flex gap-2">
              <div className={`relative flex-1 ${barcodeFlash ? 'barcode-flash rounded-xl' : ''}`}>
                <MdSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="text" placeholder="Search products or scan barcode..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition" />
                <MdQrCodeScanner className="absolute right-3 top-3 text-gray-300" size={18} />
              </div>
              <button onClick={() => { fetchProducts(); fetchCustomers() }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-300 transition">
                <MdRefresh size={18} />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat.name}
                  {categoryDiscounts[cat.id] > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none font-bold">
                      {categoryDiscounts[cat.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Category Discount */}
            {selectedCategory !== 'all' && (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                <MdLocalOffer size={15} className="text-purple-500 flex-shrink-0" />
                <span className="text-xs text-purple-700 font-semibold flex-1">
                  Discount for "{categories.find(c => c.id === selectedCategory || c.id?.toString() === selectedCategory?.toString())?.name}"
                </span>
                <input type="number" min="0" max="100" placeholder="0"
                  value={categoryDiscounts[selectedCategory] || ''}
                  onChange={e => setCategoryDiscounts(p => ({ ...p, [selectedCategory]: Number(e.target.value) }))}
                  className="w-16 px-2 py-1 border border-purple-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
                <span className="text-xs text-purple-500 font-bold">%</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <MdKeyboard size={13} /> Barcode scanner ready — scan any product to add instantly
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-2">
              {filteredProducts.length === 0 ? (
                <div className="col-span-4 text-center py-20 text-gray-200">
                  <MdCategory size={48} className="mx-auto mb-3" />
                  <p className="text-sm">No products found</p>
                </div>
              ) : filteredProducts.map(product => {
                const displayPrice  = getPrice(product)
                const isWSPrice     = isWholesale && Number(product.wholesale_price) > 0 && Number(product.wholesale_price) !== Number(product.retail_price || product.price)
                const catD          = categoryDiscounts[product.category] || 0
                const stockQty      = product.stock_quantity ?? product.stock_qty ?? 0
                const outOfStock    = stockQty <= 0
                return (
                  <div key={product.id} onClick={() => addToCart(product)}
                    className={`bg-white rounded-2xl border-2 shadow-sm p-4 text-center transition relative overflow-hidden
                      ${outOfStock ? 'opacity-50 cursor-not-allowed border-transparent' : 'cursor-pointer hover:border-blue-500 hover:shadow-md border-transparent active:scale-[0.97]'}`}>
                    {isWSPrice && <span className="absolute top-2 left-2 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold">W</span>}
                    {catD > 0 && <span className="absolute top-2 right-2 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">-{catD}%</span>}
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">📦</span>
                    </div>
                    <p className="font-semibold text-gray-800 text-xs truncate">{product.name}</p>
                    <div className="mt-1.5">
                      <p className="text-blue-600 font-black text-sm">Rs. {displayPrice.toLocaleString()}</p>
                      {isWSPrice && <p className="text-gray-300 line-through text-xs">Rs. {Number(product.retail_price || product.price).toLocaleString()}</p>}
                    </div>
                    <p className={`text-xs mt-1 font-semibold ${outOfStock ? 'text-red-400' : stockQty <= 5 ? 'text-orange-400' : 'text-gray-300'}`}>
                      {outOfStock ? 'Out of stock' : `Stock: ${stockQty}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right — Cart */}
        <div className="w-80 flex-shrink-0 rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{height:'calc(100vh - 80px)'}}>
          <CartPanel />
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden flex flex-col h-[calc(100vh-80px)]">

        {/* Mobile Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-3 space-y-2">
          <div className="relative">
            <MdSearch className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="text" placeholder="Search or scan barcode..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2.5 pb-24">
            {filteredProducts.map(product => {
              const displayPrice = getPrice(product)
              const stockQty     = product.stock_quantity ?? product.stock_qty ?? 0
              const outOfStock   = stockQty <= 0
              return (
                <div key={product.id} onClick={() => addToCart(product)}
                  className={`bg-white rounded-xl border-2 p-3 text-center transition
                    ${outOfStock ? 'opacity-50 cursor-not-allowed border-transparent' : 'cursor-pointer active:scale-95 hover:border-blue-400 border-transparent'}`}>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">📦</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                  <p className="text-blue-600 font-black text-sm mt-1">Rs. {displayPrice.toLocaleString()}</p>
                  <p className={`text-xs mt-0.5 font-medium ${outOfStock ? 'text-red-400' : 'text-gray-300'}`}>
                    {outOfStock ? 'Out of stock' : `${stockQty} left`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Cart FAB */}
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-30 px-4">
          <button onClick={() => setShowCart(true)}
            className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-blue-300 font-black text-sm w-full max-w-sm justify-between">
            <div className="flex items-center gap-2">
              <MdShoppingCart size={20} />
              {cartCount > 0 && <span className="bg-white text-blue-600 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}
              <span>Cart</span>
            </div>
            <span>Rs. {total.toLocaleString()}</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE CART DRAWER ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-black text-gray-900">Your Cart</span>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                <MdClose size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <CartPanel />
            </div>
          </div>
        </div>
      )}

      {/* ── HELD ORDERS MODAL ── */}
      {showHeld && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <MdPause size={18} className="text-white" />
                </div>
                <span className="font-bold text-gray-800">Held Orders</span>
              </div>
              <button onClick={() => setShowHeld(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <MdClose size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {heldOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{order.selectedCustomer?.name || 'Walk-in'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.cart.length} items · Rs. {order.cart.reduce((s,i) => s + i.price*i.qty, 0).toLocaleString()}</p>
                  </div>
                  <button onClick={() => resumeOrder(order)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition">
                    <MdPlayArrow size={15} /> Resume
                  </button>
                </div>
              ))}
              {heldOrders.length === 0 && <p className="text-center text-gray-300 py-6">No held orders</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── SPLIT PAYMENT MODAL ── */}
      {showSplit && (
        <SplitPaymentModal
          total={total}
          onConfirm={(splits) => { setSplitPayments(splits); setShowSplit(false) }}
          onClose={() => setShowSplit(false)}
        />
      )}

      {/* ── RECEIPT MODAL ── */}
      {receipt && (
        <ReceiptModal order={receipt} business={business} onClose={() => setReceipt(null)} />
      )}
    </Layout>
  )
}

export default POS