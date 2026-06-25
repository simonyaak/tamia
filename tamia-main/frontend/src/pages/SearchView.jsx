import React, { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlass, MapPin, Clock, Storefront, Funnel, SquaresFour, Rows, Star, Images } from '@phosphor-icons/react'
import FavoriteButton from '../components/FavoriteButton'

function SearchView() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)

  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '')
  const [condition, setCondition] = useState(searchParams.get('condition') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [priceMin, setPriceMin] = useState(searchParams.get('price_min') || '')
  const [priceMax, setPriceMax] = useState(searchParams.get('price_max') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories', {
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('Unable to load categories:', error)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setQuery(params.get('q') || '')
    setCategoryId(params.get('category') || '')
    setCondition(params.get('condition') || '')
    setCity(params.get('city') || '')
    setPriceMin(params.get('price_min') || '')
    setPriceMax(params.get('price_max') || '')
    setSort(params.get('sort') || 'newest')

    setLoading(true)
    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setListings(data.data || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error searching listings:', err)
        setLoading(false)
      })
  }, [location.search])

  const handleFilterSubmit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()

    if (query.trim()) params.set('q', query.trim())
    if (categoryId) params.set('category', categoryId)
    if (condition) params.set('condition', condition)
    if (city.trim()) params.set('city', city.trim())
    if (priceMin.trim()) params.set('price_min', priceMin.trim())
    if (priceMax.trim()) params.set('price_max', priceMax.trim())
    if (sort) params.set('sort', sort)

    navigate(`/search?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setQuery('')
    setCategoryId('')
    setCondition('')
    setCity('')
    setPriceMin('')
    setPriceMax('')
    setSort('newest')
    navigate('/search')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 min-h-screen">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-outfit">
            {query ? `Search results for "${query}"` : 'Browse All Listings'}
          </h1>
          <p className="text-gray-500 mt-2">Found {listings.length} results</p>
        </div>
        <div className="flex bg-gray-100/80 p-1 rounded-[14px] backdrop-blur-sm border border-gray-200/50 self-start lg:self-end">
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

      <form onSubmit={handleFilterSubmit} className="mb-8 grid gap-4 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
              placeholder="What are you looking for?"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Condition</span>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
            >
              <option value="">Any condition</option>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
              placeholder="Kampala, Entebbe, Jinja..."
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Min price</span>
              <input
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                placeholder="0"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Max price</span>
              <input
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                placeholder="Any"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4 justify-end">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-jiji-orange px-5 py-3 text-sm font-semibold text-white hover:bg-[#E65A00] transition-colors">
              <MagnifyingGlass weight="bold" /> Search
            </button>
            <button type="button" onClick={handleClearFilters} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-jiji-orange hover:text-jiji-orange transition-colors">
              <Funnel weight="bold" /> Clear Filters
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className={`bg-gray-100 animate-pulse rounded-2xl ${viewMode === 'grid' ? 'aspect-[3/4]' : 'h-[160px] w-full'}`}></div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className={`grid gap-x-2.5 gap-y-2 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {listings.map((item, index) => (
            <Link 
              key={item.id} 
              to={`/listing/${item.slug}`} 
              className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 group flex ${
                viewMode === 'grid' ? `flex-col h-[380px] ${index % 2 === 1 ? 'mt-6 md:mt-0' : ''}` : 'flex-row h-[160px] md:h-[180px] mb-3'
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
                <div className="flex items-center justify-between pt-2">
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
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Storefront size={48} className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold mb-3">No results found</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-10">We couldn't find anything matching your filters. Adjust your search or clear the filters to see more listings.</p>
          <button onClick={handleClearFilters} className="bg-jiji-orange text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#E65A00] transition-all">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchView
