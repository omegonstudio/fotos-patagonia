"use client"

import { useState, useEffect } from "react"

interface CartItem {
  photoId: string
  favorite: boolean
}

export function usePhotoGallery() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [cart, setCart] = useState<CartItem[]>([])

  // Load favorites and cart from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem("photo-favorites")
    const storedCart = localStorage.getItem("photo-cart")

    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }

    if (storedCart) {
      setCart(JSON.parse(storedCart))
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("photo-favorites", JSON.stringify(favorites))
  }, [favorites])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("photo-cart", JSON.stringify(cart))
    window.dispatchEvent(new Event("cart-updated"))
  }, [cart])

  const toggleFavorite = (photoId: string) => {
    setFavorites((prev) => {
      const isFavorite = prev.includes(photoId)
  
      if (isFavorite) {
        // ❌ Se desmarca → sacar del carrito
        setCart((cart) => cart.filter((item) => item.photoId !== photoId))
        return prev.filter((id) => id !== photoId)
      }
  
      // ✅ Se marca → agregar al carrito
      setCart((cart) => {
        if (cart.some((item) => item.photoId === photoId)) return cart
        return [...cart, { photoId, favorite: true }]
      })
  
      return [...prev, photoId]
    })
  }

  const addToCart = (photoId: string) => {
    setCart((prev) => {
      // Check if item already exists in cart
      if (prev.some((item) => item.photoId === photoId)) {
        return prev
      }

      // Add new item with favorite status
      return [
        ...prev,
        {
          photoId,
          favorite: favorites.includes(photoId),
        },
      ]
    })
  }

  const removeFromCart = (photoId: string) => {
    setCart((prev) => prev.filter((item) => item.photoId !== photoId))
  }

  const clearCart = () => {
    setCart([])
  }

  return {
    favorites,
    cart,
    toggleFavorite,
    addToCart,
    removeFromCart,
    clearCart,
  }
}
