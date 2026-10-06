import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import api from '../../api/axios'

const EMPTY_FORM = { category_id: '', title: '', author: '', price: '', stock: '', description: '', cover_url: '' }

export default function AdminBooks() {
  const [books,      setBooks]      = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState(null) // null = add, else book object
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/books'), api.get('/categories')])
      .then(([b, c]) => {
        setBooks(Array.isArray(b.data) ? b.data : [])
        setCategories(Array.isArray(c.data) ? c.data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (book) => {
    setEditing(book)
    setForm({
      category_id: book.category_id,
      title:       book.title,
      author:      book.author,
      price:       book.price,
      stock:       book.stock,
      description: book.description || '',
      cover_url:   book.cover_url   || '',
    })
    setModalOpen(true)
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, category_id: Number(form.category_id), price: Number(form.price), stock: Number(form.stock) }
      if (editing) {
        await api.put(`/books/${editing.id}`, payload)
        showToast('✅ Book updated!')
      } else {
        await api.post('/books', payload)
        showToast('✅ Book added!')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return
    try {
      await api.delete(`/books/${book.id}`)
      showToast('🗑️ Book deleted')
      load()
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Delete failed'))
    }
  }

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Books Inventory</h1>
          <p className="text-slate-400 text-sm">{books.length} total books</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Book
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-5 py-3 text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Search */}
      <div className="glass-card p-4 mb-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search books..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Cover</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Author</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({length:7}).map((__,j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(book => (
                <tr key={book.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <img src={book.cover_url} alt={book.title}
                      className="w-10 h-14 object-cover rounded-lg"
                      onError={e => { e.target.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop' }} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200 max-w-[180px]">
                    <p className="truncate">{book.title}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{book.author}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs bg-teal-500/15 text-teal-400 px-2 py-1 rounded-full">{book.category_name}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-amber-400">₹{Number(book.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full
                      ${book.stock > 0 ? 'bg-teal-500/15 text-teal-400' : 'bg-red-500/15 text-red-400'}`}>
                      {book.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(book)}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-teal-400 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(book)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-bold text-white">{editing ? 'Edit Book' : 'Add New Book'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                    className="input-field" placeholder="Book title" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Author *</label>
                  <input required value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))}
                    className="input-field" placeholder="Author name" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category *</label>
                  <select required value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))}
                    className="input-field">
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Price (₹) *</label>
                  <input required type="number" min="0" step="0.01" value={form.price}
                    onChange={e => setForm(f => ({...f, price: e.target.value}))}
                    className="input-field" placeholder="299.00" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Stock *</label>
                  <input required type="number" min="0" value={form.stock}
                    onChange={e => setForm(f => ({...f, stock: e.target.value}))}
                    className="input-field" placeholder="10" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Cover URL</label>
                  <input value={form.cover_url} onChange={e => setForm(f => ({...f, cover_url: e.target.value}))}
                    className="input-field" placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="input-field resize-none" placeholder="Book synopsis..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editing ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
