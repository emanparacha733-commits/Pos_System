import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdAdd, MdEdit, MdDelete, MdSearch,
  MdWarning, MdInventory, MdPeople, MdLocalShipping,
  MdHistory, MdClose, MdRefresh, MdTrendingUp,
  MdCheckCircle, MdBlock, MdArrowDownward, MdBuild,
} from 'react-icons/md'

// ─── Constants ───────────────────────────────────────────────────
const TABS = [
  { key: 'products',  label: 'Products',       icon: MdInventory },
  { key: 'suppliers', label: 'Suppliers',       icon: MdPeople },
  { key: 'purchase',  label: 'Purchase Orders', icon: MdLocalShipping },
  { key: 'movements', label: 'Stock Movements', icon: MdHistory },
]

const CATEGORY_CHOICES = [
  { value: 'book',       label: 'Book' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'other',      label: 'Other' },
]

const PO_STATUS_COLORS = {
  draft:     'bg-gray-100 text-gray-500',
  sent:      'bg-blue-100 text-blue-700',
  partial:   'bg-yellow-100 text-yellow-700',
  received:  'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

const MOVEMENT_COLORS = {
  purchase:   'text-emerald-600 bg-emerald-50',
  sale:       'text-red-500 bg-red-50',
  return_in:  'text-blue-600 bg-blue-50',
  return_out: 'text-orange-500 bg-orange-50',
  damage:     'text-red-800 bg-red-100',
  adjustment: 'text-purple-600 bg-purple-50',
  transfer:   'text-gray-600 bg-gray-100',
}

// ─── Design tokens matching POS blue theme ────────────────────────
const BLUE = '#1a56db'

// ─── Toast ───────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 20px', borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      fontSize: 13, fontWeight: 600,
      background: type === 'success' ? '#059669' : '#dc2626',
      color: '#fff',
    }}>
      {type === 'success' ? <MdCheckCircle size={18} /> : <MdBlock size={18} />}
      {msg}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, footer, wide = false }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: wide ? 640 : 440, maxHeight: '92vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <h2 style={{ fontWeight: 700, color: '#111827', fontSize: 15, margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, borderRadius: 8, display: 'flex' }}>
          <MdClose size={20} />
        </button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>{children}</div>
      {footer && <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>{footer}</div>}
    </div>
  </div>
)

// ─── Btn ──────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = 'primary', disabled, style = {} }) => {
  const base = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', opacity: disabled ? 0.5 : 1, transition: 'all .15s' }
  const variants = {
    primary: { background: BLUE, color: '#fff' },
    ghost:   { background: '#f3f4f6', color: '#374151' },
    outline: { background: '#fff', color: BLUE, border: `2px solid ${BLUE}` },
    danger:  { background: '#dc2626', color: '#fff' },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>
}

// ─── Field ────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
)

const iCls = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, outline: 'none', background: '#f9fafb', boxSizing: 'border-box', fontFamily: 'inherit' }

// ─── Stat Card ───────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, accent, onClick }) => (
  <div onClick={onClick} style={{
    background: accent === 'red' ? '#fff1f2' : '#fff',
    border: `1px solid ${accent === 'red' ? '#fecdd3' : '#e5e7eb'}`,
    borderRadius: 12, padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 14,
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  }}>
    <div style={{ background: accent === 'red' ? '#fee2e2' : '#dbeafe', borderRadius: 10, padding: 10, display: 'flex' }}>
      <Icon size={22} style={{ color: accent === 'red' ? '#dc2626' : BLUE }} />
    </div>
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: accent === 'red' ? '#dc2626' : '#111827', margin: '2px 0 0' }}>{value}</p>
    </div>
  </div>
)

