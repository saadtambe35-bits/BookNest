import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Package, Star } from 'lucide-react'
import api from '../api/axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()

  const [book, setBook]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded]       = useState(false)

  // Review form state
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewMsg, setReviewMsg]   = useState('')

  useEffect(() => {
    setLoading(true)
    api.get(`/books/${id}`)
      .then(r => setBook(r.data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return }
    addToCart(book, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!rating) { setReviewMsg('Please select a rating.'); return }
    setSubmitting(true)
    try {
      await api.post('/reviews', { book_id: book.id, user_id: user.id, rating, comment })
      setReviewMsg('✅ Review submitted!')
      setRating(0)
      setComment('')
      // Refresh book to get updated reviews
      const refreshed = await api.get(`/books/${id}`)
      setBook(refreshed.data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit review'
      setReviewMsg('❌ ' + msg)
    } finally {
      setSubmitting(false)
    }
  }

  const avgRating = book?.reviews?.length
    ? (book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length).toFixed(1)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="skeleton h-[420px] rounded-2xl" />
            <div className="space-y-4">
              <div className="skeleton h-8 w-3/4 rounded" />
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-24 w-full rounded" />
              <div className="skeleton h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📕</p>
          <p className="text-xl text-slate-400">Book not found</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-5">Back to Catalog</button>
        </div>
      </div>
    )
  }

  const alreadyReviewed = book.reviews?.some(r => r.user_id === user?.id)

  return (
    <div className="min-h-screen pt-24 pb-12 animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors mb-6 text-sm">
          <ArrowLeft size={16} /> Back to catalog
        </button>

        {/* Book hero */}
        <div className="glass-card p-6 md:p-10 mb-8">
          <div className="grid md:grid-cols-[280px_1fr] gap-10">
            {/* Cover */}
            <div className="flex-shrink-0">
              <img
                src={book.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'}
                alt={book.title}
                className="w-full h-72 md:h-auto md:max-h-96 object-cover rounded-xl shadow-2xl"
                onError={e => { e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop' }}
              />
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full self-start mb-3">
                {book.category_name}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">{book.title}</h1>
              <p className="text-slate-400 text-lg mb-1">by <span className="text-slate-300 font-medium">{book.author}</span></p>

              {/* Rating */}
              {book.reviews?.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="text-sm text-slate-400">{avgRating} ({book.reviews.length} reviews)</span>
                </div>
              )}

              <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{book.description}</p>

              {/* Price & Stock */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-extrabold text-amber-400">₹{Number(book.price).toFixed(2)}</span>
                <div className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full
                  ${book.stock > 0 ? 'bg-teal-500/15 text-teal-400' : 'bg-red-500/15 text-red-400'}`}>
                  <Package size={14} />
                  {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
                </div>
              </div>

              {/* Quantity + Add to Cart */}
              {book.stock > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center glass-card rounded-xl overflow-hidden border border-white/10">
                    <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="px-4 py-2.5 hover:bg-white/10 transition-colors text-lg font-bold">−</button>
                    <span className="px-4 py-2.5 font-bold min-w-[2.5rem] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(book.stock, q+1))} className="px-4 py-2.5 hover:bg-white/10 transition-colors text-lg font-bold">+</button>
                  </div>
                  <button onClick={handleAddToCart} className={`btn-primary flex items-center gap-2 flex-1 justify-center ${added ? '!bg-teal-500' : ''}`}>
                    <ShoppingCart size={16} />
                    {added ? '✓ Added to Cart!' : 'Add to Cart'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Star size={18} className="text-amber-400" /> Customer Reviews
            {book.reviews?.length > 0 && (
              <span className="text-sm font-normal text-slate-400 ml-1">({book.reviews.length})</span>
            )}
          </h2>

          {/* Review list */}
          {book.reviews?.length > 0 ? (
            <div className="space-y-4 mb-8">
              {book.reviews.map(r => (
                <div key={r.id} className="p-4 bg-navy-700/40 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white">
                        {r.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{r.user_name}</span>
                    </div>
                    <StarRating rating={r.rating} />
                  </div>
                  <p className="text-sm text-slate-400">{r.comment}</p>
                  <p className="text-xs text-slate-600 mt-2">{new Date(r.created_at).toLocaleDateString('en-IN', { year:'numeric',month:'short',day:'numeric' })}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mb-6">No reviews yet. Be the first to review!</p>
          )}

          {/* Add review form */}
          {user && user.role === 'CUSTOMER' && !alreadyReviewed && (
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-base font-semibold text-slate-200 mb-4">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Your Rating</label>
                  <StarRating rating={rating} interactive onChange={setRating} />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Comment (optional)</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="Share your thoughts..."
                    className="input-field resize-none"
                  />
                </div>
                {reviewMsg && <p className={`text-sm ${reviewMsg.startsWith('✅') ? 'text-teal-400' : 'text-red-400'}`}>{reviewMsg}</p>}
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
          {alreadyReviewed && (
            <p className="text-sm text-slate-500 border-t border-white/10 pt-4">You have already reviewed this book.</p>
          )}
          {!user && (
            <p className="text-sm text-slate-500 border-t border-white/10 pt-4">
              <button onClick={() => navigate('/login')} className="text-teal-400 underline">Sign in</button> to leave a review.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
