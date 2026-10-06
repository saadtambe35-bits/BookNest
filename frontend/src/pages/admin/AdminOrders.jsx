import { useState, useEffect } from 'react'
import api from '../../api/axios'

const STATUSES = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

const STATUS_COLORS = {
  PLACED:    'bg-blue-500/20 text-blue-400',
  CONFIRMED: 'bg-amber-500/20 text-amber-400',
  SHIPPED:   'bg-purple-500/20 text-purple-400',
  DELIVERED: 'bg-teal-500/20 text-teal-400',
}

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')
  const [toast,   setToast]   = useState('')
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/orders/all')
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      showToast(`✅ Order #${orderId} → ${newStatus}`)
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Update failed'))
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Order Management</h1>
        <p className="text-slate-400 text-sm">{orders.length} total orders</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-5 py-3 text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['ALL', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all
              ${filter === s
                ? 'bg-teal-600 border-teal-600 text-white'
                : 'border-white/15 text-slate-400 hover:border-white/30 hover:text-slate-200'}`}>
            {s}
            {s !== 'ALL' && (
              <span className="ml-1.5 opacity-60">
                ({orders.filter(o => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Order ID</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Items</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Current Status</th>
                <th className="text-left px-4 py-3">Update Status</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({length:7}).map((__,j) => (
                      <td key={j} className="px-4 py-4"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">No orders in this category</td></tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-200">#{order.id}</td>
                    <td className="px-4 py-4 text-slate-400">{order.customer_name}</td>
                    <td className="px-4 py-4 text-slate-500 hidden md:table-cell">{order.items?.length || 0} items</td>
                    <td className="px-4 py-4 font-bold text-amber-400">₹{Number(order.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <span className={`status-badge ${STATUS_COLORS[order.status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        disabled={updating === order.id || order.status === 'DELIVERED'}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className="bg-navy-700 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-slate-300
                                   focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-slate-500 hidden md:table-cell">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
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
