import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Smartphone, Truck, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../api/axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const STEPS = ['Review Order', 'Payment']

const PAYMENT_OPTIONS = [
  { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', Icon: CreditCard },
  { id: 'UPI',  label: 'UPI',                  desc: 'GPay, PhonePe, Paytm',   Icon: Smartphone },
  { id: 'COD',  label: 'Cash on Delivery',     desc: 'Pay when delivered',     Icon: Truck },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, totalPrice, clearCart } = useCart()
  const { user } = useAuth()

  const [step,    setStep]    = useState(0)
  const [method,  setMethod]  = useState('CARD')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  if (!user) { navigate('/login'); return null }
  if (cart.length === 0) { navigate('/cart'); return null }

  const handlePlaceOrder = async () => {
    setError('')
    setLoading(true)
    try {
      const items = cart.map(({ book, quantity }) => ({
        bookId: book.id,
        quantity,
        price: book.price,
      }))

      const res = await api.post('/orders/checkout', {
        userId: user.id,
        items,
        paymentMethod: method,
      })

      clearCart()
      navigate(`/orders?success=${res.data.orderId}&ref=${res.data.transactionRef}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Order placement failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <h1 className="text-3xl font-extrabold text-white mb-2">Checkout</h1>
        <p className="text-slate-400 mb-8">Almost there! Complete your order.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${i === step ? 'bg-teal-600 text-white' : i < step ? 'text-teal-400' : 'text-slate-500'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border
                  ${i === step ? 'bg-white text-teal-600 border-white' : i < step ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-600 text-slate-500'}`}>
                  {i < step ? '✓' : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-navy-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 0: Review Order */}
        {step === 0 && (
          <div className="glass-card p-6 space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-white">Review Your Order</h2>
            {cart.map(({ book, quantity }) => (
              <div key={book.id} className="flex gap-4 items-center p-3 bg-navy-700/40 rounded-xl">
                <img src={book.cover_url} alt={book.title}
                  className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                  onError={e => { e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 truncate">{book.title}</p>
                  <p className="text-sm text-slate-400">{book.author}</p>
                  <p className="text-sm text-slate-400 mt-1">Qty: {quantity}</p>
                </div>
                <p className="font-bold text-amber-400 flex-shrink-0">₹{(book.price * quantity).toFixed(2)}</p>
              </div>
            ))}
            <div className="border-t border-white/10 pt-4 flex justify-between text-lg font-extrabold text-white">
              <span>Total</span>
              <span className="text-amber-400">₹{totalPrice.toFixed(2)}</span>
            </div>
            <button onClick={() => setStep(1)} className="btn-primary w-full py-3 mt-2">
              Continue to Payment →
            </button>
          </div>
        )}

        {/* Step 1: Payment */}
        {step === 1 && (
          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-6">Select Payment Method</h2>

            <div className="space-y-3 mb-8">
              {PAYMENT_OPTIONS.map(({ id, label, desc, Icon }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                    ${method === id
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-white/10 hover:border-white/30 bg-navy-700/30'}`}
                >
                  <div className={`p-2.5 rounded-xl ${method === id ? 'bg-teal-600' : 'bg-navy-700'}`}>
                    <Icon size={20} className={method === id ? 'text-white' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className={`font-semibold ${method === id ? 'text-white' : 'text-slate-300'}`}>{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  {method === id && <CheckCircle size={18} className="ml-auto text-teal-400" />}
                </button>
              ))}
            </div>

            {/* Order total summary */}
            <div className="bg-navy-700/30 rounded-xl p-4 mb-6 flex justify-between items-center">
              <span className="text-slate-400">Amount to pay</span>
              <span className="text-2xl font-extrabold text-amber-400">₹{totalPrice.toFixed(2)}</span>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-ghost flex-1 py-3">← Back</button>
              <button onClick={handlePlaceOrder} disabled={loading} className="btn-amber flex-1 py-3 text-base">
                {loading ? 'Placing Order...' : '🔒 Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