// ─── Stock Adjust Modal ───────────────────────────────────────────
const StockAdjustModal = ({ product, warehouses, onClose, onSuccess }) => {
  const [qty, setQty]         = useState('')
  const [wh, setWh]           = useState(warehouses[0]?.id || '')
  const [reason, setReason]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!qty || qty === '0') return
    setLoading(true)
    try {
      await API.post('/inventory/stock-movements/adjust/', {
        product_id: product.id, warehouse_id: wh, quantity: Number(qty), reason,
      })
      onSuccess('Stock adjusted!'); onClose()
    } catch (err) {
      onSuccess(err.response?.data?.error || 'Error!', 'error')
    } finally { setLoading(false) }
  }

  return (
    <Modal title="Stock Adjustment" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={loading || !qty} style={{ flex: 1 }}>{loading ? 'Saving…' : 'Confirm'}</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#eff6ff', borderRadius: 10, padding: 14, border: '1px solid #bfdbfe' }}>
          <p style={{ fontWeight: 700, color: '#111827', margin: 0 }}>{product.name}</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            SKU: <span style={{ fontFamily: 'monospace', color: BLUE }}>{product.sku}</span> &nbsp;·&nbsp;
            Stock: <span style={{ fontWeight: 700, color: BLUE }}>{product.stock_quantity}</span>
          </p>
        </div>
        <Field label="Warehouse">
          <select value={wh} onChange={e => setWh(e.target.value)} style={iCls}>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </Field>
        <Field label="Quantity (+ add, − deduct)">
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 10 or -5" style={iCls} />
        </Field>
        <Field label="Reason">
          <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Damage, count correction…" style={iCls} />
        </Field>
      </div>
    </Modal>
  )
}

