import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function BookCard({ book }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()

  const avgRating = book.reviews?.length
    ? (book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length).toFixed(1)
    : null

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    addToCart(book, 1)
  }

  return (
    <div
      onClick={() => navigate(`/book/${book.id}`)}
      className="glass-card cursor-pointer group transition-all duration-300 hover:scale-[1.02]
                 hover:shadow-2xl hover:shadow-teal-900/20 hover:border-teal-500/30 overflow-hidden"
    >
      {/* Cover Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={book.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={e => {
            e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'
          }}
        />
        {/* Stock badge */}
        <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full
          ${book.stock > 0 ? 'bg-teal-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
          {book.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </div>
        {/* Category badge */}
        <div className="absolute top-3 left-3 bg-navy-900/80 text-teal-400 text-xs font-semibold
                        px-2 py-1 rounded-full backdrop-blur-sm">
          {book.category_name}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-slate-100 leading-tight mb-1 line-clamp-2 group-hover:text-teal-400 transition-colors">
          {book.title}
        </h3>
        <p className="text-sm text-slate-400 mb-3">{book.author}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-extrabold text-amber-400">
              ₹{Number(book.price).toFixed(2)}
            </span>
            {avgRating && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-slate-400">{avgRating}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={book.stock === 0}
            className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <ShoppingCart size={13} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
