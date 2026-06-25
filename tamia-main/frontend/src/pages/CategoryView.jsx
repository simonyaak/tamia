import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Clock, CaretRight, Storefront, SquaresFour, Rows, Star, Images } from '@phosphor-icons/react'
import FavoriteButton from '../components/FavoriteButton'

function CategoryView() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/category/${slug}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching category data:", err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-2xl aspect-[3/4]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.category) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center">
        <h2 className="text-2xl font-bold font-outfit mb-4">Category not found</h2>
        <Link to="/" className="text-jiji-orange font-semibold hover:underline">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-jiji-orange">Home</Link>
        <CaretRight size={12} />
        <span className="font-semibold text-gray-900">{data.category.name}</span>
      </div>

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-outfit">{data.category.name}</h1>
          <p className="text-gray-500 mt-2">Found {data.listings.total} items in this category</p>
        </div>
        <div className="flex bg-gray-100/80 p-1 rounded-[14px] backdrop-blur-sm border border-gray-200/50">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-jiji-orange' : 'text-gray-400 hover:text-gray-600'}`}
            title="Grid View"
          >
            <SquaresFour weight={viewMode === 'grid' ? 'fill' : 'bold'} size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-jiji-orange' : 'text-gray-400 hover:text-gray-600'}`}
            title="List View"
          >
            <Rows weight={viewMode === 'list' ? 'fill' : 'bold'} size={20} />
          </button>
        </div>
      </div>

      {data.listings.data.length > 0 ? (
        <div className={`grid gap-x-2.5 gap-y-2 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {data.listings.data.map((item, index) => (
            <Link
              key={item.id}
              to={`/listing/${item.slug}`}
              className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 group flex ${viewMode === 'grid' ? `flex-col h-[380px] ${index % 2 === 1 ? 'mt-6 md:mt-0' : ''}` : 'flex-row h-[160px] md:h-[180px] mb-3'
                }`}
            >
              <div className={`${viewMode === 'grid' ? 'aspect-square w-full' : 'flex-[0_0_140px] md:flex-[0_0_180px]'} bg-gray-50 relative`}>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  {item.primary_image ? (
                    <img src={item.primary_image.url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`${viewMode === 'grid' ? 'text-4xl' : 'text-2xl'} font-bold text-gray-200 uppercase p-4 text-center`}>{item.title.substring(0, 2)}</div>
                  )}
                </div>
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton listingId={item.id} />
                </div>
                {item.images_count > 1 && (
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Images size={10} weight="bold" />
                    <span>{item.images_count}</span>
                  </div>
                )}
              </div>
              <div className={`flex-1 p-3 flex flex-col justify-between overflow-hidden bg-white`}>
                <div className="flex flex-col gap-0.5">
                  <p className="text-jiji-orange font-bold text-lg md:text-xl">UGX {new Intl.NumberFormat().format(item.price)}</p>
                  <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 group-hover:text-jiji-orange transition-colors leading-snug">{item.title}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <Star weight="fill" className="text-amber-400" size={12} />
                    <span>{item.reviews_count > 0 ? `${Number(item.reviews_avg_rating).toFixed(1)} (${item.reviews_count})` : 'No reviews'}</span>
                  </div>
                </div>
                <div className={`flex items-center justify-between pt-2`}>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <MapPin weight="bold" size={12} />
                    <span className="truncate max-w-[80px]">{item.city}</span>
                  </div>
                  <span className="bg-gray-50 text-gray-600 text-[10px] px-2 py-1 rounded-md font-semibold">
                    {item.condition || 'Used'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Storefront size={40} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold mb-2">No listings yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto">Be the first to post something in {data.category.name}!</p>
          <button className="mt-8 bg-jiji-orange text-white px-8 py-3 rounded-xl font-bold hover:bg-[#E65A00] transition-colors">
            Post an Ad
          </button>
        </div>
      )}
    </div>
  )
}

export default CategoryView
