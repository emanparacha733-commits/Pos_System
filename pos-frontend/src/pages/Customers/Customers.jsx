import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdClose,
  MdPerson, MdPhone, MdEmail, MdStar, MdHistory,
  MdAccountBalanceWallet, MdShoppingBag
} from 'react-icons/md'

// ─── Customer Modal (Add/Edit) ─────────────────────────────────────
const CustomerModal = ({ editCustomer, onClose, onDone }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: editCustomer?.name || '',
    phone: editCustomer?.phone || '',
    email: editCustomer?.email || '',
    credit_balance: editCustomer?.credit_balance || 0,
    loyalty_points: editCustomer?.loyalty_points || 0,
  })

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.name) return alert('Customer name required!')
    setLoading(true)
    try {
      if (editCustomer) {
        await API.put(`/customers/customers/${editCustomer.id}/`, form)
      } else {
        await API.post('/customers/customers/', form)
      }
      onDone()
      onClose()
    } catch (err) {
      alert('Error saving customer!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">
            {editCustomer ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <MdPerson className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Full Name *"
              value={form.name}
              onChange={e => f('name', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <MdPhone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Phone Number"
              value={form.phone}
              onChange={e => f('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <MdEmail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Email Address"
              type="email"
              value={form.email}
              onChange={e => f('email', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Loyalty Points</label>
              <input
                type="number"
                value={form.loyalty_points}
                onChange={e => f('loyalty_points', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Credit Balance (Rs.)</label>
              <input
                type="number"
                value={form.credit_balance}
                onChange={e => f('credit_balance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-4 border-t">
          <button onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : editCustomer ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Customer History Modal ────────────────────────────────────────
const HistoryModal = ({ customer, onClose }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get(`/customers/customers/${customer.id}/history/`)
        setOrders(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [customer.id])

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold text-gray-800">{customer.name}</h2>
            <p className="text-xs text-gray-400">Purchase History</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 border-b">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold text-blue-600">{orders.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-base font-bold text-green-600">Rs. {totalSpent.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Points</p>
            <p className="text-xl font-bold text-yellow-600">{customer.loyalty_points}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <MdShoppingBag size={40} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No orders yet</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Order #{order.id}</p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString()} · {order.payment_method}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-600">Rs. {Number(order.total).toLocaleString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  order.status === 'paid' ? 'bg-green-100 text-green-700' :
                  order.status === 'refunded' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Customers Component ──────────────────────────────────────
const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [customerModal, setCustomerModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    try {
      const res = await API.get('/customers/customers/')
      setCustomers(res.data)
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return
    try {
      await API.delete(`/customers/customers/${id}/`)
      fetchCustomers()
    } catch (err) { alert('Error deleting customer!') }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalCustomers = customers.length
  const totalLoyaltyPoints = customers.reduce((s, c) => s + Number(c.loyalty_points || 0), 0)
  const totalCredit = customers.reduce((s, c) => s + Number(c.credit_balance || 0), 0)

  return (
    <Layout>
      <div className="space-y-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
            <p className="text-gray-500 text-sm">Manage your customer profiles</p>
          </div>
          <button
            onClick={() => { setEditCustomer(null); setCustomerModal(true) }}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <MdAdd size={20} /> Add Customer
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdPerson size={18} className="text-blue-600" />
              <p className="text-xs text-gray-500">Total Customers</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalCustomers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdStar size={18} className="text-yellow-500" />
              <p className="text-xs text-gray-500">Total Loyalty Points</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalLoyaltyPoints.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdAccountBalanceWallet size={18} className="text-green-600" />
              <p className="text-xs text-gray-500">Total Credit</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">Rs. {totalCredit.toLocaleString()}</p>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ── Table + Mobile Cards ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Loyalty Points</th>
                  <th className="px-4 py-3 text-left">Credit</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <MdPerson size={40} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400">No customers found</p>
                    </td>
                  </tr>
                ) : filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{customer.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{customer.email || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <MdStar size={14} className="text-yellow-500" />
                        <span className="font-medium text-gray-800">{customer.loyalty_points || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      Rs. {Number(customer.credit_balance || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setHistoryModal(customer)} title="Purchase History" className="text-purple-500 hover:text-purple-700">
                          <MdHistory size={18} />
                        </button>
                        <button onClick={() => { setEditCustomer(customer); setCustomerModal(true) }} className="text-blue-600 hover:text-blue-800">
                          <MdEdit size={18} />
                        </button>
                        <button onClick={() => handleDelete(customer.id)} className="text-red-500 hover:text-red-700">
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-10">
                <MdPerson size={40} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400">No customers found</p>
              </div>
            ) : filteredCustomers.map(customer => (
              <div key={customer.id} className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone || '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                        <MdStar size={11} /> {customer.loyalty_points || 0}
                      </span>
                      <span className="text-xs text-green-600">
                        Rs. {Number(customer.credit_balance || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setHistoryModal(customer)} className="text-purple-500 p-1.5">
                    <MdHistory size={20} />
                  </button>
                  <button onClick={() => { setEditCustomer(customer); setCustomerModal(true) }} className="text-blue-600 p-1.5">
                    <MdEdit size={20} />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="text-red-500 p-1.5">
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Modals */}
      {customerModal && (
        <CustomerModal
          editCustomer={editCustomer}
          onClose={() => { setCustomerModal(false); setEditCustomer(null) }}
          onDone={fetchCustomers}
        />
      )}
      {historyModal && (
        <HistoryModal
          customer={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </Layout>
  )
}

export default Customers