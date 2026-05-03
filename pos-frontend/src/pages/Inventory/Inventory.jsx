import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdAdd, MdEdit, MdDelete, MdSearch,
  MdWarning, MdInventory, MdPeople, MdLocalShipping,
  MdHistory, MdClose, MdRefresh, MdTrendingUp,
  MdCheckCircle, MdBlock, MdStore, MdArrowUpward,
  MdArrowDownward, MdBuild
} from 'react-icons/md'

// ─── Constants ────────────────────────────────────────────────────
const TABS = [
  { key: 'products',   label: 'Products',   icon: MdInventory },
  { key: 'suppliers',  label: 'Suppliers',  icon: MdPeople },
  { key: 'purchase',   label: 'Purchase Orders', icon: MdLocalShipping },
  { key: 'movements',  label: 'Stock Movements', icon: MdHistory },
]

const CATEGORY_CHOICES = [
  { value: 'book',       label: 'Book' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'other',      label: 'Other' },
]

const PO_STATUS_COLORS = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-100 text-blue-700',
  partial:   'bg-yellow-100 text-yellow-700',
  received:  'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

const MOVEMENT_TYPE_COLORS = {
  purchase:   'text-green-600',
  sale:       'text-red-600',
  return_in:  'text-blue-600',
  return_out: 'text-orange-600',
  damage:     'text-red-800',
  adjustment: 'text-purple-600',
  transfer:   'text-gray-600',
}

// ─── Toast ────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-slide-up
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <MdCheckCircle size={18} /> : <MdBlock size={18} />}
      {msg}
    </div>
  )
}

// ─── Modal Shell ──────────────────────────────────────────────────
const Modal = ({ title, onClose, children, footer, wide = false }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className={`bg-white rounded-3xl shadow-2xl flex flex-col w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[92vh]`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-bold text-gray-900 text-base tracking-tight">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition rounded-xl p-1 hover:bg-gray-100">
          <MdClose size={20} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      {footer && <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">{footer}</div>}
    </div>
  </div>
)

const Btn = ({ children, onClick, variant = 'primary', disabled, className = '', type = 'button' }) => {
  const base = 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700',
    ghost:   'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger:  'bg-red-500 text-white hover:bg-red-600',
    outline: 'border-2 border-slate-900 text-slate-900 hover:bg-slate-50',
  }
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>{children}</button>
}

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
)

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-gray-50 focus:bg-white transition'

// ─── Stock Adjustment Modal ────────────────────────────────────────
const StockAdjustModal = ({ product, warehouses, onClose, onSuccess }) => {
  const [qty, setQty]       = useState('')
  const [wh, setWh]         = useState(warehouses[0]?.id || '')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!qty || qty === '0') return
    setLoading(true)
    try {
      await API.post('/inventory/stock-movements/adjust/', {
        product_id:   product.id,
        warehouse_id: wh,
        quantity:     Number(qty),
        reason,
      })
      onSuccess('Stock adjusted successfully!')
      onClose()
    } catch (err) {
      onSuccess(err.response?.data?.error || 'Error adjusting stock!', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Manual Stock Adjustment" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose} className="flex-1">Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={loading || !qty} className="flex-1">
          {loading ? 'Saving…' : 'Confirm Adjustment'}
        </Btn>
      </>}
    >
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="font-bold text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            SKU: <span className="font-mono text-slate-700">{product.sku}</span> &nbsp;·&nbsp;
            Stock: <span className="font-bold text-slate-800">{product.stock_quantity}</span>
          </p>
        </div>

        <Field label="Warehouse">
          <select value={wh} onChange={e => setWh(e.target.value)} className={inputCls}>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>

        <Field label="Quantity (+ to add, − to deduct)">
          <input type="number" value={qty} onChange={e => setQty(e.target.value)}
            placeholder="e.g. 10 or -5" className={inputCls} />
        </Field>

        <Field label="Reason">
          <input type="text" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Damage, count correction, etc." className={inputCls} />
        </Field>
      </div>
    </Modal>
  )
}

