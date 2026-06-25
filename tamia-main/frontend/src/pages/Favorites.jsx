import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Storefront } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import FavoriteButton from '../components/FavoriteButton'

function Favorites() {
  const { user, loading, favorites, favoritesLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?next=/favorites', { replace: true })
    }
  }, [loading, user, navigate])

  if (loading || favoritesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading saved items...</div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Saved Items</h1>
          <p className="text-gray-500 mt-2">Favorites you saved for later.</p>
        </div>
        <Link to="/sell" className="inline-flex items-center justify-center rounded-2xl bg-jiji-orange px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E65A00]">
          Post a New Ad
        </Link>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {favorites.map((item, index) => (
            <Link 
              key={item.id} 
              to={`/listing/${item.slug}`} 
              className={`relative bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 group flex flex-col h-[380px] ${index % 2 === 1 ? 'mt-8 md:mt-0' : ''}`}
            >
              <div className="flex-[0_0_55%] bg-gray-50 relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  {item.primary_image ? (
                    <img src={item.primary_image.url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl font-bold text-gray-200 uppercase p-4 text-center">{item.title.substring(0, 2)}</div>
                  )}
                </div>
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton listingId={item.id} />
                </div>
              </div>
              <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
                <div className="flex flex-col gap-1">
                  <p className="text-jiji-orange font-bold text-lg md:text-xl truncate">UGX {new Intl.NumberFormat().format(item.price)}</p>
                  <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 group-hover:text-jiji-orange transition-colors leading-snug">{item.title}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <MapPin weight="bold" size={12} />
                    <span>{item.city}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-md font-semibold">
                    {item.condition || 'Used'}
                  </span>
                  {item.is_featured && (
                    <span className="text-amber-400">
                      <Star weight="fill" size={14} />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Storefront size={48} className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold mb-3">You have no saved items yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-10">Save listings you like so you can compare and return to them later.</p>
          <Link to="/" className="bg-jiji-orange text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#E65A00] transition-all">
            Browse Listings
          </Link>
        </div>
      )}
    </div>
  )
}

export default Favorites
