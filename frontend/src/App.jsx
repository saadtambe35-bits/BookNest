import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar         from './components/Navbar'
import Home           from './pages/Home'
import BookDetail     from './pages/BookDetail'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Cart           from './pages/Cart'
import Checkout       from './pages/Checkout'
import Orders         from './pages/Orders'
import AdminLayout    from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBooks     from './pages/admin/AdminBooks'
import AdminOrders    from './pages/admin/AdminOrders'

function AdminGuard({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user)    return <Navigate to="/login"   replace />
  if (!isAdmin) return <Navigate to="/"        replace />
  return children
}

function AuthGuard({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"            element={<Home />} />
        <Route path="/book/:id"    element={<BookDetail />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />

        {/* Customer protected */}
        <Route path="/cart"     element={<AuthGuard><Cart /></AuthGuard>} />
        <Route path="/checkout" element={<AuthGuard><Checkout /></AuthGuard>} />
        <Route path="/orders"   element={<AuthGuard><Orders /></AuthGuard>} />

        {/* Admin protected */}
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index        element={<AdminDashboard />} />
          <Route path="books"  element={<AdminBooks />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
