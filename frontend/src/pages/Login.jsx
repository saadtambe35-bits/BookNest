import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.user)
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-teal-600/20 rounded-2xl mb-4">
            <BookOpen size={32} className="text-teal-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-1">Sign in to continue your reading journey</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" required placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  className="input-field pl-10" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPw ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick fill buttons */}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setForm({email:'customer@booknest.com', password:'customer123'})}
              className="flex-1 text-xs py-2 border border-white/10 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
              Fill Customer
            </button>
            <button onClick={() => setForm({email:'admin@booknest.com', password:'admin123'})}
              className="flex-1 text-xs py-2 border border-white/10 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
              Fill Admin
            </button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            New to BookNest?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
