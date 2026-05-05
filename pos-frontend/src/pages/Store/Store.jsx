import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  MdShoppingCart, MdSearch, MdClose, MdAdd, MdRemove,
  MdCheckCircle, MdArrowForward, MdLocalShipping,
  MdSecurity, MdHeadsetMic, MdStar, MdTimer, MdTrackChanges,
  MdFavorite, MdFavoriteBorder, MdArrowBack, MdArrowDropDown
} from 'react-icons/md'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

// ── Inject Google Font + Keyframes ────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; }
    .font-display { font-family: 'Cormorant Garamond', serif; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideRight { from { transform:translateX(100%); } to { transform:translateX(0); } }
    @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
    @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
    @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
    @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    .animate-fadeUp { animation: fadeUp 0.6s ease forwards; }
    .animate-fadeIn { animation: fadeIn 0.4s ease forwards; }
    .animate-slideRight { animation: slideRight 0.35s cubic-bezier(0.32,0.72,0,1) forwards; }
    .animate-slideUp { animation: slideUp 0.4s ease forwards; }
    .animate-pulse-once { animation: pulse 0.3s ease; }
    .shimmer { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200% 100%; animation: shimmer 1.5s infinite; }
    .ticker-wrap { overflow:hidden; }
    .ticker { display:flex; width:max-content; animation: ticker 20s linear infinite; }
    .product-card:hover .product-img { transform: scale(1.06); }
    .product-img { transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); }
    .btn-primary { position:relative; overflow:hidden; }
    .btn-primary::after { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.15); transform:translateX(-100%); transition:transform 0.3s ease; }
    .btn-primary:hover::after { transform:translateX(0); }
    ::-webkit-scrollbar { width:6px; height:6px; }
    ::-webkit-scrollbar-track { background:#f1f1f1; }
    ::-webkit-scrollbar-thumb { background:#c1c1c1; border-radius:3px; }
  `}</style>
)

// ── Flash Timer ───────────────────────────────────────────────
const FlashTimer = ({ endsAt }) => {
  const [t, setT] = useState({ h:'00', m:'00', s:'00' })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt) - new Date()
      if (diff <= 0) return
      setT({
        h: String(Math.floor(diff/3600000)).padStart(2,'0'),
        m: String(Math.floor((diff%3600000)/60000)).padStart(2,'0'),
        s: String(Math.floor((diff%60000)/1000)).padStart(2,'0'),
      })
    }
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id)
  },[endsAt])
  return (
    <div className="flex items-center gap-1">
      {[t.h,t.m,t.s].map((v,i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-red-600 text-white font-mono font-bold text-sm px-2 py-0.5 rounded-md">{v}</span>
          {i<2 && <span className="text-red-600 font-bold">:</span>}
        </span>
      ))}
    </div>
  )
}

// ── Stars ─────────────────────────────────────────────────────
const Stars = ({ rating, count, size=14 }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i=>(
      <MdStar key={i} size={size} className={i<=rating?'text-amber-400':'text-gray-200'}/>
    ))}
    {count!==undefined && <span className="text-xs text-gray-400 ml-1.5">({count})</span>}
  </div>
)

// ── Skeleton Card ─────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden">
    <div className="h-64 shimmer"/>
    <div className="p-4 space-y-2">
      <div className="h-4 shimmer rounded w-3/4"/>
      <div className="h-4 shimmer rounded w-1/2"/>
      <div className="h-8 shimmer rounded-xl mt-3"/>
    </div>
  </div>
)

// ── Product Modal ─────────────────────────────────────────────
const ProductModal = ({ product, flashSale, onClose, onAddToCart }) => {
  const [qty, setQty] = useState(1)
  const [reviews, setReviews] = useState([])
  const [review, setReview] = useState({ customer_name:'', rating:5, comment:'' })
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState('details')
  const [wishlisted, setWishlisted] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(()=>{
    axios.get(`${API_URL}/ecommerce/reviews/${product.id}/`).then(r=>setReviews(r.data)).catch(()=>{})
  },[product.id])

  const avgRating = reviews.length ? Math.round(reviews.reduce((s,r)=>s+r.rating,0)/reviews.length) : 0
  const price = flashSale ? Number(flashSale.sale_price) : Number(product.price)

  const handleAdd = () => {
    onAddToCart(product, qty)
    setAdded(true)
    setTimeout(()=>setAdded(false), 1500)
  }

  const submitReview = async () => {
    if(!review.customer_name) return alert('Name required!')
    setSubmitting(true)
    try {
      const res = await axios.post(`${API_URL}/ecommerce/reviews/${product.id}/`, review)
      setReviews(p=>[res.data,...p])
      setReview({customer_name:'',rating:5,comment:''})
    } catch { alert('Error!') } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white w-full md:rounded-3xl md:max-w-3xl max-h-[95vh] overflow-hidden animate-slideUp md:animate-fadeUp" onClick={e=>e.stopPropagation()}>
        <div className="flex flex-col md:flex-row h-full max-h-[95vh]">

          {/* Image Side */}
          <div className="relative md:w-2/5 h-72 md:h-auto bg-gray-50 flex-shrink-0">
            {product.image
              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-stone-100 to-stone-200">📦</div>
            }
            <button onClick={()=>setWishlisted(!wishlisted)}
              className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition">
              {wishlisted ? <MdFavorite className="text-red-500" size={18}/> : <MdFavoriteBorder className="text-gray-500" size={18}/>}
            </button>
            {flashSale && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                FLASH SALE
              </div>
            )}
            <button onClick={onClose} className="absolute top-3 left-3 md:hidden w-9 h-9 bg-white/90 rounded-full flex items-center justify-center">
              <MdArrowBack size={18}/>
            </button>
          </div>

          {/* Content Side */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 md:p-7">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  {product.category_name && <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{product.category_name}</p>}
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h2>
                </div>
                <button onClick={onClose} className="hidden md:block ml-4 p-1 hover:bg-gray-100 rounded-full">
                  <MdClose size={20} className="text-gray-400"/>
                </button>
              </div>

              <div className="flex items-center gap-3 mt-2 mb-4">
                <Stars rating={avgRating} count={reviews.length} size={15}/>
                {product.stock_qty > 0 && product.stock_qty <= 10 &&
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Only {product.stock_qty} left</span>
                }
              </div>

              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-3xl font-bold text-gray-900">Rs. {price.toLocaleString()}</span>
                {flashSale && <span className="text-lg text-gray-400 line-through">Rs. {Number(product.price).toLocaleString()}</span>}
                {flashSale && (
                  <span className="text-sm bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                    {Math.round((1-Number(flashSale.sale_price)/Number(product.price))*100)}% OFF
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-100 mb-4">
                {['details','reviews'].map(t=>(
                  <button key={t} onClick={()=>setTab(t)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${tab===t?'border-gray-900 text-gray-900':'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    {t} {t==='reviews'&&`(${reviews.length})`}
                  </button>
                ))}
              </div>

              {tab==='details' && (
                <div className="space-y-3">
                  {product.description && <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {product.unit && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs">Unit</p><p className="font-medium capitalize">{product.unit}</p></div>}
                    {product.sku && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs">SKU</p><p className="font-medium">{product.sku}</p></div>}
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500"><MdLocalShipping size={16} className="text-green-500 flex-shrink-0"/> Free delivery above Rs. 2,000</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500"><MdSecurity size={16} className="text-blue-500 flex-shrink-0"/> Secure & encrypted checkout</div>
                  </div>
                </div>
              )}

              {tab==='reviews' && (
                <div className="space-y-3">
                  {reviews.length===0 && <p className="text-gray-400 text-sm text-center py-4">No reviews yet. Be the first!</p>}
                  {reviews.slice(0,4).map((r,i)=>(
                    <div key={i} className="border-b border-gray-50 pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-800">{r.customer_name}</span>
                        <Stars rating={r.rating} size={12}/>
                      </div>
                      {r.comment && <p className="text-gray-500 text-xs leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                  <div className="bg-gray-50 rounded-2xl p-4 mt-2">
                    <p className="font-semibold text-sm text-gray-800 mb-3">Write a Review</p>
                    <input placeholder="Your name" value={review.customer_name} onChange={e=>setReview(p=>({...p,customer_name:e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"/>
                    <div className="flex gap-1 mb-2">
                      {[1,2,3,4,5].map(s=>(
                        <button key={s} onClick={()=>setReview(p=>({...p,rating:s}))} className="transition hover:scale-110">
                          <MdStar size={26} className={s<=review.rating?'text-amber-400':'text-gray-200'}/>
                        </button>
                      ))}
                    </div>
                    <textarea placeholder="Your thoughts..." value={review.comment} onChange={e=>setReview(p=>({...p,comment:e.target.value}))}
                      rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white resize-none"/>
                    <button onClick={submitReview} disabled={submitting}
                      className="w-full bg-gray-900 text-white py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50">
                      {submitting?'Posting...':'Post Review'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add to Cart Bottom Bar */}
            <div className="border-t border-gray-100 p-5 flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition"><MdRemove size={16}/></button>
                <span className="w-10 text-center font-bold text-gray-900">{qty}</span>
                <button onClick={()=>setQty(q=>q+1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition"><MdAdd size={16}/></button>
              </div>
              <button onClick={handleAdd} disabled={product.stock_qty<=0}
                className={`btn-primary flex-1 py-3 rounded-xl font-semibold text-sm transition ${added?'bg-green-500 text-white':'bg-gray-900 text-white hover:bg-gray-700'} disabled:opacity-40`}>
                {added ? '✓ Added to Cart' : product.stock_qty<=0 ? 'Out of Stock' : `Add to Cart · Rs. ${(price*qty).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Cart Drawer ───────────────────────────────────────────────
const CartDrawer = ({ cart, onClose, onUpdateQty, onRemove, onCheckout }) => {
  const subtotal = cart.reduce((s,i)=>s+Number(i.price)*i.qty,0)
  const count = cart.reduce((s,i)=>s+i.qty,0)
  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white w-full max-w-sm flex flex-col shadow-2xl animate-slideRight">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">Your Cart</h2>
            <p className="text-xs text-gray-400 mt-0.5">{count} {count===1?'item':'items'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition">
            <MdClose size={18} className="text-gray-500"/>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length===0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">🛒</div>
              <p className="font-medium text-gray-700 mb-1">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add some products to get started</p>
            </div>
          ) : (
            <div className="space-y-5">
              {cart.map(item=>(
                <div key={item.id} className="flex gap-4 animate-fadeUp">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-gray-500 text-sm mt-0.5">Rs. {Number(item.price).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={()=>onUpdateQty(item.id,-1)} className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 transition text-gray-600"><MdRemove size={14}/></button>
                      <span className="text-sm font-bold text-gray-900 w-5 text-center">{item.qty}</span>
                      <button onClick={()=>onUpdateQty(item.id,1)} className="w-7 h-7 bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-700 transition"><MdAdd size={14}/></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={()=>onRemove(item.id)} className="text-gray-300 hover:text-red-400 transition"><MdClose size={16}/></button>
                    <p className="text-sm font-bold text-gray-900">Rs. {(Number(item.price)*item.qty).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length>0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Subtotal</span>
              <span className="font-bold text-gray-900 text-lg">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">Shipping & discounts calculated at checkout</p>
            <button onClick={onCheckout}
              className="btn-primary w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm">
              Proceed to Checkout <MdArrowForward size={18}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Checkout Modal ────────────────────────────────────────────
const CheckoutModal = ({ cart, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [couponData, setCouponData] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ customer_name:'', customer_email:'', customer_phone:'', delivery_address:'', notes:'' })
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const subtotal = cart.reduce((s,i)=>s+Number(i.price)*i.qty, 0)
  let discount = 0
  if (couponData) discount = couponData.discount_type==='flat' ? Number(couponData.discount_value) : subtotal*Number(couponData.discount_value)/100
  const total = subtotal - discount

  const applyCoupon = async () => {
    setCouponError('')
    try {
      const res = await axios.post(`${API_URL}/ecommerce/coupon/check/`, { code: coupon })
      setCouponData(res.data)
    } catch(err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon')
      setCouponData(null)
    }
  }

  const handleSubmit = async () => {
    if (!form.customer_name || !form.delivery_address) return alert('Name and address required!')
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/ecommerce/store/order/`, {
        ...form,
        items: cart.map(i=>({ product_id: i.id, qty: i.qty })),
        shipping_cost: 0,
        coupon_code: couponData?.code || '',
      })
      onSuccess(res.data.order_id)
    } catch { alert('Error placing order!') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn">
      <div className="bg-white w-full md:rounded-3xl md:max-w-2xl max-h-[95vh] overflow-hidden animate-slideUp md:animate-fadeUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900">Checkout</h2>
            <p className="text-xs text-gray-400">{cart.length} items · Rs. {total.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full"><MdClose size={18} className="text-gray-500"/></button>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Left — Form */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Delivery Information</h3>
              <div>
                <label className="text-xs text-gray-500 font-medium">Full Name *</label>
                <input placeholder="e.g. Ali Hassan" value={form.customer_name} onChange={e=>f('customer_name',e.target.value)}
                  className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Phone</label>
                  <input placeholder="03XX-XXXXXXX" value={form.customer_phone} onChange={e=>f('customer_phone',e.target.value)}
                    className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Email</label>
                  <input placeholder="you@email.com" type="email" value={form.customer_email} onChange={e=>f('customer_email',e.target.value)}
                    className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"/>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Delivery Address *</label>
                <textarea placeholder="House #, Street, City" value={form.delivery_address} onChange={e=>f('delivery_address',e.target.value)}
                  rows={3} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none focus:border-transparent"/>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Order Notes</label>
                <input placeholder="Special instructions..." value={form.notes} onChange={e=>f('notes',e.target.value)}
                  className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"/>
              </div>
            </div>

            {/* Right — Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Order Summary</h3>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
                {cart.map(item=>(
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">{item.name} <span className="text-gray-400">×{item.qty}</span></span>
                    <span className="font-semibold text-gray-900 flex-shrink-0">Rs. {(Number(item.price)*item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div>
                <label className="text-xs text-gray-500 font-medium">Coupon Code</label>
                <div className="flex gap-2 mt-1">
                  <input placeholder="SAVE20" value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono uppercase"/>
                  <button onClick={applyCoupon} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">Apply</button>
                </div>
                {couponData && <p className="text-green-600 text-xs mt-1 flex items-center gap-1">✅ Coupon applied! Save {couponData.discount_type==='percent'?`${couponData.discount_value}%`:`Rs. ${couponData.discount_value}`}</p>}
                {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
                {discount>0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>- Rs. {discount.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-base text-gray-900 pt-1"><span>Total</span><span>Rs. {total.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 sticky bottom-0 bg-white">
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Placing Order...</span>
            ) : (
              <><span>Place Order · Rs. {total.toLocaleString()}</span><MdArrowForward size={18}/></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Track Order Modal ─────────────────────────────────────────
const TrackOrderModal = ({ onClose }) => {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const track = async () => {
    if (!orderId) return
    setLoading(true); setError('')
    try {
      const res = await axios.get(`${API_URL}/ecommerce/store/order/${orderId}/track/`)
      setOrder(res.data)
    } catch { setError('Order not found!'); setOrder(null) } finally { setLoading(false) }
  }

  const steps = ['processing','shipped','delivered']
  const step = order ? steps.indexOf(order.delivery_status) : -1

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fadeUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900">Track Order</h2>
            <p className="text-xs text-gray-400 mt-0.5">Enter your order ID to track</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full"><MdClose size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex gap-2">
            <input placeholder="e.g. 42" value={orderId} onChange={e=>setOrderId(e.target.value)} onKeyDown={e=>e.key==='Enter'&&track()}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"/>
            <button onClick={track} disabled={loading}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition min-w-20">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block mx-auto"/> : 'Track'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl">{error}</p>}
          {order && (
            <div className="space-y-4 animate-fadeUp">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Order</p>
                    <p className="font-bold text-gray-900 text-lg">#{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="font-bold text-gray-900">Rs. {Number(order.total).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="flex justify-between relative z-10">
                  {['Processing','Shipped','Delivered'].map((s,i)=>(
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i<=step?'bg-gray-900 text-white shadow-lg':'bg-gray-200 text-gray-400'}`}>
                        {i<step ? '✓' : i===step ? <span className="w-3 h-3 bg-white rounded-full block"/> : i+1}
                      </div>
                      <span className={`text-xs font-medium text-center ${i<=step?'text-gray-900':'text-gray-400'}`}>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute top-5 left-[16.67%] right-[16.67%] h-0.5 bg-gray-200 -z-0">
                  <div className="h-full bg-gray-900 transition-all duration-500" style={{width:`${step>=1?step>=2?'100%':'50%':'0%'}`}}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Success Modal ─────────────────────────────────────────────
const SuccessModal = ({ orderId, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center p-8 animate-fadeUp">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <MdCheckCircle size={52} className="text-green-500"/>
      </div>
      <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">Order Placed!</h2>
      <p className="text-gray-400 mb-6">Your order is confirmed and being processed.</p>
      <div className="bg-gray-50 rounded-2xl py-4 px-6 mb-6 border border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
        <p className="font-display text-3xl font-bold text-gray-900">#{orderId}</p>
        <p className="text-xs text-gray-400 mt-1">Save this to track your order</p>
      </div>
      <button onClick={onClose} className="btn-primary w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-700 transition">
        Continue Shopping
      </button>
    </div>
  </div>
)

// ── Main Store ────────────────────────────────────────────────
const Store = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [flashSales, setFlashSales] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showTrack, setShowTrack] = useState(false)
  const [successOrderId, setSuccessOrderId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState(null)
  const [wishlist, setWishlist] = useState([])
  const [businessName, setBusinessName] = useState('Our Store')
  const [businessTagline, setBusinessTagline] = useState('')
  const [businessPhone, setBusinessPhone] = useState('0300-0000000')
  const [businessEmail, setBusinessEmail] = useState('info@store.com')
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(()=>{
    fetchAll()
    const handleScroll = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  },[])

  const fetchAll = async () => {
    try {
      const [p,c,f,b] = await Promise.allSettled([
        axios.get(`${API_URL}/ecommerce/store/products/`),
        axios.get(`${API_URL}/ecommerce/store/categories/`),
        axios.get(`${API_URL}/ecommerce/flash-sales/`),
        axios.get(`${API_URL}/business/public/`),
      ])
      if(p.status==='fulfilled') setProducts(p.value.data)
      if(c.status==='fulfilled') setCategories(c.value.data)
      if(f.status==='fulfilled') setFlashSales(f.value.data)
      if(b.status==='fulfilled') {
        const biz = b.value.data
        setBusinessName(biz?.name||'Our Store')
        setBusinessTagline(biz?.address||'')
        setBusinessPhone(biz?.phone||'0300-0000000')
        setBusinessEmail(biz?.email||'info@store.com')
      }
    } catch(e){console.error(e)} finally{setLoading(false)}
  }

  const addToCart = (product, qty=1) => {
    setAddedId(product.id)
    setTimeout(()=>setAddedId(null), 900)
    setCart(prev=>{
      const ex = prev.find(i=>i.id===product.id)
      if(ex) return prev.map(i=>i.id===product.id?{...i,qty:i.qty+qty}:i)
      return [...prev,{...product,qty}]
    })
  }

  const updateQty = (id,change) => setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+change)}:i).filter(i=>i.qty>0))
  const removeFromCart = (id) => setCart(prev=>prev.filter(i=>i.id!==id))
  const toggleWishlist = (id) => setWishlist(p=>p.includes(id)?p.filter(i=>i!==id):[...p,id])

  const handleSuccess = (orderId) => {
    setSuccessOrderId(orderId)
    setShowCheckout(false)
    setCart([])
  }

  const filtered = products.filter(p=>{
    const ms = p.name.toLowerCase().includes(search.toLowerCase())
    const mc = selectedCategory==='all'||p.category===selectedCategory
    return ms&&mc
  })

  const cartCount = cart.reduce((s,i)=>s+i.qty,0)

  return (
    <>
      <GlobalStyles/>
      <div className="min-h-screen bg-white">

        {/* ── Ticker / Announcement ── */}
        <div className="bg-gray-900 text-white py-2 overflow-hidden ticker-wrap">
          <div className="ticker text-xs font-medium tracking-wide">
            {[...Array(4)].map((_,i)=>(
              <span key={i} className="flex items-center gap-8 pr-8">
                <span>🚚 Free delivery on orders above Rs. 2,000</span>
                <span>·</span>
                <span>🏷️ Use code SAVE20 for 20% off</span>
                <span>·</span>
                <span>📞 Call: {businessPhone}</span>
                <span>·</span>
                <span>⭐ Quality guaranteed</span>
                <span>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Navbar ── */}
        <nav className={`sticky top-0 z-40 transition-all duration-300 ${navScrolled?'bg-white/95 backdrop-blur-md shadow-sm':'bg-white'} border-b border-gray-100`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between py-3.5 gap-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                <h1 className="font-display text-2xl font-bold text-gray-900 leading-none">{businessName}</h1>
                {businessTagline && <p className="text-gray-400 text-xs mt-0.5">{businessTagline}</p>}
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-sm hidden md:block">
                <MdSearch className="absolute left-3.5 top-2.5 text-gray-400" size={18}/>
                <input type="text" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition border border-transparent focus:border-gray-200"/>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={()=>setShowTrack(true)}
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:border-gray-900 hover:text-gray-900 transition font-medium">
                  <MdTrackChanges size={16}/> Track
                </button>
                <button onClick={()=>setShowCart(true)}
                  className="relative flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-2xl hover:bg-gray-700 transition text-sm font-semibold">
                  <MdShoppingCart size={18}/>
                  <span className="hidden md:inline">Cart</span>
                  {cartCount>0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md animate-pulse-once">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden pb-3">
              <div className="relative">
                <MdSearch className="absolute left-3.5 top-2.5 text-gray-400" size={18}/>
                <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 border border-transparent"/>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 pb-3 overflow-x-auto scrollbar-hide">
              <button onClick={()=>setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition border ${selectedCategory==='all'?'bg-gray-900 text-white border-gray-900':'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`}>
                All
              </button>
              {categories.map(cat=>(
                <button key={cat.id} onClick={()=>setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition border whitespace-nowrap ${selectedCategory===cat.id?'bg-gray-900 text-white border-gray-900':'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* ── Flash Sales Banner ── */}
        {flashSales.length>0 && (
          <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold">
                  <MdTimer size={15}/> FLASH SALE
                </div>
                <span className="text-white/80 text-sm">Ends in:</span>
                <FlashTimer endsAt={flashSales[0].ends_at}/>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {flashSales.map(sale=>(
                  <div key={sale.id} onClick={()=>{const p=products.find(x=>x.id===sale.product);if(p)setSelectedProduct({...p,flashSale:sale})}}
                    className="flex-shrink-0 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-2xl p-3 flex items-center gap-3 min-w-52 cursor-pointer transition border border-white/20">
                    {sale.product_image
                      ? <img src={sale.product_image} alt={sale.product_name} className="w-14 h-14 object-cover rounded-xl"/>
                      : <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl">📦</div>
                    }
                    <div>
                      <p className="font-semibold text-sm">{sale.product_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-sm">Rs. {Number(sale.sale_price).toLocaleString()}</span>
                        <span className="text-white/60 text-xs line-through">Rs. {Number(sale.original_price).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Hero ── */}
        {search===''&&selectedCategory==='all'&&!loading&&(
          <div className="relative bg-gray-950 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-20"
              style={{backgroundImage:'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)'}}>
            </div>
            <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
              <div className="max-w-xl" style={{animation:'fadeUp 0.8s ease forwards'}}>
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Welcome to {businessName}</p>
                <h2 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] mb-5">
                  Discover Our<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                    Premium Collection
                  </span>
                </h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">Quality products at unbeatable prices. Free delivery on orders above Rs. 2,000.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={()=>document.getElementById('products').scrollIntoView({behavior:'smooth'})}
                    className="btn-primary flex items-center gap-2 bg-white text-gray-900 px-7 py-3.5 rounded-2xl font-bold hover:bg-gray-100 transition">
                    Shop Now <MdArrowForward size={18}/>
                  </button>
                  <button onClick={()=>setShowTrack(true)}
                    className="flex items-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-2xl font-semibold hover:bg-white/10 transition text-sm">
                    <MdTrackChanges size={16}/> Track Order
                  </button>
                </div>
              </div>
              <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10rem] opacity-5 hidden lg:block">🛍️</div>
            </div>
          </div>
        )}

        {/* ── Features Strip ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-5">
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              {[
                {icon:<MdLocalShipping size={20} className="text-blue-500"/>, t:'Free Delivery', s:'Orders above Rs. 2,000'},
                {icon:<MdSecurity size={20} className="text-green-500"/>, t:'Secure Payment', s:'100% protected'},
                {icon:<MdHeadsetMic size={20} className="text-purple-500"/>, t:'24/7 Support', s:'Always here'},
              ].map((f,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">{f.icon}</div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-gray-900 text-sm">{f.t}</p>
                    <p className="text-gray-400 text-xs">{f.s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Products Grid ── */}
        <div id="products" className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900">
              {selectedCategory==='all'?'All Products':categories.find(c=>c.id===selectedCategory)?.name||'Products'}
            </h2>
            <span className="text-sm text-gray-400 font-medium">{filtered.length} products</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {[...Array(8)].map((_,i)=><SkeletonCard key={i}/>)}
            </div>
          ) : filtered.length===0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <p className="font-semibold text-gray-700 text-lg">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
              {search && <button onClick={()=>setSearch('')} className="mt-4 text-sm text-blue-600 hover:underline">Clear search</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filtered.map((product,idx)=>{
                const flashSale = flashSales.find(f=>f.product===product.id)
                const inWishlist = wishlist.includes(product.id)
                return (
                  <div key={product.id} className="product-card group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-xl transition-all duration-300"
                    style={{animationDelay:`${idx*50}ms`}}>
                    {/* Image */}
                    <div className="relative overflow-hidden bg-gray-50 cursor-pointer" onClick={()=>setSelectedProduct(product)}>
                      {product.image
                        ? <img src={product.image} alt={product.name} className="product-img w-full h-56 object-cover"/>
                        : <div className="product-img w-full h-56 flex items-center justify-center text-5xl bg-gradient-to-br from-gray-50 to-gray-100">📦</div>
                      }

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md translate-y-2 group-hover:translate-y-0 duration-300">
                          Quick View
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {flashSale && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><MdTimer size={10}/>SALE</span>}
                        {!flashSale && product.discount>0 && <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{product.discount}%</span>}
                        {product.stock_qty<=0 && <span className="bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">Sold Out</span>}
                        {product.is_featured && <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Featured</span>}
                      </div>

                      {/* Wishlist */}
                      <button onClick={e=>{e.stopPropagation();toggleWishlist(product.id)}}
                        className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition hover:scale-110">
                        {inWishlist ? <MdFavorite className="text-red-500" size={16}/> : <MdFavoriteBorder className="text-gray-500" size={16}/>}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-3.5">
                      <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{product.name}</p>
                      {product.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 leading-relaxed">{product.description}</p>}

                      <div className="flex items-center justify-between mt-3 gap-2">
                        <div className="min-w-0">
                          {flashSale ? (
                            <div>
                              <p className="text-red-500 font-bold text-sm leading-none">Rs. {Number(flashSale.sale_price).toLocaleString()}</p>
                              <p className="text-gray-400 text-xs line-through mt-0.5">Rs. {Number(product.price).toLocaleString()}</p>
                            </div>
                          ) : (
                            <p className="text-gray-900 font-bold text-sm">Rs. {Number(product.price).toLocaleString()}</p>
                          )}
                          {product.stock_qty>0&&product.stock_qty<=5&&<p className="text-orange-500 text-xs mt-0.5">Only {product.stock_qty} left</p>}
                        </div>
                        <button onClick={()=>addToCart(product)} disabled={product.stock_qty<=0}
                          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${addedId===product.id?'bg-green-500 text-white scale-95':'bg-gray-900 text-white hover:bg-gray-700 active:scale-95'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                          {addedId===product.id ? '✓' : <MdAdd size={18}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="bg-gray-950 text-white mt-16">
          <div className="max-w-6xl mx-auto px-4 pt-12 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              <div className="md:col-span-2">
                <h3 className="font-display text-2xl font-bold mb-3">{businessName}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">Quality products delivered to your doorstep. We're committed to providing the best shopping experience.</p>
                <div className="flex gap-3">
                  {['📘','📸','🐦'].map((icon,i)=>(
                    <div key={i} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center cursor-pointer transition text-sm">{icon}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Quick Links</h4>
                <div className="space-y-2.5 text-gray-400 text-sm">
                  <p className="hover:text-white cursor-pointer transition" onClick={()=>document.getElementById('products').scrollIntoView({behavior:'smooth'})}>All Products</p>
                  <p className="hover:text-white cursor-pointer transition" onClick={()=>setShowTrack(true)}>Track Order</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Contact</h4>
                <div className="space-y-2.5 text-gray-400 text-sm">
                  <p>📞 {businessPhone}</p>
                  <p>📧 {businessEmail}</p>
                  {businessTagline && <p>📍 {businessTagline}</p>}
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-5 flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-gray-500 text-xs">© 2026 {businessName}. All rights reserved.</p>
              <p className="text-gray-600 text-xs">Powered by POS System</p>
            </div>
          </div>
        </footer>

        {/* ── Modals ── */}
        {selectedProduct && <ProductModal product={selectedProduct} flashSale={flashSales.find(f=>f.product===selectedProduct.id)} onClose={()=>setSelectedProduct(null)} onAddToCart={addToCart}/>}
        {showCart && <CartDrawer cart={cart} onClose={()=>setShowCart(false)} onUpdateQty={updateQty} onRemove={removeFromCart} onCheckout={()=>{setShowCart(false);setShowCheckout(true)}}/>}
        {showCheckout && <CheckoutModal cart={cart} onClose={()=>setShowCheckout(false)} onSuccess={handleSuccess}/>}
        {showTrack && <TrackOrderModal onClose={()=>setShowTrack(false)}/>}
        {successOrderId && <SuccessModal orderId={successOrderId} onClose={()=>setSuccessOrderId(null)}/>}
      </div>
    </>
  )
}

export default Store