import { useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, totalPrice } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    navigate('/login')
    return null
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <ShoppingBag size={64} className="text-slate-600 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-slate-300 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Add some great books to get started!</p>
          <button onClick={() => navigate('/')} className="btn-primary">Browse Books</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors mb-6 text-sm">
          <ArrowLeft size={16} /> Continue Shopping
        </button>

        <h1 className="text-3xl font-extrabold text-white mb-8">
          Shopping Cart <span className="text-slate-500 text-xl font-normal">({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
        </h1>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Cart Items */}
          <div className="space-y-4">
            {cart.map(({ book, quantity }) => (
              <div key={book.id} className="glass-card p-5 flex gap-5 items-start">
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-20 h-28 object-cover rounded-xl flex-shrink-0 shadow-lg"
                  onError={e => { e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop' }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 mb-0.5 truncate">{book.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{book.author}</p>
                  <div className="flex items-center justify-between">
                    {/* Qty controls */}
                    <div className="flex items-center glass-card rounded-xl overflow-hidden border border-white/10">
                      <button onClick={() => updateQuantity(book.id, quantity - 1)}
                        className="px-3 py-2 hover:bg-white/10 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="px-4 py-2 font-bold min-w-[2rem] text-center text-sm">{quantity}</span>
                      <button onClick={() => updateQuantity(book.id, Math.min(book.stock, quantity + 1))}
                        className="px-3 py-2 hover:bg-white/10 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-amber-400">₹{(book.price * quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(book.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="glass-card p-6 h-fit sticky top-24">
            <h2 className="text-lg font-bold text-white mb-5">Order Summary</h2>
            <div className="space-y-3 mb-5">
              {cart.map(({ book, quantity }) => (
                <div key={book.id} className="flex justify-between text-sm text-slate-400">
                  <span className="truncate max-w-[160px]">{book.title} ×{quantity}</span>
                  <span>₹{(book.price * quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between text-lg font-extrabold text-white">
                <span>Total</span>
                <span className="text-amber-400">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-amber w-full py-3 text-base">
              Proceed to Checkout →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
