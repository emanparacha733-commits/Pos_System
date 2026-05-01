import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdSearch, MdAdd, MdRemove, MdDelete, MdShoppingCart,
  MdPerson, MdPause, MdPlayArrow, MdPrint, MdClose,
  MdReceipt, MdPercent, MdAttachMoney
} from 'react-icons/md'

// ─── Receipt Modal ────────────────────────────────────────────────
const ReceiptModal = ({ order, business, onClose }) => {
  const printRef = useRef()

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: monospace; padding: 20px; max-width: 300px; margin: auto; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; font-size: 13px; }
        .title { text-align: center; font-size: 16px; font-weight: bold; }
        .sub { text-align: center; font-size: 12px; color: #555; }
        .total-row { font-weight: bold; font-size: 14px; }
      </style>
      </head><body>${content}</body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MdReceipt size={20} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Receipt</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose size={20} />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-4" ref={printRef}>
          <div className="title">{business?.name || 'POS System'}</div>
          {business?.address && <div className="sub">{business.address}</div>}
          {business?.phone && <div className="sub">{business.phone}</div>}
          {business?.email && <div className="sub">{business.email}</div>}
          <div className="divider mt-2" />

          <div className="text-xs text-gray-500 mb-2">
            <div>Order #{order.id}</div>
            <div>{new Date().toLocaleString()}</div>
            {order.customer_name && <div>Customer: {order.customer_name}</div>}
            <div>Payment: <span className="capitalize">{order.payment_method}</span></div>
          </div>

          <div className="divider" />

          {/* Items */}
          {order.items.map((item, i) => (
            <div key={i} className="row py-1">
              <span className="flex-1 text-sm">{item.name} x{item.qty}</span>
              <span className="text-sm">Rs. {(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}

          <div className="divider" />

          <div className="row"><span>Subtotal</span><span>Rs. {order.subtotal.toFixed(2)}</span></div>
          {order.discount > 0 && (
            <div className="row text-red-500"><span>Discount</span><span>- Rs. {order.discount.toFixed(2)}</span></div>
          )}
          {order.tax > 0 && (
            <div className="row"><span>Tax ({order.taxRate}%)</span><span>Rs. {order.tax.toFixed(2)}</span></div>
          )}
          <div className="divider" />
          <div className="row total-row">
            <span>TOTAL</span><span>Rs. {order.total.toFixed(2)}</span>
          </div>
          <div className="divider mt-2" />
          <div className="sub mt-2">Thank you for your purchase!</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition font-medium"
          >
            <MdPrint size={18} /> Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Customer Search Dropdown ──────────────────────────────────────
const CustomerSelect = ({ customers, selectedCustomer, onSelect }) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition bg-white"
      >
        <MdPerson size={18} className="text-blue-600" />
        <span className="text-sm text-gray-700 flex-1">
          {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
        </span>
        {selectedCustomer && (
          <button
            onClick={e => { e.stopPropagation(); onSelect(null) }}
            className="text-gray-400 hover:text-red-500"
          >
            <MdClose size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
          <div className="p-2">
            <input
              autoFocus
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            <div
              onClick={() => { onSelect(null); setOpen(false) }}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Walk-in Customer
            </div>
            {filtered.map(c => (
              <div
                key={c.id}
                onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer"
              >
                <div className="font-medium text-gray-800">{c.name}</div>
                <div className="text-xs text-gray-400">{c.phone}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-400">No customers found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main POS Component ───────────────────────────────────────────
const POS = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [customers, setCustomers] = useState([])
  const [business, setBusiness] = useState(null)   // ✅ ADD
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

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchCustomers()
    fetchBusiness()   // ✅ ADD
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products/products/')
      setProducts(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchCategories = async () => {
    try {
      const res = await API.get('/products/categories/')
      setCategories(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchCustomers = async () => {
    try {
      const res = await API.get('/customers/customers/')
      setCustomers(res.data)
    } catch (err) { console.error(err) }
  }

  // ✅ ADD — fetchBusiness function
 const fetchBusiness = async () => {
  try {
    const res = await API.get('/business/')
    setBusiness(res.data[0])  // ← [0] lagao, array hai
  } catch (err) { 
    console.error('Business fetch error:', err) 
  }
}

  // ── Filtering ──
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  // ── Cart Actions ──
  const addToCart = (product) => {
    if (product.stock_qty <= 0) return
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      ))
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }
  }

  const updateQty = (id, change) => {
    setCart(
      cart.map(item =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + change) } : item
      ).filter(item => item.qty > 0)
    )
  }

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id))

  // ── Calculations ──
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const discountAmount = discountType === 'percent'
    ? (subtotal * discount) / 100
    : Number(discount)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = (afterDiscount * taxRate) / 100
  const total = afterDiscount + taxAmount

  // ── Hold Order ──
  const holdOrder = () => {
    if (cart.length === 0) return
    setHeldOrders([...heldOrders, {
      id: Date.now(),
      cart, discount, discountType, taxRate, paymentMethod, selectedCustomer
    }])
    setCart([])
    setDiscount(0)
    setTaxRate(0)
    setSelectedCustomer(null)
    setPaymentMethod('cash')
  }

  const resumeOrder = (held) => {
    setCart(held.cart)
    setDiscount(held.discount)
    setDiscountType(held.discountType)
    setTaxRate(held.taxRate)
    setPaymentMethod(held.paymentMethod)
    setSelectedCustomer(held.selectedCustomer)
    setHeldOrders(heldOrders.filter(o => o.id !== held.id))
    setShowHeld(false)
  }

  // ── Checkout ──
  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty!')
    setLoading(true)
    try {
      const res = await API.post('/pos/orders/', {
        customer: selectedCustomer?.id || null,
        items: cart.map(item => ({
          product: item.id,
          qty: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty,
        })),
        subtotal,
        discount_type: discountType,
        discount_value: discount,
        tax_amount: taxAmount,
        total,
        payment_method: paymentMethod,
        status: 'paid',
      })

      setReceipt({
        id: res.data.id || Math.floor(Math.random() * 10000),
        items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
        customer_name: selectedCustomer?.name || null,
        payment_method: paymentMethod,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        taxRate,
        total,
      })

      setCart([])
      setDiscount(0)
      setTaxRate(0)
      setSelectedCustomer(null)
      setPaymentMethod('cash')
      fetchProducts()
    } catch (err) {
      const errorData = err.response?.data
      console.error('ORDER ERROR:', JSON.stringify(errorData, null, 2))
      alert('Error: ' + JSON.stringify(errorData))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex gap-4 h-full">

        {/* ── Left — Products ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Search + Categories */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {heldOrders.length > 0 && (
                <button
                  onClick={() => setShowHeld(true)}
                  className="relative flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 transition"
                >
                  <MdPause size={18} />
                  Held
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {heldOrders.length}
                  </span>
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pb-2">
            {filteredProducts.length === 0 ? (
              <div className="col-span-4 text-center text-gray-400 py-16">No products found</div>
            ) : filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`bg-white rounded-xl shadow-sm p-4 text-center transition border-2 ${
                  product.stock_qty <= 0
                    ? 'opacity-50 cursor-not-allowed border-transparent'
                    : 'cursor-pointer hover:border-blue-500 border-transparent hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-2">📦</div>
                <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                <p className="text-blue-600 font-bold mt-1 text-sm">Rs. {Number(product.price).toLocaleString()}</p>
                <p className={`text-xs mt-1 font-medium ${product.stock_qty <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                  {product.stock_qty <= 0 ? 'Out of stock' : `Stock: ${product.stock_qty}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — Cart ── */}
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
              </div>
              <button onClick={() => setCart([])} className="text-red-500 text-xs hover:text-red-700">Clear</button>
            </div>
            <CustomerSelect
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center mt-10">
                <MdShoppingCart size={40} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Cart is empty</p>
                <p className="text-gray-300 text-xs mt-1">Click products to add</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-blue-600">Rs. {Number(item.price).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                    <MdRemove size={14} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                    <MdAdd size={14} />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <MdDelete size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Discount + Tax */}
          <div className="px-4 py-2 border-t space-y-2">
            <div>
              <label className="text-xs text-gray-500 font-medium">Discount</label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setDiscountType('percent')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  %
                </button>
                <button
                  onClick={() => setDiscountType('flat')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${discountType === 'flat' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Rs.
                </button>
                <input
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full mt-1 px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                placeholder="0"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="px-4 py-3 border-t space-y-1 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount</span><span>- Rs. {discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax ({taxRate}%)</span><span>+ Rs. {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-200 mt-1">
              <span>Total</span><span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="px-4 py-2 border-t">
            <label className="text-xs text-gray-500 font-medium">Payment Method</label>
            <div className="flex gap-2 mt-1">
              {['cash', 'card', 'online'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition ${paymentMethod === method ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 flex flex-col gap-2">
            <button
              onClick={holdOrder}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-yellow-400 text-yellow-600 rounded-xl font-medium text-sm hover:bg-yellow-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MdPause size={16} /> Hold Order
            </button>
            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Checkout — Rs. ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Held Orders Modal ── */}
      {showHeld && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-800">Held Orders</h2>
              <button onClick={() => setShowHeld(false)} className="text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
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
                  <button
                    onClick={() => resumeOrder(order)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                  >
                    <MdPlayArrow size={16} /> Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {receipt && (
        <ReceiptModal order={receipt} business={business} onClose={() => setReceipt(null)} />
      )}
    </Layout>
  )
}

export default POS