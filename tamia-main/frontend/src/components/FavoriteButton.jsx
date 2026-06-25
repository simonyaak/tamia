import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

function FavoriteButton({ listingId, className = '' }) {
  const navigate = useNavigate()
  const { user, loading, favoriteIds, toggleFavorite } = useAuth()
  const isFavorited = favoriteIds.has(listingId)

  const handleClick = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (loading) {
      return
    }

    if (!user) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    await toggleFavorite(listingId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-full p-1.5 transition-all ${isFavorited ? 'bg-jiji-orange text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-400 hover:text-jiji-orange hover:shadow-sm'} ${className}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart weight={isFavorited ? 'fill' : 'bold'} size={18} />
    </button>
  )
}

export default FavoriteButton
