import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdBarChart, MdTrendingUp, MdDownload,
  MdPictureAsPdf, MdTableChart, MdRefresh, MdCalendarToday,
  MdInventory, MdPeople, MdShoppingCart, MdReceiptLong,
  MdArrowUpward, MdArrowDownward, MdStar, MdLocalShipping,
  MdAccountBalance, MdSearch
} from 'react-icons/md'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

// ─── Design Tokens (matching POS blue theme) ──────────────────────
const BLUE       = '#1a56db'
const BLUE_DARK  = '#1e429f'
const BLUE_LIGHT = '#ebf5ff'
const GRAY_BG    = '#f3f4f6'
const CHART_COLORS = ['#1a56db', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4']

// ─── Period Options ───────────────────────────────────────────────
const PERIODS = [
  { key: 'today',   label: 'Today' },
  { key: 'week',    label: 'This Week' },
  { key: 'month',   label: 'This Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year',    label: 'This Year' },
  { key: 'custom',  label: 'Custom' },
]

const REPORT_TABS = [
  { key: 'overview',   label: 'Overview',          icon: MdBarChart,       color: 'blue' },
  { key: 'sales',      label: 'Sales Trend',        icon: MdTrendingUp,     color: 'green' },
  { key: 'products',   label: 'Best Sellers',       icon: MdStar,           color: 'yellow' },
  { key: 'profit',     label: 'Profit Margins',     icon: MdAccountBalance, color: 'purple' },
  { key: 'suppliers',  label: 'Suppliers',          icon: MdLocalShipping,  color: 'orange' },
  { key: 'customers',  label: 'Customers',          icon: MdPeople,         color: 'pink' },
  { key: 'tax',        label: 'Tax Report',         icon: MdReceiptLong,    color: 'red' },
]

// Icon bg colors matching POS style
const ICON_STYLES = {
  blue:   { bg: '#dbeafe', color: '#1d4ed8' },
  green:  { bg: '#d1fae5', color: '#065f46' },
  yellow: { bg: '#fef3c7', color: '#92400e' },
  purple: { bg: '#ede9fe', color: '#5b21b6' },
  orange: { bg: '#ffedd5', color: '#9a3412' },
  pink:   { bg: '#fce7f3', color: '#9d174d' },
  red:    { bg: '#fee2e2', color: '#991b1b' },
  teal:   { bg: '#ccfbf1', color: '#134e4a' },
}

// ─── Helpers ──────────────────────────────────────────────────────
const fmt  = n => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`
const pct  = n => `${Number(n || 0).toFixed(1)}%`
const fmtDate = d => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })

const exportCSV = (rows, filename) => {
  if (!rows?.length) return
  const keys = Object.keys(rows[0])
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
  a.click(); URL.revokeObjectURL(a.href)
}

const exportPDF = title => {
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>${title}</title>
    <style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f3f4f6}</style></head>
    <body><h2>${title}</h2>${document.getElementById('report-table')?.outerHTML || '<p>No data</p>'}</body></html>`)
  win.document.close(); win.print()
}

// ─── Stat Card (POS style) ────────────────────────────────────────
const StatCard = ({ label, value, sub, delta, icon: Icon, color = 'blue' }) => {
  const style = ICON_STYLES[color]
  const up = delta >= 0
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</span>
        <span style={{ background: style.bg, borderRadius: 10, padding: '8px', display: 'flex', alignItems: 'center' }}>
          <Icon size={20} style={{ color: style.color }} />
        </span>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      {delta !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: up ? '#059669' : '#dc2626' }}>
          {up ? <MdArrowUpward size={13} /> : <MdArrowDownward size={13} />}
          {Math.abs(delta)}% vs last period
        </div>
      )}
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px 24px', ...style }}>
    {children}
  </div>
)

// ─── Section Title ────────────────────────────────────────────────
const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{children}</h3>
    {sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>{sub}</p>}
  </div>
)

// ─── Custom Tooltip ───────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1f2937', color: '#fff', fontSize: 12, borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      <p style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {typeof p.value === 'number' && p.value > 999 ? fmt(p.value) : p.value}</p>
      ))}
    </div>
  )
}

