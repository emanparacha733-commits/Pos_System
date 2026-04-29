import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdTune,
  MdWarning, MdInventory, MdPeople, MdCategory,
  MdAddCircle, MdRemoveCircle, MdClose, MdCheck
} from 'react-icons/md'

// ─── Tabs ─────────────────────────────────────────────────────────
const TABS = ['Products', 'Suppliers', 'Categories']

// ─── Stock Adjustment Modal ────────────────────────────────────────
const StockModal = ({ product, onClose, onDone }) => {
  const [action, setAction] = useState('stock_in')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!qty || qty <= 0) return alert('Enter valid quantity')
    setLoading(true)
    try {
      await API.post('/inventory/logs/', {
        product: product.id,
        action,
        qty: Number(qty),
        note,
      })
      onDone()
      onClose()
    } catch (err) {
      alert('Error adjusting stock!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">Stock Adjustment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-medium text-gray-800">{product.name}</p>
            <p className="text-sm text-gray-500">Current Stock: <span className="font-bold text-blue-600">{product.stock_qty}</span></p>
          </div>

          {/* Action */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'stock_in', label: '+ Stock In', color: 'green' },
              { value: 'stock_out', label: '- Stock Out', color: 'red' },
              { value: 'adjustment', label: '✎ Adjust', color: 'blue' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setAction(opt.value)}
                className={`py-2 rounded-lg text-xs font-medium transition border-2 ${
                  action === opt.value
                    ? opt.color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                    : opt.color === 'red' ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <input
            type="number"
            placeholder="Quantity *"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Product Modal ─────────────────────────────────────────────────
const ProductModal = ({ editProduct, categories, onClose, onDone }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: editProduct?.name || '',
    category: editProduct?.category || '',
    price: editProduct?.price || '',
    cost_price: editProduct?.cost_price || '',
    stock_qty: editProduct?.stock_qty || '',
    low_stock_alert: editProduct?.low_stock_alert || 5,
    unit: editProduct?.unit || 'piece',
    barcode: editProduct?.barcode || '',
    sku: editProduct?.sku || '',
    description: editProduct?.description || '',
    is_active: editProduct?.is_active ?? true,
  })

  const handleSubmit = async () => {
    if (!form.name || !form.price) return alert('Name and price required!')
    setLoading(true)
    try {
      if (editProduct) {
        await API.put(`/products/products/${editProduct.id}/`, form)
      } else {
        await API.post('/products/products/', form)
      }
      onDone()
      onClose()
    } catch (err) {
      alert('Error saving product!')
    } finally {
      setLoading(false)
    }
  }

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">{editProduct ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
        </div>
        <div className="p-4 space-y-3">
          <input placeholder="Product Name *" value={form.name} onChange={e => f('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <select value={form.category} onChange={e => f('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Selling Price *" type="number" value={form.price} onChange={e => f('price', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Cost Price" type="number" value={form.cost_price} onChange={e => f('cost_price', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Stock Qty" type="number" value={form.stock_qty} onChange={e => f('stock_qty', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Low Stock Alert" type="number" value={form.low_stock_alert} onChange={e => f('low_stock_alert', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Barcode" value={form.barcode} onChange={e => f('barcode', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="SKU" value={form.sku} onChange={e => f('sku', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <select value={form.unit} onChange={e => f('unit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {['piece','kg','gram','liter','meter','box','dozen'].map(u =>
              <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
            )}
          </select>

          <textarea placeholder="Description" value={form.description} onChange={e => f('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => f('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
        <div className="flex gap-3 p-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : editProduct ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Supplier Modal ────────────────────────────────────────────────
const SupplierModal = ({ editSupplier, onClose, onDone }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: editSupplier?.name || '',
    phone: editSupplier?.phone || '',
    email: editSupplier?.email || '',
    address: editSupplier?.address || '',
  })

  const handleSubmit = async () => {
    if (!form.name) return alert('Supplier name required!')
    setLoading(true)
    try {
      if (editSupplier) {
        await API.put(`/inventory/suppliers/${editSupplier.id}/`, form)
      } else {
        await API.post('/inventory/suppliers/', form)
      }
      onDone()
      onClose()
    } catch (err) {
      alert('Error saving supplier!')
    } finally {
      setLoading(false)
    }
  }

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
        </div>
        <div className="p-4 space-y-3">
          <input placeholder="Supplier Name *" value={form.name} onChange={e => f('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Phone" value={form.phone} onChange={e => f('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Email" type="email" value={form.email} onChange={e => f('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="Address" value={form.address} onChange={e => f('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
        </div>
        <div className="flex gap-3 p-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : editSupplier ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Category Modal ────────────────────────────────────────────────
const CategoryModal = ({ editCategory, onClose, onDone }) => {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(editCategory?.name || '')

  const handleSubmit = async () => {
    if (!name) return alert('Category name required!')
    setLoading(true)
    try {
      if (editCategory) {
        await API.put(`/products/categories/${editCategory.id}/`, { name })
      } else {
        await API.post('/products/categories/', { name })
      }
      onDone()
      onClose()
    } catch (err) {
      alert('Error saving category!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">{editCategory ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
        </div>
        <div className="p-4">
          <input placeholder="Category Name *" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3 p-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : editCategory ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Inventory Component ──────────────────────────────────────
const Inventory = () => {
  const [activeTab, setActiveTab] = useState('Products')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Modals
  const [productModal, setProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [stockModal, setStockModal] = useState(null) // product object
  const [supplierModal, setSupplierModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [categoryModal, setCategoryModal] = useState(false)
  const [editCategory, setEditCategory] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = () => {
    fetchProducts()
    fetchCategories()
    fetchSuppliers()
  }

  const fetchProducts = async () => {
    try { const res = await API.get('/products/products/'); setProducts(res.data) }
    catch (err) { console.error(err) }
  }

  const fetchCategories = async () => {
    try { const res = await API.get('/products/categories/'); setCategories(res.data) }
    catch (err) { console.error(err) }
  }

  const fetchSuppliers = async () => {
    try { const res = await API.get('/inventory/suppliers/'); setSuppliers(res.data) }
    catch (err) { console.error(err) }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try { await API.delete(`/products/products/${id}/`); fetchProducts() }
    catch (err) { alert('Error deleting product!') }
  }

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Delete this supplier?')) return
    try { await API.delete(`/inventory/suppliers/${id}/`); fetchSuppliers() }
    catch (err) { alert('Error deleting supplier!') }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try { await API.delete(`/products/categories/${id}/`); fetchCategories() }
    catch (err) { alert('Error deleting category!') }
  }

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchLow = lowStockOnly ? p.stock_qty <= p.low_stock_alert : true
    return matchSearch && matchLow
  })

  const lowStockCount = products.filter(p => p.stock_qty <= p.low_stock_alert).length

  return (
    <Layout>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
            <p className="text-gray-500 text-sm">Manage your products, suppliers & categories</p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'Products') { setEditProduct(null); setProductModal(true) }
              if (activeTab === 'Suppliers') { setEditSupplier(null); setSupplierModal(true) }
              if (activeTab === 'Categories') { setEditCategory(null); setCategoryModal(true) }
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <MdAdd size={20} /> Add {activeTab.slice(0, -1)}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{products.length}</p>
          </div>
          <div
            onClick={() => { setActiveTab('Products'); setLowStockOnly(true) }}
            className={`rounded-xl shadow-sm p-4 cursor-pointer transition ${lowStockCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-white'}`}
          >
            <p className="text-xs text-gray-500 flex items-center gap-1">
              {lowStockCount > 0 && <MdWarning size={14} className="text-red-500" />}
              Low Stock
            </p>
            <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {lowStockCount}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Suppliers</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{suppliers.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(''); setLowStockOnly(false) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'Products' && <MdInventory size={16} />}
              {tab === 'Suppliers' && <MdPeople size={16} />}
              {tab === 'Categories' && <MdCategory size={16} />}
              {tab}
            </button>
          ))}
        </div>

        {/* ── Products Tab ── */}
        {activeTab === 'Products' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3">
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
              <button
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
                  lowStockOnly ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <MdWarning size={16} /> Low Stock {lowStockOnly && `(${lowStockCount})`}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Cost</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">No products found</td></tr>
                  ) : filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {categories.find(c => c.id === product.category)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-medium">Rs. {Number(product.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">Rs. {Number(product.cost_price).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${product.stock_qty <= product.low_stock_alert ? 'text-red-600' : 'text-green-600'}`}>
                            {product.stock_qty}
                          </span>
                          {product.stock_qty <= product.low_stock_alert && (
                            <MdWarning size={14} className="text-red-500" title="Low stock!" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => setStockModal(product)}
                            title="Adjust Stock"
                            className="text-green-600 hover:text-green-800"
                          >
                            <MdAddCircle size={18} />
                          </button>
                          <button onClick={() => { setEditProduct(product); setProductModal(true) }} className="text-blue-600 hover:text-blue-800">
                            <MdEdit size={18} />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700">
                            <MdDelete size={18} />
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
        {activeTab === 'Suppliers' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No suppliers added yet</td></tr>
                ) : suppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{supplier.name}</td>
                    <td className="px-4 py-3 text-gray-500">{supplier.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{supplier.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{supplier.address || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditSupplier(supplier); setSupplierModal(true) }} className="text-blue-600 hover:text-blue-800">
                          <MdEdit size={18} />
                        </button>
                        <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-500 hover:text-red-700">
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Categories Tab ── */}
        {activeTab === 'Categories' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.length === 0 ? (
              <div className="col-span-4 text-center py-10 text-gray-400">No categories added yet</div>
            ) : categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{cat.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {products.filter(p => p.category === cat.id).length} products
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditCategory(cat); setCategoryModal(true) }} className="text-blue-600 hover:text-blue-800">
                    <MdEdit size={16} />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700">
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {productModal && (
        <ProductModal
          editProduct={editProduct}
          categories={categories}
          onClose={() => { setProductModal(false); setEditProduct(null) }}
          onDone={fetchProducts}
        />
      )}
      {stockModal && (
        <StockModal
          product={stockModal}
          onClose={() => setStockModal(null)}
          onDone={fetchProducts}
        />
      )}
      {supplierModal && (
        <SupplierModal
          editSupplier={editSupplier}
          onClose={() => { setSupplierModal(false); setEditSupplier(null) }}
          onDone={fetchSuppliers}
        />
      )}
      {categoryModal && (
        <CategoryModal
          editCategory={editCategory}
          onClose={() => { setCategoryModal(false); setEditCategory(null) }}
          onDone={fetchCategories}
        />
      )}
    </Layout>
  )
}

export default Inventory
