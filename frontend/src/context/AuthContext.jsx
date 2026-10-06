import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('booknest_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('booknest_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('booknest_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
