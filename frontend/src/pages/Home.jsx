import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import BookCard from '../components/BookCard'

const PAGE_SIZE = 12

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="skeleton h-52 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center pt-1">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [books, setBooks]           = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)

  const search     = searchParams.get('search')     || ''
  const categoryId = searchParams.get('category_id') || ''

  // Load categories once
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  // Reload books on filter change
  useEffect(() => {
    setLoading(true)
    setPage(1)
    const params = {}
    if (search)     params.search      = search
    if (categoryId) params.category_id = categoryId

    api.get('/books', { params })
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : []
        setBooks(data)
        setTotal(data.length)
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false))
  }, [search, categoryId])

  const paginated = books.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val)
    else next.delete(key)
    setSearchParams(next)
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero Banner */}
        <div className="relative overflow-hidden glass-card mb-8 p-8 md:p-12
                        bg-gradient-to-r from-teal-900/40 via-navy-800/60 to-navy-900/40">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
              Discover Your Next<br />
              <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">
                Great Read
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Explore thousands of titles across fiction, academic, technical, and self-help genres.
            </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute -right-5 bottom-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filter */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-6">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={16} className="text-teal-400" />
                <h2 className="font-semibold text-slate-200 text-sm">Filters</h2>
              </div>

              {/* Search box */}
              <div className="mb-5">
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Search</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Title or author"
                    defaultValue={search}
                    onKeyDown={e => { if (e.key === 'Enter') setFilter('search', e.target.value) }}
                    className="input-field pl-8 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Category filter */}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Category</label>
                <div className="space-y-1">
                  <button
                    onClick={() => setFilter('category_id', '')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                      ${!categoryId ? 'bg-teal-600/30 text-teal-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    All Categories
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setFilter('category_id', String(c.id))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        ${categoryId === String(c.id) ? 'bg-teal-600/30 text-teal-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-400">
                {loading ? 'Loading...' : `Showing ${paginated.length} of ${total} books`}
              </p>
              {/* Mobile category pills */}
              <div className="flex gap-2 overflow-x-auto lg:hidden pb-1">
                <button onClick={() => setFilter('category_id', '')}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors
                    ${!categoryId ? 'bg-teal-600 border-teal-600 text-white' : 'border-white/20 text-slate-400'}`}>
                  All
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setFilter('category_id', String(c.id))}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors
                      ${categoryId === String(c.id) ? 'bg-teal-600 border-teal-600 text-white' : 'border-white/20 text-slate-400'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Book Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {loading
                ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                : paginated.length > 0
                  ? paginated.map(b => <BookCard key={b.id} book={b} />)
                  : (
                    <div className="col-span-full text-center py-20 text-slate-500">
                      <p className="text-6xl mb-4">📚</p>
                      <p className="text-lg font-medium">No books found</p>
                      <p className="text-sm mt-1">Try a different search or category</p>
                    </div>
                  )
              }
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                      ${page === p ? 'bg-teal-600 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
