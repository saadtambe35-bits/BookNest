import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { TrendingUp, ShoppingBag, BookOpen, AlertTriangle } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalBooks: 0, outOfStock: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/orders/all'),
      api.get('/books'),
    ]).then(([ordersRes, booksRes]) => {
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : []
      const books  = Array.isArray(booksRes.data)  ? booksRes.data  : []

      const totalRevenue = orders
        .filter(o => o.status !== 'CANCELLED')
        .reduce((s, o) => s + Number(o.total_amount), 0)

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalBooks:  books.length,
        outOfStock:  books.filter(b => b.stock === 0).length,
      })
      setRecentOrders(orders.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const STATUS_COLORS = {
    PLACED:    'bg-blue-500/20 text-blue-400',
    CONFIRMED: 'bg-amber-500/20 text-amber-400',
    SHIPPED:   'bg-purple-500/20 text-purple-400',
    DELIVERED: 'bg-teal-500/20 text-teal-400',
  }

  const KPI = [
    { label: 'Total Revenue',  value: `₹${stats.totalRevenue.toFixed(2)}`, Icon: TrendingUp,    color: 'text-teal-400',  bg: 'bg-teal-400/10' },
    { label: 'Total Orders',   value: stats.totalOrders,                   Icon: ShoppingBag,   color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Books in Catalog',value: stats.totalBooks,                   Icon: BookOpen,      color: 'text-blue-400',  bg: 'bg-blue-400/10' },
    { label: 'Out of Stock',   value: stats.outOfStock,                    Icon: AlertTriangle, color: 'text-red-400',   bg: 'bg-red-400/10' },
  ]

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-extrabold text-white mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">Welcome back! Here's what's happening at BookNest.</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {KPI.map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="glass-card p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className={`text-2xl font-extrabold ${color}`}>{loading ? '—' : value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h2 className="font-bold text-white">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Order ID</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:3}).map((_,i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({length:5}).map((__,j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No orders yet</td></tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-200">#{order.id}</td>
                    <td className="px-5 py-4 text-slate-400">{order.customer_name}</td>
                    <td className="px-5 py-4 font-semibold text-amber-400">₹{Number(order.total_amount).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`status-badge ${STATUS_COLORS[order.status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
