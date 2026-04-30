import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  MdTrendingUp, MdShoppingBag, MdAttachMoney, MdAdd,
  MdDelete, MdEdit, MdClose, MdReceipt
} from 'react-icons/md'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const PERIODS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
]

// ─── Expense Modal ─────────────────────────────────────────────────
const ExpenseModal = ({ editExpense, onClose, onDone }) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: editExpense?.title || '',
    amount: editExpense?.amount || '',
    category: editExpense?.category || 'other',
    note: editExpense?.note || '',
    date: editExpense?.date || new Date().toISOString().split('T')[0],
  })

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return alert('Title and amount required!')
    setLoading(true)
    try {
      if (editExpense) {
        await API.put(`/reports/expenses/${editExpense.id}/`, form)
      } else {
        await API.post('/reports/expenses/', form)
      }
      onDone()
      onClose()
    } catch (err) {
      alert('Error saving expense!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">{editExpense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
        </div>
        <div className="p-4 space-y-3">
          <input placeholder="Title *" value={form.title} onChange={e => f('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Amount *" type="number" value={form.amount} onChange={e => f('amount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={form.category} onChange={e => f('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {['rent','salary','utilities','supplies','marketing','other'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <input type="date" value={form.date} onChange={e => f('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="Note (optional)" value={form.note} onChange={e => f('note', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
        </div>
        <div className="flex gap-3 p-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : editExpense ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Reports Component ────────────────────────────────────────
const Reports = () => {
  const [activeTab, setActiveTab] = useState('Sales')
  const [selectedDays, setSelectedDays] = useState(30)
  const [salesData, setSalesData] = useState(null)
  const [profitData, setProfitData] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [editExpense, setEditExpense] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [selectedDays])

  const fetchAll = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchSales(),
        fetchProfit(),
        fetchTopProducts(),
        fetchExpenses(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchSales = async () => {
    try {
      const res = await API.get(`/reports/sales/?days=${selectedDays}`)
      setSalesData(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchProfit = async () => {
    try {
      const res = await API.get(`/reports/profit/?days=${selectedDays}`)
      setProfitData(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchTopProducts = async () => {
    try {
      const res = await API.get(`/reports/top-products/?days=${selectedDays}`)
      setTopProducts(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchExpenses = async () => {
    try {
      const res = await API.get('/reports/expenses/')
      setExpenses(res.data)
    } catch (err) { console.error(err) }
  }

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await API.delete(`/reports/expenses/${id}/`)
      fetchExpenses()
    } catch (err) { alert('Error deleting expense!') }
  }

  // Format chart data
  const chartData = salesData?.chart_data?.map(d => ({
    date: d.period ? new Date(d.period).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : '',
    Sales: Number(d.total_sales || 0),
    Orders: Number(d.total_orders || 0),
  })) || []

  const pieData = profitData?.expenses_by_category?.map(e => ({
    name: e.category.charAt(0).toUpperCase() + e.category.slice(1),
    value: Number(e.total),
  })) || []

  return (
    <Layout>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-gray-500 text-sm">Sales, profit & analytics</p>
          </div>
          {/* Period Filter */}
          <div className="flex gap-2">
            {PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setSelectedDays(p.days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedDays === p.days ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdAttachMoney size={18} className="text-blue-600" />
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
            <p className="text-xl font-bold text-gray-800">
              Rs. {Number(salesData?.summary?.total_revenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdShoppingBag size={18} className="text-green-600" />
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {salesData?.summary?.total_orders || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdTrendingUp size={18} className="text-purple-600" />
              <p className="text-xs text-gray-500">Net Profit</p>
            </div>
            <p className={`text-xl font-bold ${Number(profitData?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs. {Number(profitData?.net_profit || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdReceipt size={18} className="text-red-500" />
              <p className="text-xs text-gray-500">Total Expenses</p>
            </div>
            <p className="text-xl font-bold text-gray-800">
              Rs. {Number(profitData?.total_expenses || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {['Sales', 'Profit & Loss', 'Top Products', 'Expenses'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Sales Tab ── */}
        {activeTab === 'Sales' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Sales Overview</h2>
            {chartData.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No sales data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => `Rs. ${Number(val).toLocaleString()}`} />
                  <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* ── Profit & Loss Tab ── */}
        {activeTab === 'Profit & Loss' && (
          <div className="grid grid-cols-2 gap-4">
            {/* P&L Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Profit & Loss</h2>
              <div className="space-y-3">
                {[
                  { label: 'Total Revenue', value: profitData?.total_revenue, color: 'text-blue-600' },
                  { label: 'Cost of Goods', value: profitData?.total_cogs, color: 'text-orange-500', minus: true },
                  { label: 'Gross Profit', value: profitData?.gross_profit, color: 'text-green-600', border: true },
                  { label: 'Total Expenses', value: profitData?.total_expenses, color: 'text-red-500', minus: true },
                  { label: 'Net Profit', value: profitData?.net_profit, color: Number(profitData?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600', border: true, bold: true },
                ].map((item, i) => (
                  <div key={i} className={`flex justify-between py-2 ${item.border ? 'border-t border-gray-200 mt-2' : ''}`}>
                    <span className={`text-sm text-gray-600 ${item.bold ? 'font-bold' : ''}`}>{item.label}</span>
                    <span className={`text-sm font-medium ${item.color} ${item.bold ? 'font-bold' : ''}`}>
                      {item.minus ? '- ' : ''}Rs. {Number(item.value || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Expenses by Category</h2>
              {pieData.length === 0 ? (
                <div className="text-center py-16 text-gray-400">No expenses data</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `Rs. ${Number(val).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ── Top Products Tab ── */}
        {activeTab === 'Top Products' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Qty Sold</th>
                  <th className="px-4 py-3 text-left">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400">No data for this period</td></tr>
                ) : topProducts.map((p, i) => (
                  <tr key={p.product__id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 font-medium">#{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.product__name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.total_qty}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">Rs. {Number(p.total_revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Expenses Tab ── */}
        {activeTab === 'Expenses' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                onClick={() => { setEditExpense(null); setExpenseModal(true) }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <MdAdd size={20} /> Add Expense
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400">No expenses added yet</td></tr>
                  ) : expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{exp.title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-red-500 font-medium">Rs. {Number(exp.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">{exp.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditExpense(exp); setExpenseModal(true) }} className="text-blue-600 hover:text-blue-800">
                            <MdEdit size={18} />
                          </button>
                          <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-500 hover:text-red-700">
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
      </div>

      {expenseModal && (
        <ExpenseModal
          editExpense={editExpense}
          onClose={() => { setExpenseModal(false); setEditExpense(null) }}
          onDone={fetchExpenses}
        />
      )}
    </Layout>
  )
}

export default Reports