// ─── Table Styles ─────────────────────────────────────────────────
const Th = ({ children, right }) => (
  <th style={{ padding: '10px 16px', textAlign: right ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
    {children}
  </th>
)
const Td = ({ children, right, style = {} }) => (
  <td style={{ padding: '12px 16px', textAlign: right ? 'right' : 'left', fontSize: 13, color: '#374151', borderBottom: '1px solid #f3f4f6', ...style }}>
    {children}
  </td>
)

// ─── Export Buttons ───────────────────────────────────────────────
const ExportBtn = ({ onClick, icon: Icon, label, primary }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: primary ? BLUE : '#fff', color: primary ? '#fff' : '#374151',
    boxShadow: primary ? 'none' : '0 0 0 1px #e5e7eb',
  }}>
    <Icon size={14} /> {label}
  </button>
)

// ─── Badge ────────────────────────────────────────────────────────
const Badge = ({ value, good, warn }) => {
  const bg    = value >= good ? '#d1fae5' : value >= warn ? '#fef3c7' : '#fee2e2'
  const color = value >= good ? '#065f46' : value >= warn ? '#92400e' : '#991b1b'
  return <span style={{ background: bg, color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{pct(value)}</span>
}

// ═══════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ─── Overview Tab ─────────────────────────────────────────────────
const OverviewTab = ({ data }) => {
  if (!data) return <EmptyState text="Loading overview…" />
  const salesTrend  = data.sales_trend  || []
  const categoryMix = data.category_mix || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <StatCard label="Total Revenue"   value={fmt(data.total_revenue)}   delta={data.revenue_delta}  icon={MdTrendingUp}    color="blue" />
        <StatCard label="Total Orders"    value={data.total_orders}         delta={data.orders_delta}   icon={MdShoppingCart}  color="green" />
        <StatCard label="Items Sold"      value={data.items_sold}           sub="units"                 icon={MdInventory}     color="yellow" />
        <StatCard label="Avg Order Value" value={fmt(data.avg_order_value)} delta={data.aov_delta}      icon={MdBarChart}      color="purple" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Daily revenue for selected period">Revenue Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BLUE} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BLUE} fill="url(#revGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle sub="Revenue by category">Category Mix</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                {categoryMix.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

// ─── Sales Trend Tab ──────────────────────────────────────────────
const SalesTrendTab = ({ data }) => {
  const rows = data?.daily || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle sub="Revenue vs Cost of Goods Sold">Revenue vs COGS</SectionTitle>
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill={BLUE}      radius={[4,4,0,0]} />
            <Bar dataKey="cogs"    name="COGS"    fill="#f59e0b"   radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>Daily Breakdown</SectionTitle>
          <ExportBtn onClick={() => exportCSV(rows, 'sales_trend.csv')} icon={MdTableChart} label="Export CSV" />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} id="report-table">
          <thead><tr>
            <Th>Date</Th><Th right>Orders</Th><Th right>Revenue</Th>
            <Th right>COGS</Th><Th right>Gross Profit</Th><Th right>Margin</Th>
          </tr></thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#d1d5db' }}>No data for this period</td></tr>
              : rows.map((r, i) => (
                <tr key={i} style={{ ':hover': { background: '#f9fafb' } }}>
                  <Td style={{ fontWeight: 600 }}>{r.label}</Td>
                  <Td right>{r.orders}</Td>
                  <Td right style={{ fontWeight: 600 }}>{fmt(r.revenue)}</Td>
                  <Td right style={{ color: '#9ca3af' }}>{fmt(r.cogs)}</Td>
                  <Td right style={{ color: '#059669', fontWeight: 600 }}>{fmt(r.gross_profit)}</Td>
                  <Td right><Badge value={r.margin} good={20} warn={10} /></Td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Best Sellers Tab ─────────────────────────────────────────────
const BestSellersTab = ({ data }) => {
  const rows = data?.best_sellers || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle sub="Top 10 products by revenue">Best Selling Products</SectionTitle>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={rows.slice(0,10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={140} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="revenue" name="Revenue" radius={[0,4,4,0]}>
              {rows.slice(0,10).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>Product Ranking</SectionTitle>
          <ExportBtn onClick={() => exportCSV(rows, 'best_sellers.csv')} icon={MdTableChart} label="Export CSV" />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <Th>Rank</Th><Th>Product</Th><Th>Category</Th>
            <Th right>Units Sold</Th><Th right>Revenue</Th><Th right>Profit</Th><Th right>Margin</Th>
          </tr></thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#d1d5db' }}>No data</td></tr>
              : rows.map((r, i) => (
                <tr key={i}>
                  <Td>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#f3f4f6',
                      color: i < 3 ? '#fff' : '#6b7280'
                    }}>{i + 1}</span>
                  </Td>
                  <Td style={{ fontWeight: 600 }}>{r.name}</Td>
                  <Td><span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>{r.category}</span></Td>
                  <Td right>{r.units_sold}</Td>
                  <Td right style={{ fontWeight: 600 }}>{fmt(r.revenue)}</Td>
                  <Td right style={{ color: '#059669', fontWeight: 600 }}>{fmt(r.profit)}</Td>
                  <Td right><Badge value={r.margin} good={25} warn={10} /></Td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Profit Tab ───────────────────────────────────────────────────
const ProfitTab = ({ data }) => {
  const rows   = data?.profit_by_product || []
  const sorted = [...rows].sort((a, b) => b.margin - a.margin)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <StatCard label="Gross Profit" value={fmt(data?.gross_profit)} icon={MdTrendingUp}     color="green" />
        <StatCard label="Avg Margin"   value={pct(data?.avg_margin)}   icon={MdBarChart}       color="blue" />
        <StatCard label="Net Profit"   value={fmt(data?.net_profit)}   icon={MdAccountBalance} color="purple" />
      </div>
      <Card>
        <SectionTitle sub="Margin % per product">Profit Margin Distribution</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sorted.slice(0,15)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} unit="%" />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="margin" name="Margin %" radius={[4,4,0,0]}>
              {sorted.slice(0,15).map((r, i) => (
                <Cell key={i} fill={r.margin >= 25 ? '#10b981' : r.margin >= 10 ? '#f59e0b' : '#f43f5e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>Margin per Product</SectionTitle>
          <ExportBtn onClick={() => exportCSV(sorted, 'profit_margins.csv')} icon={MdTableChart} label="Export CSV" />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <Th>Product</Th><Th right>Cost Price</Th><Th right>Sell Price</Th>
            <Th right>Units Sold</Th><Th right>Revenue</Th><Th right>Gross Profit</Th><Th right>Margin %</Th>
          </tr></thead>
          <tbody>
            {sorted.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#d1d5db' }}>No data</td></tr>
              : sorted.map((r, i) => (
                <tr key={i}>
                  <Td style={{ fontWeight: 500 }}>{r.name}</Td>
                  <Td right style={{ color: '#9ca3af' }}>{fmt(r.cost_price)}</Td>
                  <Td right>{fmt(r.sell_price)}</Td>
                  <Td right>{r.units_sold}</Td>
                  <Td right style={{ fontWeight: 600 }}>{fmt(r.revenue)}</Td>
                  <Td right style={{ color: '#059669', fontWeight: 600 }}>{fmt(r.gross_profit)}</Td>
                  <Td right><Badge value={r.margin} good={25} warn={10} /></Td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Supplier Tab ─────────────────────────────────────────────────
const SupplierTab = ({ data }) => {
  const rows = data?.supplier_purchases || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle sub="Total purchased per supplier">Supplier Purchase Volume</SectionTitle>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="supplier" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="total_amount" name="Total Amount" radius={[4,4,0,0]}>
              {rows.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>Supplier Wise Detail</SectionTitle>
          <ExportBtn onClick={() => exportCSV(rows, 'supplier_report.csv')} icon={MdTableChart} label="Export CSV" />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <Th>Supplier</Th><Th right>Total Orders</Th><Th right>Items Received</Th>
            <Th right>Total Amount</Th><Th right>Pending POs</Th><Th>Last Order</Th>
          </tr></thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#d1d5db' }}>No supplier data</td></tr>
              : rows.map((r, i) => (
                <tr key={i}>
                  <Td style={{ fontWeight: 600 }}>{r.supplier}</Td>
                  <Td right>{r.total_orders}</Td>
                  <Td right>{r.items_received}</Td>
                  <Td right style={{ fontWeight: 600 }}>{fmt(r.total_amount)}</Td>
                  <Td right>
                    <span style={{ background: r.pending_pos > 0 ? '#fef3c7' : '#f3f4f6', color: r.pending_pos > 0 ? '#92400e' : '#9ca3af', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                      {r.pending_pos}
                    </span>
                  </Td>
                  <Td style={{ color: '#9ca3af', fontSize: 12 }}>{r.last_order ? fmtDate(r.last_order) : '—'}</Td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Customer Tab ─────────────────────────────────────────────────
const CustomerTab = ({ data }) => {
  const rows = data?.customer_history || []
  const [search, setSearch] = useState('')
  const filtered = rows.filter(r => r.customer?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
          <input
            placeholder="Search customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 38, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
        </div>
        <ExportBtn onClick={() => exportCSV(filtered, 'customer_history.csv')} icon={MdTableChart} label="Export CSV" />
      </div>

      <Card style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <Th>Customer</Th><Th right>Total Orders</Th><Th right>Total Spent</Th>
            <Th right>Avg Order</Th><Th>Last Purchase</Th><Th>Type</Th>
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#d1d5db' }}>No customer data</td></tr>
              : filtered.map((r, i) => (
                <tr key={i}>
                  <Td>
                    <p style={{ fontWeight: 600, margin: 0 }}>{r.customer || 'Walk-in Customer'}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{r.phone || ''}</p>
                  </Td>
                  <Td right>{r.total_orders}</Td>
                  <Td right style={{ fontWeight: 700 }}>{fmt(r.total_spent)}</Td>
                  <Td right style={{ color: '#6b7280' }}>{fmt(r.avg_order)}</Td>
                  <Td style={{ color: '#9ca3af', fontSize: 12 }}>{r.last_purchase ? fmtDate(r.last_purchase) : '—'}</Td>
                  <Td>
                    <span style={{
                      background: r.customer_type === 'wholesale' ? '#ccfbf1' : '#f3f4f6',
                      color:      r.customer_type === 'wholesale' ? '#134e4a' : '#6b7280',
                      borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600
                    }}>
                      {r.customer_type === 'wholesale' ? 'Wholesale' : 'Retail'}
                    </span>
                  </Td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Tax Tab ──────────────────────────────────────────────────────
const TaxTab = ({ data }) => {
  const rows = data?.tax_rows || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <StatCard label="Taxable Sales" value={fmt(data?.taxable_sales)} icon={MdReceiptLong}   color="yellow" />
        <StatCard label="Tax Collected" value={fmt(data?.tax_collected)} icon={MdAccountBalance} color="blue" />
        <StatCard label="Net After Tax" value={fmt(data?.net_after_tax)} icon={MdTrendingUp}     color="green" />
      </div>
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle sub="Monthly tax breakdown">Tax Summary</SectionTitle>
          <div style={{ display: 'flex', gap: 8 }}>
            <ExportBtn onClick={() => exportCSV(rows, 'tax_report.csv')} icon={MdTableChart} label="CSV" />
            <ExportBtn onClick={() => exportPDF('Tax Report')} icon={MdPictureAsPdf} label="PDF" primary />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} id="report-table">
          <thead><tr>
            <Th>Period</Th><Th right>Gross Sales</Th><Th right>Discounts</Th>
            <Th right>Taxable Amount</Th><Th right>Tax Rate</Th><Th right>Tax Amount</Th><Th right>Net Amount</Th>
          </tr></thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#d1d5db' }}>No tax data</td></tr>
              : rows.map((r, i) => (
                <tr key={i}>
                  <Td style={{ fontWeight: 500 }}>{r.period}</Td>
                  <Td right>{fmt(r.gross_sales)}</Td>
                  <Td right style={{ color: '#dc2626' }}>{fmt(r.discounts)}</Td>
                  <Td right>{fmt(r.taxable_amount)}</Td>
                  <Td right style={{ color: '#6b7280' }}>{pct(r.tax_rate)}</Td>
                  <Td right style={{ fontWeight: 600, color: '#d97706' }}>{fmt(r.tax_amount)}</Td>
                  <Td right style={{ fontWeight: 700 }}>{fmt(r.net_amount)}</Td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Empty / Loading ──────────────────────────────────────────────
const EmptyState = ({ text }) => (
  <div style={{ textAlign: 'center', padding: '60px 0', color: '#d1d5db', fontSize: 14 }}>{text}</div>
)

// ═══════════════════════════════════════════════════════════════════
// MAIN REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════
const Reports = () => {
  const [activeTab, setActiveTab]   = useState('overview')
  const [period, setPeriod]         = useState('month')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [reportData, setReportData] = useState({})

  const fetchReport = useCallback(async (tab = activeTab) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (period === 'custom' && dateFrom && dateTo) {
        params.set('date_from', dateFrom)
        params.set('date_to',   dateTo)
      }
      const res = await API.get(`/reports/${tab}/?${params}`)
      setReportData(prev => ({ ...prev, [tab]: res.data }))
    } catch (err) {
      console.error('Report fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, period, dateFrom, dateTo])

  useEffect(() => { fetchReport(activeTab) }, [activeTab, period])

  const data       = reportData[activeTab]
  const activeTabObj = REPORT_TABS.find(t => t.key === activeTab)

  return (
    <Layout>
      <div style={{ background: GRAY_BG, minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Reports</h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Analytics & business insights</p>
          </div>

          {/* Period + Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Period Pills */}
            <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: 10, padding: 4, gap: 2 }}>
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all .15s',
                    background: period === p.key ? '#fff' : 'transparent',
                    color:      period === p.key ? '#111827' : '#6b7280',
                    boxShadow:  period === p.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            {period === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none' }} />
                <span style={{ color: '#9ca3af', fontSize: 12 }}>to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none' }} />
                <button onClick={() => fetchReport()} style={{ padding: '7px 14px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Apply
                </button>
              </div>
            )}

            {/* Refresh */}
            <button onClick={() => fetchReport()} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', opacity: loading ? .6 : 1 }}>
              <MdRefresh size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ── Tab Bar (POS style — blue active pill) ─────────────── */}
        <div style={{ display: 'flex', gap: 4, background: '#e5e7eb', borderRadius: 12, padding: '5px', marginBottom: 20, width: 'fit-content', flexWrap: 'wrap' }}>
          {REPORT_TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                  background: active ? BLUE : 'transparent',
                  color:      active ? '#fff' : '#6b7280',
                  boxShadow:  active ? '0 2px 6px rgba(26,86,219,.3)' : 'none',
                }}>
                <Icon size={15} /> {label}
                {active && <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 20, padding: '1px 7px', fontSize: 11 }}>●</span>}
              </button>
            )
          })}
        </div>

        {/* ── Content ────────────────────────────────────────────── */}
        <div key={activeTab + period}>
          {loading && !data ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ width: 36, height: 36, border: '4px solid #e5e7eb', borderTop: `4px solid ${BLUE}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <>
              {activeTab === 'overview'  && <OverviewTab    data={data} />}
              {activeTab === 'sales'     && <SalesTrendTab  data={data} />}
              {activeTab === 'products'  && <BestSellersTab data={data} />}
              {activeTab === 'profit'    && <ProfitTab      data={data} />}
              {activeTab === 'suppliers' && <SupplierTab    data={data} />}
              {activeTab === 'customers' && <CustomerTab    data={data} />}
              {activeTab === 'tax'       && <TaxTab         data={data} />}
            </>
          )}
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
          table tr:hover td { background: #f9fafb; }
        `}</style>
      </div>
    </Layout>
  )
}

export default Reports