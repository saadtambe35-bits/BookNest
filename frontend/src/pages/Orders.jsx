import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Package, CheckCircle, ChevronDown } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import OrderStatusStepper from '../components/OrderStatusStepper'

const STATUS_COLORS = {
  PLACED:    'bg-blue-500/20 text-blue-400',
  CONFIRMED: 'bg-amber-500/20 text-amber-400',
  SHIPPED:   'bg-purple-500/20 text-purple-400',
  DELIVERED: 'bg-teal-500/20 text-teal-400',
}

export default function Orders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const successOrderId = searchParams.get('success')
  const transactionRef = searchParams.get('ref')

  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(successOrderId ? Number(successOrderId) : null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get(`/orders/my-orders?userId=${user.id}`)
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          {Array.from({length:3}).map((_,i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <h1 className="text-3xl font-extrabold text-white mb-2">My Orders</h1>
        <p className="text-slate-400 mb-8">Track your purchases and order status below.</p>

        {/* Success banner */}
        {successOrderId && (
          <div className="flex items-start gap-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl p-5 mb-8 animate-fade-in">
            <CheckCircle size={22} className="text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-teal-300">Order #{successOrderId} placed successfully!</p>
              <p className="text-sm text-slate-400 mt-0.5">Transaction Ref: <code className="text-slate-300">{transactionRef}</code></p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <Package size={56} className="text-slate-600 mx-auto mb-5" />
            <p className="text-xl text-slate-400 font-medium">No orders yet</p>
            <p className="text-slate-500 mb-6">Explore our catalog and place your first order!</p>
            <button onClick={() => navigate('/')} className="btn-primary">Shop Now</button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="glass-card overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => setExpanded(e => e === order.id ? null : order.id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-xs text-slate-500">Order ID</span>
                      <p className="font-bold text-slate-100">#{order.id}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Date</span>
                      <p className="font-medium text-slate-300 text-sm">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Total</span>
                      <p className="font-bold text-amber-400">₹{Number(order.total_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className={`status-badge ${STATUS_COLORS[order.status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform flex-shrink-0 ml-2 ${expanded === order.id ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded: stepper + items */}
                {expanded === order.id && (
                  <div className="border-t border-white/10 px-5 pb-5 animate-fade-in">
                    <div className="my-4">
                      <OrderStatusStepper status={order.status} />
                    </div>

                    {order.items?.length > 0 && (
                      <div className="space-y-3 mt-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Items</p>
                        {order.items.map(item => (
                          <div key={item.id} className="flex gap-3 items-center p-3 bg-navy-700/30 rounded-xl">
                            <img src={item.cover_url} alt={item.title}
                              className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                              onError={e => { e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop' }} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-200 text-sm truncate">{item.title}</p>
                              <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-bold text-amber-400">₹{Number(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