// ─── Product Modal ─────────────────────────────────────────────────
const ProductModal = ({ editProduct, suppliers, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:                editProduct?.name || '',
    category:            editProduct?.category || 'book',
    supplier:            editProduct?.supplier || '',
    description:         editProduct?.description || '',
    cost_price:          editProduct?.cost_price || '',
    retail_price:        editProduct?.retail_price || '',
    wholesale_price:     editProduct?.wholesale_price || '',
    stock_quantity:      editProduct?.stock_quantity || 0,
    low_stock_threshold: editProduct?.low_stock_threshold || 10,
    reorder_quantity:    editProduct?.reorder_quantity || 50,
    barcode:             editProduct?.barcode || '',
    is_active:           editProduct?.is_active ?? true,
  })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.retail_price) return
    setLoading(true)
    try {
      const payload = { ...form, supplier: form.supplier || null }
      if (editProduct) {
        await API.put(`/inventory/products/${editProduct.id}/`, payload)
      } else {
        await API.post('/inventory/products/', payload)
      }
      onSuccess(editProduct ? 'Product updated!' : 'Product added!')
      onClose()
    } catch (err) {
      onSuccess('Error saving product!', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={editProduct ? 'Edit Product' : 'Add Product'} onClose={onClose} wide
      footer={<>
        <Btn variant="ghost" onClick={onClose} className="flex-1">Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={loading || !form.name || !form.retail_price} className="flex-1">
          {loading ? 'Saving…' : editProduct ? 'Update Product' : 'Add Product'}
        </Btn>
      </>}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Product Name *">
            <input value={form.name} onChange={e => f('name', e.target.value)}
              placeholder="e.g. Oxford English Dictionary" className={inputCls} />
          </Field>
        </div>

        <Field label="Category">
          <select value={form.category} onChange={e => f('category', e.target.value)} className={inputCls}>
            {CATEGORY_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>

        <Field label="Supplier">
          <select value={form.supplier} onChange={e => f('supplier', e.target.value)} className={inputCls}>
            <option value="">— No Supplier —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="Retail Price *">
          <input type="number" value={form.retail_price} onChange={e => f('retail_price', e.target.value)}
            placeholder="0.00" className={inputCls} />
        </Field>

        <Field label="Cost Price">
          <input type="number" value={form.cost_price} onChange={e => f('cost_price', e.target.value)}
            placeholder="0.00" className={inputCls} />
        </Field>

        <Field label="Wholesale Price">
          <input type="number" value={form.wholesale_price} onChange={e => f('wholesale_price', e.target.value)}
            placeholder="0.00" className={inputCls} />
        </Field>

        <Field label="Barcode">
          <input value={form.barcode} onChange={e => f('barcode', e.target.value)}
            placeholder="Scan or enter manually" className={inputCls} />
        </Field>

        <Field label="Low Stock Threshold">
          <input type="number" value={form.low_stock_threshold} onChange={e => f('low_stock_threshold', e.target.value)}
            className={inputCls} />
        </Field>

        <Field label="Reorder Quantity">
          <input type="number" value={form.reorder_quantity} onChange={e => f('reorder_quantity', e.target.value)}
            className={inputCls} />
        </Field>

        <div className="col-span-2">
          <Field label="Description">
            <textarea value={form.description} onChange={e => f('description', e.target.value)}
              rows={2} placeholder="Optional product description" className={inputCls} />
          </Field>
        </div>

        <div className="col-span-2 flex items-center gap-3 pt-1">
          <button type="button" onClick={() => f('is_active', !form.is_active)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">Active Product</span>
        </div>
      </div>
    </Modal>
  )
}

// ─── Supplier Modal ────────────────────────────────────────────────
const SupplierModal = ({ editSupplier, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:           editSupplier?.name || '',
    contact_person: editSupplier?.contact_person || '',
    phone:          editSupplier?.phone || '',
    email:          editSupplier?.email || '',
    address:        editSupplier?.address || '',
  })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name) return
    setLoading(true)
    try {
      if (editSupplier) {
        await API.put(`/inventory/suppliers/${editSupplier.id}/`, form)
      } else {
        await API.post('/inventory/suppliers/', form)
      }
      onSuccess(editSupplier ? 'Supplier updated!' : 'Supplier added!')
      onClose()
    } catch {
      onSuccess('Error saving supplier!', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={editSupplier ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose} className="flex-1">Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={loading || !form.name} className="flex-1">
          {loading ? 'Saving…' : editSupplier ? 'Update' : 'Add Supplier'}
        </Btn>
      </>}
    >
      <div className="space-y-4">
        <Field label="Supplier Name *">
          <input value={form.name} onChange={e => f('name', e.target.value)}
            placeholder="e.g. Al-Faisal Publishers" className={inputCls} />
        </Field>
        <Field label="Contact Person">
          <input value={form.contact_person} onChange={e => f('contact_person', e.target.value)}
            placeholder="Name of the rep" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input value={form.phone} onChange={e => f('phone', e.target.value)}
              placeholder="03xx-xxxxxxx" className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
              placeholder="supplier@email.com" className={inputCls} />
          </Field>
        </div>
        <Field label="Address">
          <textarea value={form.address} onChange={e => f('address', e.target.value)}
            rows={2} placeholder="Full address" className={inputCls} />
        </Field>
      </div>
    </Modal>
  )
}

