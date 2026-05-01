import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  MdShoppingCart, MdSearch, MdClose, MdAdd, MdRemove,
  MdLocationOn, MdPhone, MdEmail, MdPerson, MdCheckCircle
} from 'react-icons/md'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

// ─── Cart Drawer ──────────────────────────────────────────────
const CartDrawer = ({ cart, onClose, onUpdateQty, onRemove, onCheckout }) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">🛒 Your Cart ({cart.length})</h2>
          <button onClick={onClose}><MdClose size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <MdShoppingCart size={60} className="mx-auto mb-3 opacity-30" />
              <p>Your cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📦</div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                <p className="text-blue-600 font-bold text-sm">Rs. {item.price.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                    <MdRemove size={14} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                    <MdAdd size={14} />
                  </button>
                </div>
              </div>
              <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600">
                <MdClose size={18} />
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span className="text-blue-600">Rs. {total.toLocaleString()}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Proceed to Checkout
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
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: '',
  })

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.customer_name || !form.delivery_address) {
      return alert('Name and address are required!')
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/ecommerce/store/order/`, {
        ...form,
        items: cart.map(item => ({ product_id: item.id, qty: item.qty })),
        shipping_cost: 0,
      })
      onSuccess(res.data.order_id)
    } catch (err) {
      alert('Error placing order. Please try again!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-lg">Checkout</h2>
          <button onClick={onClose}><MdClose size={24} /></button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <MdPerson className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Full Name *"
              value={form.customer_name}
              onChange={e => f('customer_name', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <MdEmail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Email Address"
              type="email"
              value={form.customer_email}
              onChange={e => f('customer_email', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <MdPhone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Phone Number"
              value={form.customer_phone}
              onChange={e => f('customer_phone', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <MdLocationOn className="absolute left-3 top-3 text-gray-400" size={18} />
            <textarea
              placeholder="Delivery Address *"
              value={form.delivery_address}
              onChange={e => f('delivery_address', e.target.value)}
              rows={3}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <textarea
            placeholder="Order notes (optional)"
            value={form.notes}
            onChange={e => f('notes', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="font-medium text-sm text-gray-600 mb-2">Order Summary</p>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span>{item.name} x{item.qty}</span>
                <span>Rs. {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-blue-600">Rs. {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Placing Order...' : `Place Order — Rs. ${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Success Modal ────────────────────────────────────────────
const SuccessModal = ({ orderId, onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8">
      <MdCheckCircle size={70} className="text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
      <p className="text-gray-500 mb-1">Your order has been placed successfully.</p>
      <p className="text-blue-600 font-bold text-lg mb-6">Order #{orderId}</p>
      <p className="text-gray-400 text-sm mb-6">Save your order ID to track your order status.</p>
      <button
        onClick={onClose}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
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

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/ecommerce/store/products/`)
      setProducts(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/ecommerce/store/categories/`)
      setCategories(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      }
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
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">🛍️ Online Store</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <MdSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 md:w-64"
              />
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              <MdShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Products Grid ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🔍</p>
            <p>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-blue-50 flex items-center justify-center text-5xl">📦</div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-gray-800 text-sm truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-blue-600 font-bold">Rs. {Number(product.price).toLocaleString()}</p>
                      {product.stock_qty <= 0 && (
                        <p className="text-red-500 text-xs">Out of stock</p>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock_qty <= 0}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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