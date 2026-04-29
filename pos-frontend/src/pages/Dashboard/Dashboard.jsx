import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import { MdAttachMoney, MdShoppingCart, MdPeople, MdInventory } from 'react-icons/md'

const Dashboard = () => {
  const [summary, setSummary] = useState({
    today_sales: 0,
    today_orders: 0,
  })
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [summaryRes, productsRes, customersRes] = await Promise.all([
        API.get('/pos/orders/summary/'),
        API.get('/products/products/'),
        API.get('/customers/customers/'),
      ])
      setSummary(summaryRes.data)
      setProducts(productsRes.data)
      setCustomers(customersRes.data)
    } catch (err) {
      console.error(err)
    }
  }

  const metrics = [
    {
      label: "Today's Sales",
      value: `Rs. ${summary.today_sales}`,
      icon: <MdAttachMoney size={28} />,
      bg: 'bg-blue-500',
    },
    {
      label: "Today's Orders",
      value: summary.today_orders,
      icon: <MdShoppingCart size={28} />,
      bg: 'bg-green-500',
    },
    {
      label: 'Total Products',
      value: products.length,
      icon: <MdInventory size={28} />,
      bg: 'bg-purple-500',
    },
    {
      label: 'Total Customers',
      value: customers.length,
      icon: <MdPeople size={28} />,
      bg: 'bg-orange-500',
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, Admin!</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
              <div className={`${m.bg} text-white p-3 rounded-lg`}>
                {m.icon}
              </div>
              <div>
                <p className="text-gray-500 text-sm">{m.label}</p>
                <p className="text-2xl font-bold text-gray-800">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Products</h2>
          {products.filter(p => p.is_low_stock).length === 0 ? (
            <p className="text-gray-500 text-sm">All products are well stocked! ✅</p>
          ) : (
            <div className="space-y-2">
              {products.filter(p => p.is_low_stock).map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-800 font-medium">{p.name}</span>
                  <span className="text-red-600 font-bold">{p.stock_qty} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}

export default Dashboard