import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  MdShoppingCart, MdSearch, MdClose, MdAdd, MdRemove,
  MdLocationOn, MdPhone, MdEmail, MdPerson, MdCheckCircle,
  MdArrowForward, MdStar, MdLocalShipping, MdSecurity, MdHeadsetMic
} from 'react-icons/md'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

// ─── Cart Drawer ──────────────────────────────────────────────
const CartDrawer = ({ cart, onClose, onUpdateQty, onRemove, onCheckout }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Your Cart</h2>
            <p className="text-xs text-gray-400">{cart.reduce((s,i) => s+i.qty, 0)} items</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <MdClose size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdShoppingCart size={36} className="text-blue-300" />
              </div>
              <p className="text-gray-400 font-medium">Your cart is empty</p>
              <p className="text-gray-300 text-sm mt-1">Add some products to get started</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex gap-3">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
              ) : (
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📦</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                <p className="text-blue-600 font-bold text-sm mt-0.5">Rs. {Number(item.price).toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
                    <MdRemove size={14} />
                  </button>
                  <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                    <MdAdd size={14} />
                  </button>
                </div>
              </div>
              <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-400 transition self-start mt-1">
                <MdClose size={16} />
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Subtotal</span>
              <span className="font-bold text-gray-900 text-lg">Rs. {total.toLocaleString()}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Checkout <MdArrowForward size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Checkout Modal ───────────────────────────────────────────
const CheckoutModal = ({ cart, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    customer_name: '', customer_email: '',
    customer_phone: '', delivery_address: '', notes: '',
  })

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.customer_name || !form.delivery_address) return alert('Name and address are required!')
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/ecommerce/store/order/`, {
        ...form,
        items: cart.map(item => ({ product_id: item.id, qty: item.qty })),
        shipping_cost: 0,
      })
      onSuccess(res.data.order_id)
    } catch {
      alert('Error placing order. Please try again!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white text-xl">Checkout</h2>
              <p className="text-blue-100 text-sm mt-0.5">{cart.length} items · Rs. {total.toLocaleString()}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition">
              <MdClose size={18} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name *</label>
              <input
                placeholder="John Doe"
                value={form.customer_name}
                onChange={e => f('customer_name', e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
              <input
                placeholder="+92 300 0000000"
                value={form.customer_phone}
                onChange={e => f('customer_phone', e.target.value)}
                className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
            <input
              placeholder="john@example.com"
              type="email"
              value={form.customer_email}
              onChange={e => f('customer_email', e.target.value)}
              className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Address *</label>
            <textarea
              placeholder="House #, Street, City"
              value={form.delivery_address}
              onChange={e => f('delivery_address', e.target.value)}
              rows={2}
              className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Notes</label>
            <textarea
              placeholder="Any special instructions..."
              value={form.notes}
              onChange={e => f('notes', e.target.value)}
              rows={2}
              className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="font-semibold text-gray-700 text-sm mb-3">Order Summary</p>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">{item.name} <span className="text-gray-400">×{item.qty}</span></span>
                <span className="font-semibold text-gray-800">Rs. {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base pt-2 mt-1">
              <span>Total</span>
              <span className="text-blue-600">Rs. {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Placing Order...' : `Place Order · Rs. ${total.toLocaleString()}`}
            {!loading && <MdArrowForward size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Success Modal ────────────────────────────────────────────
const SuccessModal = ({ orderId, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center p-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <MdCheckCircle size={44} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
      <p className="text-gray-500 mb-1">Your order has been confirmed.</p>
      <div className="bg-blue-50 rounded-2xl px-6 py-3 my-4 inline-block">
        <p className="text-xs text-blue-400 font-medium">ORDER ID</p>
        <p className="text-blue-600 font-bold text-xl">#{orderId}</p>
      </div>
      <p className="text-gray-400 text-sm mb-6">Save your order ID to track your order status.</p>
      <button
        onClick={onClose}
        className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition"
      >
        Continue Shopping
      </button>
    </div>
  </div>
)

// ─── Main Store Component ─────────────────────────────────────
const Store = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [successOrderId, setSuccessOrderId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/ecommerce/store/products/`)
      setProducts(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/ecommerce/store/categories/`)
      setCategories(res.data)
    } catch (err) { console.error(err) }
  }

  const addToCart = (product) => {
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1000)
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id, change) => {
    setCart(prev =>
      prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + change) } : item)
        .filter(item => item.qty > 0)
    )
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id))

  const handleSuccess = (orderId) => {
    setSuccessOrderId(orderId)
    setShowCheckout(false)
    setCart([])
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🛍</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Online Store</span>
          </div>

          <div className="relative flex-1 max-w-sm">
            <MdSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-200"
          >
            <MdShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Categories */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-2">✨ Welcome to our store</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Shop the Latest<br />Products</h1>
            <p className="text-blue-100 mb-5">Quality products at great prices. Fast delivery.</p>
            <button
              onClick={() => document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition flex items-center gap-2"
            >
              Shop Now <MdArrowForward size={18} />
            </button>
          </div>
          <div className="hidden md:block text-8xl opacity-20">🛍️</div>
        </div>
      </div>

      {/* ── Features Bar ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-3 gap-4">
          {[
            { icon: <MdLocalShipping size={20} />, title: 'Fast Delivery', sub: 'Quick shipping' },
            { icon: <MdSecurity size={20} />, title: 'Secure Payment', sub: '100% safe' },
            { icon: <MdHeadsetMic size={20} />, title: '24/7 Support', sub: 'Always here' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
                <p className="text-gray-400 text-xs">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Products Grid ── */}
      <div id="products-section" className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredProducts.length} items)</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                <div className="relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-5xl">
                      📦
                    </div>
                  )}
                  {product.stock_qty <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                  {product.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      -{product.discount}%
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="font-semibold text-gray-800 text-sm truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-blue-600 font-bold">Rs. {Number(product.price).toLocaleString()}</p>
                      {product.stock_qty > 0 && product.stock_qty <= 10 && (
                        <p className="text-orange-500 text-xs">Only {product.stock_qty} left!</p>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock_qty <= 0}
                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                        addedId === product.id
                          ? 'bg-green-500 text-white scale-95'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {addedId === product.id ? '✓ Added' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">🛍</span>
            </div>
            <span className="font-bold text-gray-900">Online Store</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onCheckout={() => { setShowCart(false); setShowCheckout(true) }}
        />
      )}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSuccess}
        />
      )}
      {successOrderId && (
        <SuccessModal
          orderId={successOrderId}
          onClose={() => setSuccessOrderId(null)}
        />
      )}
    </div>
  )
}

export default Store