import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem('booknest_cart')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const saveCart = (items) => {
    setCart(items)
    localStorage.setItem('booknest_cart', JSON.stringify(items))
  }

  const addToCart = useCallback((book, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.book.id === book.id)
      let updated
      if (existing) {
        updated = prev.map(i =>
          i.book.id === book.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, book.stock) }
            : i
        )
      } else {
        updated = [...prev, { book, quantity }]
      }
      localStorage.setItem('booknest_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const updateQuantity = useCallback((bookId, quantity) => {
    setCart(prev => {
      const updated = quantity <= 0
        ? prev.filter(i => i.book.id !== bookId)
        : prev.map(i => i.book.id === bookId ? { ...i, quantity } : i)
      localStorage.setItem('booknest_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeFromCart = useCallback((bookId) => {
    setCart(prev => {
      const updated = prev.filter(i => i.book.id !== bookId)
      localStorage.setItem('booknest_cart', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    localStorage.removeItem('booknest_cart')
  }, [])

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cart.reduce((sum, i) => sum + i.quantity * i.book.price, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
