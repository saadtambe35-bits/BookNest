import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ShoppingBag, BookMarked, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { path: '/admin',            label: 'Dashboard',  Icon: LayoutDashboard, exact: true },
  { path: '/admin/books',      label: 'Books',      Icon: BookOpen },
  { path: '/admin/orders',     label: 'Orders',     Icon: ShoppingBag },
]

export default function AdminLayout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [sideOpen, setSideOpen] = useState(false)

  useEffect(() => {
    if (!user || !isAdmin) navigate('/')
  }, [user, isAdmin])

  const handleLogout = () => { logout(); navigate('/') }

  const NavLink = ({ path, label, Icon, exact }) => {
    const active = exact ? location.pathname === path : location.pathname.startsWith(path) && path !== '/admin'
    const isActive = exact ? location.pathname === '/admin' : active

    return (
      <Link
        to={path}
        onClick={() => setSideOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
          ${isActive
            ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
      >
        <Icon size={18} />
        {label}
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex pt-16">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 bottom-0 w-60 glass-card border-r border-white/10 rounded-none
        flex flex-col z-40 transform transition-transform duration-300
        ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-600 rounded-lg"><BookMarked size={16} className="text-white" /></div>
            <div>
              <p className="text-sm font-bold text-white">Admin Panel</p>
              <p className="text-xs text-slate-500 truncate">{user?.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => <NavLink key={item.path} {...item} />)}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-400
                       hover:text-red-300 hover:bg-red-500/10 transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sideOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSideOpen(o => !o)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3.5 bg-teal-600 rounded-full shadow-xl text-white"
      >
        {sideOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 p-6">
        <Outlet />
      </main>
    </div>
  )
}