// ─── Purchase Order Modal ──────────────────────────────────────────
const POModal = ({ editPO, suppliers, warehouses, products, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    supplier:      editPO?.supplier || '',
    warehouse:     editPO?.warehouse || warehouses[0]?.id || '',
    expected_date: editPO?.expected_date || '',
    notes:         editPO?.notes || '',
    items:         editPO?.items?.map(i => ({
      id: i.id, product: i.product, quantity_ordered: i.quantity_ordered, unit_cost: i.unit_cost
    })) || [{ product: '', quantity_ordered: 1, unit_cost: '' }],
  })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const setItem = (idx, k, v) => {
    const items = [...form.items]
    items[idx] = { ...items[idx], [k]: v }
    if (k === 'product' && v) {
      const prod = products.find(p => String(p.id) === String(v))
      if (prod) items[idx].unit_cost = prod.cost_price
    }
    f('items', items)
  }
  const addItem    = () => f('items', [...form.items, { product: '', quantity_ordered: 1, unit_cost: '' }])
  const removeItem = i  => f('items', form.items.filter((_, idx) => idx !== i))

  const total = form.items.reduce((s, i) => s + (Number(i.quantity_ordered) * Number(i.unit_cost) || 0), 0)

  const handleSubmit = async () => {
    if (!form.supplier || !form.warehouse) return
    const validItems = form.items.filter(i => i.product && i.quantity_ordered > 0 && i.unit_cost > 0)
    if (!validItems.length) return
    setLoading(true)
    try {
      const payload = { ...form, items: validItems }
      if (editPO) {
        await API.put(`/inventory/purchase-orders/${editPO.id}/`, payload)
      } else {
        await API.post('/inventory/purchase-orders/', payload)
      }
      onSuccess(editPO ? 'Purchase Order updated!' : 'Purchase Order created!')
      onClose()
    } catch (err) {
      onSuccess(err.response?.data?.error || 'Error saving PO!', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={editPO ? 'Edit Purchase Order' : 'New Purchase Order'} onClose={onClose} wide
      footer={<>
        <Btn variant="ghost" onClick={onClose} className="flex-1">Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading ? 'Saving…' : editPO ? 'Update PO' : 'Create PO'}
        </Btn>
      </>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Supplier *">
            <select value={form.supplier} onChange={e => f('supplier', e.target.value)} className={inputCls}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Warehouse *">
            <select value={form.warehouse} onChange={e => f('warehouse', e.target.value)} className={inputCls}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expected Date">
            <input type="date" value={form.expected_date} onChange={e => f('expected_date', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Notes">
            <input value={form.notes} onChange={e => f('notes', e.target.value)}
              placeholder="Optional notes" className={inputCls} />
          </Field>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Items</span>
            <Btn variant="outline" onClick={addItem} className="!py-1 !px-3 !text-xs">
              <MdAdd size={14} /> Add Item
            </Btn>
          </div>
          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-center bg-gray-50 rounded-xl p-2">
                <select value={item.product} onChange={e => setItem(idx, 'product', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400">
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" value={item.quantity_ordered}
                  onChange={e => setItem(idx, 'quantity_ordered', e.target.value)}
                  placeholder="Qty" className="px-2 py-2 border border-gray-200 rounded-lg text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-slate-400" />
                <input type="number" value={item.unit_cost}
                  onChange={e => setItem(idx, 'unit_cost', e.target.value)}
                  placeholder="Cost" className="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400" />
                <button onClick={() => removeItem(idx)} disabled={form.items.length === 1}
                  className="text-red-400 hover:text-red-600 disabled:opacity-30 transition">
                  <MdClose size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-sm font-bold text-gray-800">
            Total: <span className="text-slate-900 text-base">Rs. {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Receive PO Modal ──────────────────────────────────────────────
const ReceivePOModal = ({ po, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [qtys, setQtys] = useState(() =>
    Object.fromEntries(po.items.filter(i => !i.is_fully_received).map(i => [i.id, i.pending_qty]))
  )

  const handleReceive = async () => {
    const items = Object.entries(qtys)
      .filter(([, q]) => Number(q) > 0)
      .map(([item_id, quantity_received]) => ({ item_id: Number(item_id), quantity_received: Number(quantity_received) }))
    if (!items.length) return
    setLoading(true)
    try {
      await API.post(`/inventory/purchase-orders/${po.id}/receive/`, { items })
      onSuccess('Stock received successfully!')
      onClose()
    } catch (err) {
      onSuccess(err.response?.data?.error || 'Error receiving stock!', 'error')
    } finally {
      setLoading(false)
    }
  }

  const pendingItems = po.items.filter(i => !i.is_fully_received)

  return (
    <Modal title={`Receive Stock — PO-${String(po.id).padStart(4, '0')}`} onClose={onClose} wide
      footer={<>
        <Btn variant="ghost" onClick={onClose} className="flex-1">Cancel</Btn>
        <Btn onClick={handleReceive} disabled={loading} className="flex-1">
          {loading ? 'Processing…' : 'Confirm Receipt'}
        </Btn>
      </>}
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-500">Supplier: <strong className="text-gray-800">{po.supplier_detail?.name}</strong></div>
        {pendingItems.length === 0 ? (
          <p className="text-center py-6 text-gray-400">All items already received.</p>
        ) : pendingItems.map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{item.product_detail?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Ordered: {item.quantity_ordered} · Received: {item.quantity_received} · Pending: <strong className="text-slate-700">{item.pending_qty}</strong>
              </p>
            </div>
            <input type="number" min="0" max={item.pending_qty}
              value={qtys[item.id] ?? 0}
              onChange={e => setQtys(p => ({ ...p, [item.id]: e.target.value }))}
              className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent, onClick, icon: Icon }) => (
  <div onClick={onClick}
    className={`bg-white rounded-2xl shadow-sm border p-5 flex items-center gap-4 transition
      ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
      ${accent === 'red' ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
    <div className={`rounded-2xl p-3 ${accent === 'red' ? 'bg-red-100' : 'bg-slate-100'}`}>
      <Icon size={22} className={accent === 'red' ? 'text-red-600' : 'text-slate-700'} />
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-0.5 ${accent === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

// ─── Main Component ────────────────────────────────────────────────
const Inventory = () => {
  const [activeTab, setActiveTab]     = useState('products')
  const [products, setProducts]       = useState([])
  const [suppliers, setSuppliers]     = useState([])
  const [warehouses, setWarehouses]   = useState([])
  const [purchaseOrders, setPOs]      = useState([])
  const [movements, setMovements]     = useState([])
  const [search, setSearch]           = useState('')
  const [lowOnly, setLowOnly]         = useState(false)
  const [catFilter, setCatFilter]     = useState('')
  const [toast, setToast]             = useState(null)

  // Modals
  const [productModal, setProductModal]     = useState(false)
  const [editProduct, setEditProduct]       = useState(null)
  const [adjustModal, setAdjustModal]       = useState(null)
  const [supplierModal, setSupplierModal]   = useState(false)
  const [editSupplier, setEditSupplier]     = useState(null)
  const [poModal, setPOModal]               = useState(false)
  const [editPO, setEditPO]                 = useState(null)
  const [receivePO, setReceivePO]           = useState(null)

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), [])

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (activeTab === 'movements') fetchMovements() }, [activeTab])

  const fetchAll = () => {
    fetchProducts(); fetchSuppliers(); fetchWarehouses(); fetchPOs()
  }

  const fetchProducts  = async () => { try { const r = await API.get('/products/products/');      setProducts(r.data.results ?? r.data) } catch {} }
  const fetchSuppliers = async () => { try { const r = await API.get('/inventory/suppliers/');       setSuppliers(r.data.results ?? r.data) } catch {} }
  const fetchWarehouses= async () => { try { const r = await API.get('/inventory/warehouses/');      setWarehouses(r.data.results ?? r.data) } catch {} }
  const fetchPOs       = async () => { try { const r = await API.get('/inventory/purchase-orders/'); setPOs(r.data.results ?? r.data) } catch {} }
  const fetchMovements = async () => { try { const r = await API.get('/inventory/stock-movements/'); setMovements(r.data.results ?? r.data) } catch {} }

  const deleteProduct = async id => {
    if (!window.confirm('Delete this product?')) return
    try { await API.delete(`/inventory/products/${id}/`); fetchProducts(); notify('Product deleted!') }
    catch { notify('Error deleting product!', 'error') }
  }
  const deleteSupplier = async id => {
    if (!window.confirm('Delete this supplier?')) return
    try { await API.delete(`/inventory/suppliers/${id}/`); fetchSuppliers(); notify('Supplier deleted!') }
    catch { notify('Error deleting supplier!', 'error') }
  }
  const cancelPO = async id => {
    if (!window.confirm('Cancel this purchase order?')) return
    try { await API.post(`/inventory/purchase-orders/${id}/cancel/`); fetchPOs(); notify('PO cancelled') }
    catch (err) { notify(err.response?.data?.error || 'Cannot cancel!', 'error') }
  }

  const filteredProducts = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) ||
               (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const ml = lowOnly ? p.is_low_stock : true
    const mc = catFilter ? p.category === catFilter : true
    return ms && ml && mc
  })

  const lowStockCount  = products.filter(p => p.is_low_stock).length
  const outOfStockCount= products.filter(p => p.is_out_of_stock).length

  return (
    <Layout>
      <style>{`
        @keyframes slide-up { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .animate-slide-up { animation: slide-up .25s ease-out }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="space-y-5 pb-10">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Inventory</h1>
            <p className="text-sm text-gray-400 mt-0.5">Products · Suppliers · Purchase Orders · Stock Movements</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={fetchAll}><MdRefresh size={18} /></Btn>
            <Btn onClick={() => {
              if (activeTab === 'products')  { setEditProduct(null);  setProductModal(true) }
              if (activeTab === 'suppliers') { setEditSupplier(null); setSupplierModal(true) }
              if (activeTab === 'purchase')  { setEditPO(null);       setPOModal(true) }
            }}>
              <MdAdd size={18} />
              Add {activeTab === 'products' ? 'Product' : activeTab === 'suppliers' ? 'Supplier' : activeTab === 'purchase' ? 'Purchase Order' : ''}
            </Btn>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Products"  value={products.length}   icon={MdInventory}  />
          <StatCard label="Low Stock"       value={lowStockCount}     icon={MdWarning}    accent={lowStockCount > 0 ? 'red' : ''} onClick={() => { setActiveTab('products'); setLowOnly(true) }} />
          <StatCard label="Out of Stock"    value={outOfStockCount}   icon={MdBlock}      accent={outOfStockCount > 0 ? 'red' : ''} />
          <StatCard label="Suppliers"       value={suppliers.length}  icon={MdPeople}     />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setActiveTab(key); setSearch('') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap
                ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── Products Tab ── */}
        {activeTab === 'products' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <MdSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                <input placeholder="Search by name or SKU…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="">All Categories</option>
                {CATEGORY_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button onClick={() => setLowOnly(!lowOnly)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition
                  ${lowOnly ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                <MdWarning size={16} /> Low Stock {lowOnly && `(${lowStockCount})`}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-right">Retail</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Margin</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-gray-300 text-base">No products found</td></tr>
                  ) : filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium capitalize">{p.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.supplier_detail?.name || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">Rs. {Number(p.retail_price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">Rs. {Number(p.cost_price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-semibold">
                          <MdTrendingUp size={13} />{p.profit_margin}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`font-bold text-base ${p.is_out_of_stock ? 'text-red-600' : p.is_low_stock ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {p.stock_quantity}
                          </span>
                          {p.is_low_stock && !p.is_out_of_stock && <MdWarning size={13} className="text-amber-500" />}
                          {p.is_out_of_stock && <MdBlock size={13} className="text-red-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setAdjustModal(p)} title="Adjust Stock"
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition">
                            <MdBuild size={16} />
                          </button>
                          <button onClick={() => { setEditProduct(p); setProductModal(true) }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition">
                            <MdEdit size={16} />
                          </button>
                          <button onClick={() => deleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition">
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Suppliers Tab ── */}
        {activeTab === 'suppliers' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Contact Person</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {suppliers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-300">No suppliers added yet</td></tr>
                ) : suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.contact_person || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[180px] truncate">{s.address || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditSupplier(s); setSupplierModal(true) }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition">
                          <MdEdit size={16} />
                        </button>
                        <button onClick={() => deleteSupplier(s.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition">
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Purchase Orders Tab ── */}
        {activeTab === 'purchase' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">PO #</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Warehouse</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {purchaseOrders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-300">No purchase orders yet</td></tr>
                ) : purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                      PO-{String(po.id).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{po.supplier_detail?.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{po.warehouse_detail?.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(po.order_date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      Rs. {Number(po.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PO_STATUS_COLORS[po.status]}`}>
                        {po.status_display}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {!['received', 'cancelled'].includes(po.status) && (
                          <>
                            <button onClick={() => setReceivePO(po)} title="Receive Stock"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition">
                              <MdArrowDownward size={16} />
                            </button>
                            <button onClick={() => { setEditPO(po); setPOModal(true) }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition">
                              <MdEdit size={16} />
                            </button>
                            <button onClick={() => cancelPO(po.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition">
                              <MdBlock size={16} />
                            </button>
                          </>
                        )}
                        {po.status === 'received' && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <MdCheckCircle size={14} /> Done
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Stock Movements Tab ── */}
        {activeTab === 'movements' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">Before</th>
                  <th className="px-4 py-3 text-center">After</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">By</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-300">No movements recorded</td></tr>
                ) : movements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{m.product_detail?.name}</p>
                      <p className="text-xs font-mono text-gray-400">{m.product_detail?.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${MOVEMENT_TYPE_COLORS[m.movement_type] || 'text-gray-600'}`}>
                        {m.movement_type_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">{m.stock_before}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{m.stock_after}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{m.reference || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{m.created_by_detail?.username || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(m.created_at).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {productModal && (
        <ProductModal
          editProduct={editProduct}
          suppliers={suppliers}
          onClose={() => { setProductModal(false); setEditProduct(null) }}
          onSuccess={(msg, t) => { notify(msg, t); fetchProducts() }}
        />
      )}
      {adjustModal && warehouses.length > 0 && (
        <StockAdjustModal
          product={adjustModal}
          warehouses={warehouses}
          onClose={() => setAdjustModal(null)}
          onSuccess={(msg, t) => { notify(msg, t); fetchProducts(); fetchMovements() }}
        />
      )}
      {supplierModal && (
        <SupplierModal
          editSupplier={editSupplier}
          onClose={() => { setSupplierModal(false); setEditSupplier(null) }}
          onSuccess={(msg, t) => { notify(msg, t); fetchSuppliers() }}
        />
      )}
      {poModal && (
        <POModal
          editPO={editPO}
          suppliers={suppliers}
          warehouses={warehouses}
          products={products}
          onClose={() => { setPOModal(false); setEditPO(null) }}
          onSuccess={(msg, t) => { notify(msg, t); fetchPOs() }}
        />
      )}
      {receivePO && (
        <ReceivePOModal
          po={receivePO}
          onClose={() => setReceivePO(null)}
          onSuccess={(msg, t) => { notify(msg, t); fetchPOs(); fetchProducts(); fetchMovements() }}
        />
      )}
    </Layout>
  )
}

export default Inventory