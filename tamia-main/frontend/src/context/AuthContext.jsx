import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
let cachedCsrfToken = null

async function getCsrfToken() {
  if (cachedCsrfToken) {
    return cachedCsrfToken
  }

  const response = await fetch('/api/csrf-token', {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  cachedCsrfToken = data.csrf_token
  return cachedCsrfToken
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  async function loadUser() {
    setLoading(true)

    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        setUser(null)
        return
      }

      const data = await response.json()
      setUser(data.user || null)
    } catch (error) {
      console.error('Error loading authenticated user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadFavorites() {
    if (!user) {
      setFavorites([])
      return
    }

    setFavoritesLoading(true)

    try {
      const response = await fetch('/api/favorites', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        setFavorites([])
        return
      }

      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
      setFavorites([])
    } finally {
      setFavoritesLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setFavorites([])
    }
  }, [user])

  async function login({ email, password }) {
    const token = await getCsrfToken()

    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': token,
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json().catch(() => ({ message: 'Login failed' }))

    if (response.ok && data.user) {
      setUser(data.user)
      return { success: true }
    }

    return { success: false, errors: data.errors || { general: data.message || 'Login failed' } }
  }

  async function register({ name, email, phone, password, password_confirmation }) {
    const token = await getCsrfToken()

    const response = await fetch('/api/register', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': token,
      },
      body: JSON.stringify({ name, email, phone, password, password_confirmation }),
    })

    const data = await response.json().catch(() => ({ message: 'Registration failed' }))

    if (response.ok && data.user) {
      setUser(data.user)
      return { success: true }
    }

    return { success: false, errors: data.errors || { general: data.message || 'Registration failed' } }
  }

  async function logout() {
    const token = await getCsrfToken()

    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-CSRF-TOKEN': token,
      },
    })

    setUser(null)
    setFavorites([])
  }

  async function toggleFavorite(listingId) {
    if (!user) {
      return { success: false, requiresLogin: true }
    }

    const token = await getCsrfToken()

    try {
      const response = await fetch(`/api/favorites/${listingId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': token,
        },
      })

      const data = await response.json().catch(() => ({ favorited: false, message: 'Unable to update favorites.' }))
      if (!response.ok) {
        return { success: false, message: data.message }
      }

      await loadFavorites()
      return { success: true, favorited: data.favorited }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      return { success: false, message: 'Unable to update favorites.' }
    }
  }

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        favorites,
        favoritesLoading,
        favoriteIds,
        login,
        register,
        logout,
        refreshUser: loadUser,
        refreshFavorites: loadFavorites,
        toggleFavorite,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
