import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, max = 5, interactive = false, onChange }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(star => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          onClick={interactive && onChange ? () => onChange(star) : undefined}
          disabled={!interactive}
          className={`transition-transform ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        >
          <Star
            size={interactive ? 24 : 14}
            className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
          />
        </button>
      ))}
    </div>
  )
}
