
import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdShoppingBag, MdStorefront, MdVisibility, MdClose,
  MdLocalShipping, MdCheckCircle, MdCancel, MdPending,
  MdRefresh, MdSearch, MdPrint, MdReplay
} from 'react-icons/md'

// Status Badge
const StatusBadge = ({ status }) => {
  const styles = {
    pending:    'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped:    'bg-purple-100 text-purple-700',
    delivered:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-700',
    paid:       'bg-green-100 text-green-700',
    hold:       'bg-yellow-100 text-yellow-700',
    refunded:   'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ─── Receipt Print Component ───────────────────────────────────────
const printReceipt = (order) => {
  const items = order.items?.map(item => `
    <tr>
      <td style="padding:4px 8px;">${item.product_name}</td>
      <td style="padding:4px 8px; text-align:center;">x${item.qty}</td>
      <td style="padding:4px 8px; text-align:right;">Rs. ${Number(item.unit_price).toLocaleString()}</td>
      <td style="padding:4px 8px; text-align:right;">Rs. ${Number(item.total_price).toLocaleString()}</td>
    </tr>
  `).join('') || ''

  const receipt = `
    <html>
    <head>
      <title>Receipt #${order.id}</title>
      <style>
        body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
        h2 { text-align: center; margin-bottom: 4px; }
        p { text-align: center; margin: 2px 0; font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { border-bottom: 1px dashed #000; padding: 4px 8px; text-align: left; font-size: 12px; }
        td { font-size: 12px; }
        .total { border-top: 1px dashed #000; font-weight: bold; }
        .footer { text-align: center; margin-top: 10px; font-size: 11px; color: #888; }
      </style>
    </head>
    <body>
      <h2>POS System</h2>
      <p>Receipt #${order.id}</p>
      <p>${new Date(order.created_at).toLocaleString()}</p>
      <p>Customer: ${order.customer_name || 'Walk-in'}</p>
      <p>Payment: ${order.payment_method}</p>
      <table>
        <tr>
          <th>Item</th><th>Qty</th><th>Price</th><th>Total</th>
        </tr>
        ${items}
        <tr class="total">
          <td colspan="3" style="padding:6px 8px;">Subtotal</td>
          <td style="padding:6px 8px; text-align:right;">Rs. ${Number(order.subtotal).toLocaleString()}</td>
        </tr>
        ${Number(order.discount_value) > 0 ? `
        <tr>
          <td colspan="3" style="padding:4px 8px;">Discount</td>
          <td style="padding:4px 8px; text-align:right; color:red;">- Rs. ${Number(order.discount_value).toLocaleString()}</td>
        </tr>` : ''}
        <tr>
          <td colspan="3" style="padding:4px 8px;">Tax</td>
          <td style="padding:4px 8px; text-align:right;">Rs. ${Number(order.tax_amount || 0).toLocaleString()}</td>
        </tr>
        <tr class="total">
          <td colspan="3" style="padding:6px 8px; font-size:14px;">TOTAL</td>
          <td style="padding:6px 8px; text-align:right; font-size:14px;">Rs. ${Number(order.total).toLocaleString()}</td>
        </tr>
      </table>
      <div class="footer">Thank you for your visit!</div>
    </body>
    </html>
  `
  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(receipt)
  win.document.close()
  win.print()
}

// ─── Online Order Detail Modal ─────────────────────────────────────
const OnlineOrderModal = ({ order, onClose, onStatusUpdate }) => {
  const [deliveryStatus, setDeliveryStatus] = useState(order.delivery_status)
  const [loading, setLoading] = useState(false)

  const updateStatus = async () => {
    setLoading(true)
    try {
      await API.patch(`/ecommerce/orders/${order.id}/`, { delivery_status: deliveryStatus })
      onStatusUpdate()
      onClose()
    } catch (err) {
      alert('Error updating status!')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setLoading(true)
    try {
      await API.patch(`/ecommerce/orders/${order.id}/`, { delivery_status: 'processing' })
      onStatusUpdate()
      onClose()
    } catch (err) {
      alert('Error accepting order!')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this order?')) return
    setLoading(true)
    try {
      await API.patch(`/ecommerce/orders/${order.id}/`, { delivery_status: 'cancelled' })
      onStatusUpdate()
      onClose()
    } catch (err) {
      alert('Error rejecting order!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Online Order #{order.id}</h2>
            <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose size={22} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Accept / Reject buttons — sirf pending orders ke liye */}
          {order.delivery_status === 'processing' && (
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-xl font-semibold text-sm hover:bg-green-600 transition disabled:opacity-50"
              >
                <MdCheckCircle size={18} /> Accept Order
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-xl font-semibold text-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                <MdCancel size={18} /> Reject Order
              </button>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="font-semibold text-blue-800 text-sm mb-2">Customer Info</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {order.customer_name}</p>
            {order.customer_phone && <p className="text-sm text-gray-700"><span className="font-medium">Phone:</span> {order.customer_phone}</p>}
            {order.customer_email && <p className="text-sm text-gray-700"><span className="font-medium">Email:</span> {order.customer_email}</p>}
            <p className="text-sm text-gray-700"><span className="font-medium">Address:</span> {order.delivery_address}</p>
          </div>

          {/* Items */}
          <div>
            <p className="font-semibold text-gray-700 text-sm mb-2">Order Items</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">{item.product_name} <span className="text-gray-400">x{item.qty}</span></span>
                  <span className="text-sm font-semibold text-gray-800">Rs. {Number(item.total_price).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-base pt-3">
              <span>Total</span>
              <span className="text-blue-600">Rs. {Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <p className="font-semibold text-gray-700 text-sm mb-2">Update Delivery Status</p>
            <select
              value={deliveryStatus}
              onChange={e => setDeliveryStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t">
          <button
            onClick={updateStatus}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Physical Order Detail Modal ───────────────────────────────────
const PhysicalOrderModal = ({ order, onClose, onRefund }) => {
  const [loading, setLoading] = useState(false)

  const handleRefund = async () => {
    if (!window.confirm('Are you sure you want to refund this order? Stock will be restored.')) return
    setLoading(true)
    try {
      await API.post(`/pos/orders/${order.id}/refund/`)
      onRefund()
      onClose()
    } catch (err) {
      alert('Error processing refund!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Physical Order #{order.id}</h2>
            <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose size={22} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Sale Info */}
          <div className="bg-green-50 rounded-xl p-4">
            <p className="font-semibold text-green-800 text-sm mb-2">Sale Info</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Customer:</span> {order.customer_name || 'Walk-in Customer'}</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Payment:</span> <span className="capitalize">{order.payment_method}</span></p>
            <p className="text-sm text-gray-700 flex items-center gap-2"><span className="font-medium">Status:</span> <StatusBadge status={order.status} /></p>
          </div>

          {/* Items */}
          <div>
            <p className="font-semibold text-gray-700 text-sm mb-2">Items</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">{item.product_name} <span className="text-gray-400">x{item.qty}</span></span>
                  <span className="text-sm font-semibold text-gray-800">Rs. {Number(item.total_price).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-base pt-3">
              <span>Total</span>
              <span className="text-green-600">Rs. {Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 p-5 border-t">
          {/* Receipt Reprint */}
          <button
            onClick={() => printReceipt(order)}
            className="flex-1 flex items-center justify-center gap-2 border border-blue-200 text-blue-600 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition text-sm"
          >
            <MdPrint size={18} /> Reprint Receipt
          </button>

          {/* Refund — sirf paid orders pe */}
          {order.status === 'paid' && (
            <button
              onClick={handleRefund}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition text-sm disabled:opacity-50"
            >
              <MdReplay size={18} /> {loading ? 'Processing...' : 'Refund'}
            </button>
          )}

          <button onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Orders Component ─────────────────────────────────────────
const Orders = () => {
  const [tab, setTab] = useState('online')
  const [onlineOrders, setOnlineOrders] = useState([])
  const [physicalOrders, setPhysicalOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalType, setModalType] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const [online, physical] = await Promise.all([
        API.get('/ecommerce/orders/'),
        API.get('/pos/orders/')
      ])
      setOnlineOrders(online.data)
      setPhysicalOrders(physical.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOnline = onlineOrders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.id).includes(search)
  )

  const filteredPhysical = physicalOrders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.id).includes(search)
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Manage online & physical orders</p>
          </div>
          <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium">
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Online Orders', value: onlineOrders.length, color: 'blue', icon: <MdShoppingBag size={22} /> },
            { label: 'Physical Orders', value: physicalOrders.length, color: 'green', icon: <MdStorefront size={22} /> },
            { label: 'Pending', value: onlineOrders.filter(o => o.delivery_status === 'processing').length, color: 'yellow', icon: <MdPending size={22} /> },
            { label: 'Delivered', value: onlineOrders.filter(o => o.delivery_status === 'delivered').length, color: 'purple', icon: <MdCheckCircle size={22} /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${stat.color}-100 text-${stat.color}-600`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => setTab('online')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'online' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <MdShoppingBag size={16} /> Online Orders
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${tab === 'online' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {onlineOrders.length}
                </span>
              </button>
              <button
                onClick={() => setTab('physical')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'physical' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <MdStorefront size={16} /> Physical Orders
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${tab === 'physical' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {physicalOrders.length}
                </span>
              </button>
            </div>
            <div className="relative">
              <MdSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Online Orders Table */}
          {tab === 'online' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-16 text-gray-400">Loading...</div>
              ) : filteredOnline.length === 0 ? (
                <div className="text-center py-16 text-gray-400">No online orders found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Order ID', 'Customer', 'Phone', 'Total', 'Payment', 'Delivery', 'Date', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOnline.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm font-bold text-blue-600">#{order.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{order.customer_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{order.customer_phone || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">Rs. {Number(order.total).toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.payment_status} /></td>
                        <td className="px-4 py-3"><StatusBadge status={order.delivery_status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setSelectedOrder(order); setModalType('online') }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                          >
                            <MdVisibility size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Physical Orders Table */}
          {tab === 'physical' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-16 text-gray-400">Loading...</div>
              ) : filteredPhysical.length === 0 ? (
                <div className="text-center py-16 text-gray-400">No physical orders found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Order ID', 'Customer', 'Payment', 'Subtotal', 'Total', 'Status', 'Date', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPhysical.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm font-bold text-green-600">#{order.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{order.customer_name || 'Walk-in'}</td>
                        <td className="px-4 py-3 text-sm capitalize text-gray-500">{order.payment_method}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Rs. {Number(order.subtotal).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">Rs. {Number(order.total).toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setSelectedOrder(order); setModalType('physical') }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition"
                          >
                            <MdVisibility size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedOrder && modalType === 'online' && (
        <OnlineOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={fetchOrders}
        />
      )}
      {selectedOrder && modalType === 'physical' && (
        <PhysicalOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefund={fetchOrders}
        />
      )}
    </Layout>
  )
}

export default Orders