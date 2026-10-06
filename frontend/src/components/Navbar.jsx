import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, ShoppingCart, Search, LogOut, User, LayoutDashboard, Package, Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`)
    else navigate('/')
  }

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10 rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="p-1.5 bg-teal-600 rounded-lg">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
              BookNest
            </span>
          </Link>

          {/* Search Bar — hidden on mobile */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search books, authors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={22} className="text-slate-300" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-navy-900 text-xs font-bold
                                 w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-slate-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 w-52 glass-card border border-white/10 shadow-2xl animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                          <LayoutDashboard size={15} /> Admin Dashboard
                        </Link>
                      )}
                      <Link to="/orders" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <Package size={15} /> My Orders
                      </Link>
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors">
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm py-2 px-4">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Join Free</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-3 animate-fade-in">
            <form onSubmit={handleSearch} className="flex">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search books..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9 py-2 text-sm"
                />
              </div>
            </form>
            {!user && (
              <div className="flex flex-col gap-2">
                <Link to="/login"    className="btn-ghost text-sm text-center">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm text-center">Join Free</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