// ─── Product Modal ────────────────────────────────────────────────
const ProductModal = ({ editProduct, suppliers, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: editProduct?.name || '', category: editProduct?.category || 'book',
    supplier: editProduct?.supplier || '', description: editProduct?.description || '',
    cost_price: editProduct?.cost_price || '', retail_price: editProduct?.retail_price || '',
    wholesale_price: editProduct?.wholesale_price || '', stock_quantity: editProduct?.stock_quantity || 0,
    low_stock_threshold: editProduct?.low_stock_threshold || 10, reorder_quantity: editProduct?.reorder_quantity || 50,
    barcode: editProduct?.barcode || '', is_active: editProduct?.is_active ?? true,
  })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.retail_price) return
    setLoading(true)
    try {
      const payload = { ...form, supplier: form.supplier || null }
      if (editProduct) { await API.put(`/inventory/products/${editProduct.id}/`, payload) }
      else { await API.post('/inventory/products/', payload) }
      onSuccess(editProduct ? 'Product updated!' : 'Product added!'); onClose()
    } catch (err) {
      onSuccess(err.response?.data ? JSON.stringify(err.response.data) : 'Error!', 'error')
    } finally { setLoading(false) }
  }

  return (
    <Modal title={editProduct ? 'Edit Product' : 'Add Product'} onClose={onClose} wide
      footer={<>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={loading || !form.name || !form.retail_price} style={{ flex: 1 }}>
          {loading ? 'Saving…' : editProduct ? 'Update' : 'Add Product'}
        </Btn>
      </>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Product Name *">
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Oxford English Dictionary" style={iCls} />
          </Field>
        </div>
        <Field label="Category">
          <select value={form.category} onChange={e => f('category', e.target.value)} style={iCls}>
            {CATEGORY_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Supplier">
          <select value={form.supplier} onChange={e => f('supplier', e.target.value)} style={iCls}>
            <option value="">— No Supplier —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Retail Price *">
          <input type="number" value={form.retail_price} onChange={e => f('retail_price', e.target.value)} placeholder="0.00" style={iCls} />
        </Field>
        <Field label="Cost Price">
          <input type="number" value={form.cost_price} onChange={e => f('cost_price', e.target.value)} placeholder="0.00" style={iCls} />
        </Field>
        <Field label="Wholesale Price">
          <input type="number" value={form.wholesale_price} onChange={e => f('wholesale_price', e.target.value)} placeholder="0.00" style={iCls} />
        </Field>
        <Field label="Barcode">
          <input value={form.barcode} onChange={e => f('barcode', e.target.value)} placeholder="Scan or enter" style={iCls} />
        </Field>
        <Field label="Low Stock Threshold">
          <input type="number" value={form.low_stock_threshold} onChange={e => f('low_stock_threshold', e.target.value)} style={iCls} />
        </Field>
        <Field label="Reorder Quantity">
          <input type="number" value={form.reorder_quantity} onChange={e => f('reorder_quantity', e.target.value)} style={iCls} />
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Description">
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} placeholder="Optional…" style={{ ...iCls, resize: 'vertical' }} />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={() => f('is_active', !form.is_active)}
            style={{ position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.is_active ? BLUE : '#d1d5db', transition: 'background .2s' }}>
            <span style={{ position: 'absolute', top: 2, left: form.is_active ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Active Product</span>
        </div>
      </div>
    </Modal>
  )
}

// ─── Supplier Modal ───────────────────────────────────────────────
const SupplierModal = ({ editSupplier, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: editSupplier?.name || '', contact_person: editSupplier?.contact_person || '',
    phone: editSupplier?.phone || '', email: editSupplier?.email || '', address: editSupplier?.address || '',
  })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name) return
    setLoading(true)
    try {
      if (editSupplier) { await API.put(`/inventory/suppliers/${editSupplier.id}/`, form) }
      else { await API.post('/inventory/suppliers/', form) }
      onSuccess(editSupplier ? 'Supplier updated!' : 'Supplier added!'); onClose()
    } catch { onSuccess('Error!', 'error') }
    finally { setLoading(false) }
  }

  return (
    <Modal title={editSupplier ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={loading || !form.name} style={{ flex: 1 }}>
          {loading ? 'Saving…' : editSupplier ? 'Update' : 'Add Supplier'}
        </Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Supplier Name *">
          <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Al-Faisal Publishers" style={iCls} />
        </Field>
        <Field label="Contact Person">
          <input value={form.contact_person} onChange={e => f('contact_person', e.target.value)} placeholder="Rep name" style={iCls} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Phone">
            <input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="03xx-xxxxxxx" style={iCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="email@example.com" style={iCls} />
          </Field>
        </div>
        <Field label="Address">
          <textarea value={form.address} onChange={e => f('address', e.target.value)} rows={2} placeholder="Full address" style={{ ...iCls, resize: 'vertical' }} />
        </Field>
      </div>
    </Modal>
  )
}

// ─── PO Modal ─────────────────────────────────────────────────────
const POModal = ({ editPO, suppliers, warehouses, products, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    supplier: editPO?.supplier || '', warehouse: editPO?.warehouse || warehouses[0]?.id || '',
    expected_date: editPO?.expected_date || '', notes: editPO?.notes || '',
    items: editPO?.items?.map(i => ({ product: i.product, quantity_ordered: i.quantity_ordered, unit_cost: i.unit_cost }))
           || [{ product: '', quantity_ordered: 1, unit_cost: '' }],
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

  const total = form.items.reduce((s, i) => s + (Number(i.quantity_ordered) * Number(i.unit_cost) || 0), 0)

  const handleSubmit = async () => {
    if (!form.supplier || !form.warehouse) return
    const validItems = form.items.filter(i => i.product && i.quantity_ordered > 0 && i.unit_cost > 0)
    if (!validItems.length) return
    setLoading(true)
    try {
      const payload = { ...form, items: validItems }
      if (editPO) { await API.put(`/inventory/purchase-orders/${editPO.id}/`, payload) }
      else { await API.post('/inventory/purchase-orders/', payload) }
      onSuccess(editPO ? 'PO updated!' : 'PO created!'); onClose()
    } catch (err) {
      onSuccess(err.response?.data?.error || 'Error!', 'error')
    } finally { setLoading(false) }
  }

  return (
    <Modal title={editPO ? 'Edit Purchase Order' : 'New Purchase Order'} onClose={onClose} wide
      footer={<>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>{loading ? 'Saving…' : editPO ? 'Update PO' : 'Create PO'}</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Supplier *">
            <select value={form.supplier} onChange={e => f('supplier', e.target.value)} style={iCls}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Warehouse *">
            <select value={form.warehouse} onChange={e => f('warehouse', e.target.value)} style={iCls}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Expected Date">
            <input type="date" value={form.expected_date} onChange={e => f('expected_date', e.target.value)} style={iCls} />
          </Field>
          <Field label="Notes">
            <input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Optional" style={iCls} />
          </Field>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items</span>
            <Btn variant="outline" onClick={() => f('items', [...form.items, { product: '', quantity_ordered: 1, unit_cost: '' }])} style={{ padding: '5px 12px', fontSize: 12 }}>
              <MdAdd size={13} /> Add Item
            </Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: 8, alignItems: 'center', background: '#f9fafb', borderRadius: 10, padding: 8 }}>
                <select value={item.product} onChange={e => setItem(idx, 'product', e.target.value)} style={{ ...iCls, background: '#fff' }}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" value={item.quantity_ordered} onChange={e => setItem(idx, 'quantity_ordered', e.target.value)}
                  placeholder="Qty" style={{ ...iCls, background: '#fff', textAlign: 'center' }} />
                <input type="number" value={item.unit_cost} onChange={e => setItem(idx, 'unit_cost', e.target.value)}
                  placeholder="Cost" style={{ ...iCls, background: '#fff' }} />
                <button onClick={() => f('items', form.items.filter((_, i) => i !== idx))} disabled={form.items.length === 1}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', opacity: form.items.length === 1 ? 0.3 : 1 }}>
                  <MdClose size={16} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#111827' }}>
            Total: <span style={{ color: BLUE, fontSize: 15 }}>Rs. {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Receive PO Modal ─────────────────────────────────────────────
const ReceivePOModal = ({ po, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [qtys, setQtys] = useState(() =>
    Object.fromEntries(po.items.filter(i => !i.is_fully_received).map(i => [i.id, i.pending_qty]))
  )
  const pendingItems = po.items.filter(i => !i.is_fully_received)

  const handleReceive = async () => {
    const items = Object.entries(qtys).filter(([, q]) => Number(q) > 0)
      .map(([item_id, quantity_received]) => ({ item_id: Number(item_id), quantity_received: Number(quantity_received) }))
    if (!items.length) return
    setLoading(true)
    try {
      await API.post(`/inventory/purchase-orders/${po.id}/receive/`, { items })
      onSuccess('Stock received!'); onClose()
    } catch (err) {
      onSuccess(err.response?.data?.error || 'Error!', 'error')
    } finally { setLoading(false) }
  }

  return (
    <Modal title={`Receive Stock — PO-${String(po.id).padStart(4, '0')}`} onClose={onClose} wide
      footer={<>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
        <Btn onClick={handleReceive} disabled={loading} style={{ flex: 1 }}>{loading ? 'Processing…' : 'Confirm Receipt'}</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#eff6ff', borderRadius: 10, padding: 12, border: '1px solid #bfdbfe', fontSize: 13 }}>
          Supplier: <strong style={{ color: '#1e40af' }}>{po.supplier_detail?.name}</strong>
        </div>
        {pendingItems.length === 0
          ? <p style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>All items already received.</p>
          : pendingItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f9fafb', borderRadius: 10, padding: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{item.product_detail?.name}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>
                  Ordered: {item.quantity_ordered} · Received: {item.quantity_received} ·
                  Pending: <strong style={{ color: BLUE }}>{item.pending_qty}</strong>
                </p>
              </div>
              <input type="number" min="0" max={item.pending_qty} value={qtys[item.id] ?? 0}
                onChange={e => setQtys(p => ({ ...p, [item.id]: e.target.value }))}
                style={{ ...iCls, width: 72, textAlign: 'center' }} />
            </div>
          ))}
      </div>
    </Modal>
  )
}

// ─── Main Component ───────────────────────────────────────────────
const Inventory = () => {
  const [activeTab, setActiveTab]   = useState('products')
  const [products, setProducts]     = useState([])
  const [suppliers, setSuppliers]   = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [purchaseOrders, setPOs]    = useState([])
  const [movements, setMovements]   = useState([])
  const [search, setSearch]         = useState('')
  const [lowOnly, setLowOnly]       = useState(false)
  const [catFilter, setCatFilter]   = useState('')
  const [toast, setToast]           = useState(null)

  const [productModal, setProductModal]   = useState(false)
  const [editProduct, setEditProduct]     = useState(null)
  const [adjustModal, setAdjustModal]     = useState(null)
  const [supplierModal, setSupplierModal] = useState(false)
  const [editSupplier, setEditSupplier]   = useState(null)
  const [poModal, setPOModal]             = useState(false)
  const [editPO, setEditPO]               = useState(null)
  const [receivePO, setReceivePO]         = useState(null)

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), [])

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { if (activeTab === 'movements') fetchMovements() }, [activeTab])

  // ── ALL APIS SAME AS WORKING VERSION ─────────────────────────────
  const fetchAll       = () => { fetchProducts(); fetchSuppliers(); fetchWarehouses(); fetchPOs() }
  const fetchProducts  = async () => { try { const r = await API.get('/inventory/products/');        setProducts(r.data?.results ?? r.data) } catch {} }
  const fetchSuppliers = async () => { try { const r = await API.get('/inventory/suppliers/');       setSuppliers(r.data?.results ?? r.data) } catch {} }
  const fetchWarehouses= async () => { try { const r = await API.get('/inventory/warehouses/');      setWarehouses(r.data?.results ?? r.data) } catch {} }
  const fetchPOs       = async () => { try { const r = await API.get('/inventory/purchase-orders/'); setPOs(r.data?.results ?? r.data) } catch {} }
  const fetchMovements = async () => { try { const r = await API.get('/inventory/stock-movements/'); setMovements(r.data?.results ?? r.data) } catch {} }

  const deleteProduct  = async id => {
    if (!window.confirm('Delete this product?')) return
    try { await API.delete(`/inventory/products/${id}/`); fetchProducts(); notify('Product deleted!') }
    catch { notify('Error deleting!', 'error') }
  }
  const deleteSupplier = async id => {
    if (!window.confirm('Delete this supplier?')) return
    try { await API.delete(`/inventory/suppliers/${id}/`); fetchSuppliers(); notify('Supplier deleted!') }
    catch { notify('Error deleting!', 'error') }
  }
  const cancelPO = async id => {
    if (!window.confirm('Cancel this PO?')) return
    try { await API.post(`/inventory/purchase-orders/${id}/cancel/`); fetchPOs(); notify('PO cancelled') }
    catch (err) { notify(err.response?.data?.error || 'Cannot cancel!', 'error') }
  }

  const filteredProducts = products.filter(p => {
    const ms = p.name?.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const ml = lowOnly ? p.is_low_stock : true
    const mc = catFilter ? p.category === catFilter : true
    return ms && ml && mc
  })

  const lowStockCount   = products.filter(p => p.is_low_stock).length
  const outOfStockCount = products.filter(p => p.is_out_of_stock).length

  // ── Shared table styles ───────────────────────────────────────
  const thStyle = (right) => ({
    padding: '10px 16px', textAlign: right ? 'right' : 'left',
    fontSize: 11, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  })
  const tdStyle = (right, extra = {}) => ({
    padding: '12px 16px', textAlign: right ? 'right' : 'left',
    fontSize: 13, color: '#374151',
    borderBottom: '1px solid #f3f4f6', ...extra,
  })

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Inventory</h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Products · Suppliers · Purchase Orders · Movements</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchAll} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', color: '#6b7280' }}>
              <MdRefresh size={18} />
            </button>
            {activeTab !== 'movements' && (
              <button onClick={() => {
                if (activeTab === 'products')  { setEditProduct(null);  setProductModal(true) }
                if (activeTab === 'suppliers') { setEditSupplier(null); setSupplierModal(true) }
                if (activeTab === 'purchase')  { setEditPO(null);       setPOModal(true) }
              }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: BLUE, color: '#fff', padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                <MdAdd size={18} />
                Add {activeTab === 'products' ? 'Product' : activeTab === 'suppliers' ? 'Supplier' : 'Purchase Order'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="Total Products" value={products.length}  icon={MdInventory} />
          <StatCard label="Low Stock"      value={lowStockCount}    icon={MdWarning}   accent={lowStockCount > 0 ? 'red' : ''} onClick={() => { setActiveTab('products'); setLowOnly(true) }} />
          <StatCard label="Out of Stock"   value={outOfStockCount}  icon={MdBlock}     accent={outOfStockCount > 0 ? 'red' : ''} />
          <StatCard label="Suppliers"      value={suppliers.length} icon={MdPeople} />
        </div>

        {/* Tabs — blue active pill matching POS */}
        <div style={{ display: 'flex', gap: 4, background: '#e5e7eb', borderRadius: 12, padding: 5, width: 'fit-content' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setActiveTab(key); setSearch('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
                background: activeTab === key ? BLUE : 'transparent',
                color:      activeTab === key ? '#fff' : '#6b7280',
                boxShadow:  activeTab === key ? '0 2px 6px rgba(26,86,219,.3)' : 'none',
              }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── PRODUCTS TAB ─────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Search bar */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <MdSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
                <input placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...iCls, paddingLeft: 36 }} />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...iCls, width: 'auto' }}>
                <option value="">All Categories</option>
                {CATEGORY_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button onClick={() => setLowOnly(!lowOnly)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `2px solid ${lowOnly ? '#f87171' : '#e5e7eb'}`,
                background: lowOnly ? '#fff1f2' : '#fff', color: lowOnly ? '#dc2626' : '#6b7280',
              }}>
                <MdWarning size={16} /> Low Stock {lowOnly && `(${lowStockCount})`}
              </button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle()}>Product</th>
                      <th style={thStyle()}>Category</th>
                      <th style={thStyle()}>Supplier</th>
                      <th style={thStyle(true)}>Retail</th>
                      <th style={thStyle(true)}>Cost</th>
                      <th style={thStyle(true)}>Margin</th>
                      <th style={{ ...thStyle(), textAlign: 'center' }}>Stock</th>
                      <th style={{ ...thStyle(), textAlign: 'center' }}>Status</th>
                      <th style={{ ...thStyle(), textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px 0', color: '#d1d5db' }}>
                        <MdInventory size={36} style={{ display: 'block', margin: '0 auto 8px' }} />
                        No products found
                      </td></tr>
                    ) : filteredProducts.map(p => (
                      <tr key={p.id} style={{ transition: 'background .1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={tdStyle()}>
                          <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{p.name}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', fontFamily: 'monospace' }}>{p.sku}</p>
                        </td>
                        <td style={tdStyle()}>
                          <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{p.category}</span>
                        </td>
                        <td style={tdStyle(false, { fontSize: 12, color: '#6b7280' })}>{p.supplier_detail?.name || '—'}</td>
                        <td style={tdStyle(true, { fontWeight: 700, color: '#111827' })}>Rs. {Number(p.retail_price).toLocaleString()}</td>
                        <td style={tdStyle(true, { fontSize: 12, color: '#9ca3af' })}>Rs. {Number(p.cost_price).toLocaleString()}</td>
                        <td style={tdStyle(true)}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, color: '#059669', fontSize: 12, fontWeight: 700 }}>
                            <MdTrendingUp size={13} />{p.profit_margin}%
                          </span>
                        </td>
                        <td style={{ ...tdStyle(), textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 800, fontSize: 15, color: p.is_out_of_stock ? '#dc2626' : p.is_low_stock ? '#d97706' : '#059669' }}>
                              {p.stock_quantity}
                            </span>
                            {p.is_low_stock && !p.is_out_of_stock && <MdWarning size={13} style={{ color: '#d97706' }} />}
                            {p.is_out_of_stock && <MdBlock size={13} style={{ color: '#dc2626' }} />}
                          </div>
                        </td>
                        <td style={{ ...tdStyle(), textAlign: 'center' }}>
                          <span style={{ background: p.is_active ? '#d1fae5' : '#f3f4f6', color: p.is_active ? '#065f46' : '#6b7280', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle(), textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <button onClick={() => setAdjustModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 6, borderRadius: 8 }}><MdBuild size={15} /></button>
                            <button onClick={() => { setEditProduct(p); setProductModal(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BLUE, padding: 6, borderRadius: 8 }}><MdEdit size={15} /></button>
                            <button onClick={() => deleteProduct(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 6, borderRadius: 8 }}><MdDelete size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SUPPLIERS TAB ─────────────────────────────────────── */}
        {activeTab === 'suppliers' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle()}>Supplier</th>
                  <th style={thStyle()}>Contact</th>
                  <th style={thStyle()}>Phone</th>
                  <th style={thStyle()}>Email</th>
                  <th style={thStyle()}>Address</th>
                  <th style={{ ...thStyle(), textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: '#d1d5db' }}>
                    <MdPeople size={36} style={{ display: 'block', margin: '0 auto 8px' }} />No suppliers added yet
                  </td></tr>
                ) : suppliers.map(s => (
                  <tr key={s.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={tdStyle(false, { fontWeight: 600, color: '#111827' })}>{s.name}</td>
                    <td style={tdStyle(false, { color: '#6b7280' })}>{s.contact_person || '—'}</td>
                    <td style={tdStyle(false, { color: '#6b7280' })}>{s.phone || '—'}</td>
                    <td style={tdStyle(false, { color: '#6b7280' })}>{s.email || '—'}</td>
                    <td style={tdStyle(false, { color: '#9ca3af', fontSize: 12, maxWidth: 160 })}>{s.address || '—'}</td>
                    <td style={{ ...tdStyle(), textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <button onClick={() => { setEditSupplier(s); setSupplierModal(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BLUE, padding: 6, borderRadius: 8 }}><MdEdit size={15} /></button>
                        <button onClick={() => deleteSupplier(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 6, borderRadius: 8 }}><MdDelete size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PURCHASE ORDERS TAB ───────────────────────────────── */}
        {activeTab === 'purchase' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle()}>PO #</th>
                  <th style={thStyle()}>Supplier</th>
                  <th style={thStyle()}>Warehouse</th>
                  <th style={thStyle()}>Date</th>
                  <th style={thStyle(true)}>Total</th>
                  <th style={{ ...thStyle(), textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle(), textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#d1d5db' }}>
                    <MdLocalShipping size={36} style={{ display: 'block', margin: '0 auto 8px' }} />No purchase orders yet
                  </td></tr>
                ) : purchaseOrders.map(po => (
                  <tr key={po.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={tdStyle(false, { fontFamily: 'monospace', fontWeight: 700, color: BLUE })}>PO-{String(po.id).padStart(4, '0')}</td>
                    <td style={tdStyle(false, { fontWeight: 600 })}>{po.supplier_detail?.name || '—'}</td>
                    <td style={tdStyle(false, { fontSize: 12, color: '#9ca3af' })}>{po.warehouse_detail?.name || '—'}</td>
                    <td style={tdStyle(false, { fontSize: 12, color: '#9ca3af' })}>{new Date(po.order_date).toLocaleDateString('en-PK')}</td>
                    <td style={tdStyle(true, { fontWeight: 700 })}>Rs. {Number(po.total_amount).toLocaleString()}</td>
                    <td style={{ ...tdStyle(), textAlign: 'center' }}>
                      <span style={{ ...PO_STATUS_COLORS[po.status] && {}, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}
                        className={PO_STATUS_COLORS[po.status]}>
                        {po.status_display}
                      </span>
                    </td>
                    <td style={{ ...tdStyle(), textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        {!['received', 'cancelled'].includes(po.status) && <>
                          <button onClick={() => setReceivePO(po)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: 6, borderRadius: 8 }}><MdArrowDownward size={15} /></button>
                          <button onClick={() => { setEditPO(po); setPOModal(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BLUE, padding: 6, borderRadius: 8 }}><MdEdit size={15} /></button>
                          <button onClick={() => cancelPO(po.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 6, borderRadius: 8 }}><MdBlock size={15} /></button>
                        </>}
                        {po.status === 'received' && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><MdCheckCircle size={14} /> Done</span>}
                        {po.status === 'cancelled' && <span style={{ fontSize: 12, color: '#9ca3af' }}>Cancelled</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── STOCK MOVEMENTS TAB ───────────────────────────────── */}
        {activeTab === 'movements' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle()}>Product</th>
                  <th style={thStyle()}>Type</th>
                  <th style={{ ...thStyle(), textAlign: 'center' }}>Qty</th>
                  <th style={{ ...thStyle(), textAlign: 'center' }}>Before</th>
                  <th style={{ ...thStyle(), textAlign: 'center' }}>After</th>
                  <th style={thStyle()}>Reference</th>
                  <th style={thStyle()}>By</th>
                  <th style={thStyle()}>Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: '#d1d5db' }}>
                    <MdHistory size={36} style={{ display: 'block', margin: '0 auto 8px' }} />No movements recorded
                  </td></tr>
                ) : movements.map(m => (
                  <tr key={m.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={tdStyle()}>
                      <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{m.product_detail?.name}</p>
                      <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', margin: '2px 0 0' }}>{m.product_detail?.sku}</p>
                    </td>
                    <td style={tdStyle()}>
                      <span style={{ borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}
                        className={MOVEMENT_COLORS[m.movement_type]}>
                        {m.movement_type_display}
                      </span>
                    </td>
                    <td style={{ ...tdStyle(), textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, color: m.quantity > 0 ? '#059669' : '#dc2626' }}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </td>
                    <td style={{ ...tdStyle(), textAlign: 'center', color: '#9ca3af' }}>{m.stock_before}</td>
                    <td style={{ ...tdStyle(), textAlign: 'center', fontWeight: 700, color: '#111827' }}>{m.stock_after}</td>
                    <td style={tdStyle(false, { fontSize: 12, fontFamily: 'monospace', color: '#9ca3af' })}>{m.reference || '—'}</td>
                    <td style={tdStyle(false, { fontSize: 12, color: '#9ca3af' })}>{m.created_by_detail?.username || '—'}</td>
                    <td style={tdStyle(false, { fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' })}>
                      {new Date(m.created_at).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {productModal && (
        <ProductModal editProduct={editProduct} suppliers={suppliers}
          onClose={() => { setProductModal(false); setEditProduct(null) }}
          onSuccess={(msg, t) => { notify(msg, t); fetchProducts() }} />
      )}
      {adjustModal && warehouses.length > 0 && (
        <StockAdjustModal product={adjustModal} warehouses={warehouses}
          onClose={() => setAdjustModal(null)}
          onSuccess={(msg, t) => { notify(msg, t); fetchProducts(); fetchMovements() }} />
      )}
      {supplierModal && (
        <SupplierModal editSupplier={editSupplier}
          onClose={() => { setSupplierModal(false); setEditSupplier(null) }}
          onSuccess={(msg, t) => { notify(msg, t); fetchSuppliers() }} />
      )}
      {poModal && (
        <POModal editPO={editPO} suppliers={suppliers} warehouses={warehouses} products={products}
          onClose={() => { setPOModal(false); setEditPO(null) }}
          onSuccess={(msg, t) => { notify(msg, t); fetchPOs() }} />
      )}
      {receivePO && (
        <ReceivePOModal po={receivePO}
          onClose={() => setReceivePO(null)}
          onSuccess={(msg, t) => { notify(msg, t); fetchPOs(); fetchProducts(); fetchMovements() }} />
      )}
    </Layout>
  )
}

export default Inventory