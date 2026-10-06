import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const passwordStrength = (pw) => {
    if (pw.length === 0) return 0
    if (pw.length < 6)   return 1
    if (pw.length < 10)  return 2
    return 3
  }

  const strength = passwordStrength(form.password)
  const strengthLabels = ['', 'Weak', 'Good', 'Strong']
  const strengthColors = ['', 'bg-red-500', 'bg-amber-400', 'bg-teal-500']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      const res = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password })
      login(res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-teal-600/20 rounded-2xl mb-4">
            <BookOpen size={32} className="text-teal-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
          <p className="text-slate-400 mt-1">Start your reading journey with BookNest</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" required placeholder="John Reader"
                  value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="input-field pl-10" />
              </div>
            </div>

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
                <input type={showPw ? 'text' : 'password'} required placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-navy-700 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strengthColors[strength]}`}
                      style={{ width: `${(strength/3)*100}%` }} />
                  </div>
                  <span className="text-xs text-slate-400">{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" required placeholder="••••••••"
                  value={form.confirm}
                  onChange={e => setForm(f => ({...f, confirm: e.target.value}))}
                  className="input-field pl-10" />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
