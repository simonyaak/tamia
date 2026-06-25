import React, { useState, useEffect, useRef } from 'react'
import { Storefront, MagnifyingGlass, PlusCircle, Car, DeviceMobile, Television, HouseLine, Armchair, TShirt, Briefcase, Wrench, MapPin, ShieldCheck, WhatsappLogo, TrendUp, Clock, CaretRight, Leaf, Dog, Heartbeat, Baby, Star, SquaresFour, Rows, Images } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import FavoriteButton from '../components/FavoriteButton'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('All Uganda');
  const [searchQuery, setSearchQuery] = useState('');
  const categoriesSliderRef = useRef(null);
  const featuredSliderRef = useRef(null);
  const topDealsSliderRef = useRef(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const scrollCategories = (direction) => {
    if (!categoriesSliderRef.current) return;
    categoriesSliderRef.current.scrollBy({
      left: direction * 220,
      behavior: 'smooth',
    });
  }

  const scrollFeatured = (direction) => {
    if (!featuredSliderRef.current) return;
    featuredSliderRef.current.scrollBy({
      left: direction * 320,
      behavior: 'smooth',
    });
  }

  const scrollTopDeals = (direction) => {
    if (!topDealsSliderRef.current) return;
    topDealsSliderRef.current.scrollBy({
      left: direction * 320,
      behavior: 'smooth',
    });
  }

  const iconMap = {
    'ph-car': <img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Vehicles" />,
    'ph-device-mobile': <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Phones" />,
    'ph-television': <img src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Electronics" />,
    'ph-house-line': <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Property" />,
    'ph-armchair': <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Home & Furniture" />,
    'ph-t-shirt': <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Fashion" />,
    'ph-briefcase': <img src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Jobs" />,
    'ph-wrench': <img src="https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Services" />,
    'ph-leaf': <img src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Agriculture" />,
    'ph-dog': <img src="https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Animals" />,
    'ph-heart-beat': <img src="https://images.unsplash.com/photo-1505751172107-160a0f722744?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Health" />,
    'ph-baby': <img src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop" className="w-full h-full object-cover rounded-2xl" alt="Baby" />,
  };

  const colorMap = [
    'bg-blue-50 text-blue-600',
    'bg-emerald-50 text-emerald-600',
    'bg-purple-50 text-purple-600',
    'bg-orange-50 text-orange-600',
    'bg-rose-50 text-rose-600',
    'bg-pink-50 text-pink-600',
    'bg-amber-50 text-amber-600',
    'bg-cyan-50 text-cyan-600',
  ];

  useEffect(() => {
    fetch('/api/marketplace/initial')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories.map((cat, i) => ({
          ...cat,
          icon: iconMap[cat.icon] || <Storefront size={32} />,
          color: colorMap[i % colorMap.length]
        })));
        setTrendingItems(data.trending);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  const featuredItems = trendingItems.filter((item) => item.is_featured)
  const sellerAds = user ? trendingItems.filter((item) => item.user?.id === user.id) : []
  const listingGridItems = trendingItems // Show all trending items, including the user's own
  const topDealsItems = [...trendingItems]
    .sort((a, b) => b.price - a.price)
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-[#EBF0F5] font-inter">
      {/* Hero Section */}
      <header className="bg-[#F28500] rounded-b-[32px] pb-10 shadow-[0_30px_70px_rgba(242,133,0,0.18)]">
        <div className="max-w-5xl mx-auto px-6 pt-10">
          <div className="text-center animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              What are you looking for?
            </h1>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-[1.2fr_1.8fr] items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="rounded-[14px] bg-white/10 border border-white/20 px-4 py-3 shadow-[0_15px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <label className="sr-only">Location</label>
              <select
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full bg-transparent text-white text-sm font-semibold outline-none appearance-none"
              >
                <option>Kampala</option>
                <option>Entebbe</option>
                <option>Jinja</option>
              </select>
            </div>
            <div className="relative rounded-[14px] bg-white px-4 py-3 shadow-[0_15px_30px_rgba(0,0,0,0.08)]">
              <MagnifyingGlass weight="bold" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <label className="sr-only">Search</label>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="I am looking for..."
                className="w-full pl-11 pr-4 bg-transparent text-gray-900 text-sm placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Top Deals Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-8 bg-white rounded-none shadow-sm border border-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-outfit tracking-tight">
              <span className="text-gray-900">Top</span> <span className="text-jiji-orange">Deals</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base leading-6 mt-1">Great offers from popular listings, updated in real time.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollTopDeals(-1)}
              className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-700 flex items-center justify-center"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollTopDeals(1)}
              className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-700 flex items-center justify-center"
            >
              ›
            </button>
          </div>
        </div>
        <div className="overflow-x-auto hide-scrollbar-mobile snap-x snap-mandatory flex gap-4" ref={topDealsSliderRef}>
          {topDealsItems.map((item) => (
            <Link
              key={item.id}
              to={`/listing/${item.slug}`}
              className="snap-start w-[140px] sm:w-[190px] md:w-[210px] lg:w-[230px] h-[240px] flex-shrink-0 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover-lift flex flex-col justify-between"
            >
              <div className="h-[140px] bg-gray-50 relative overflow-hidden">
                {item.primary_image ? (
                  <img src={item.primary_image.url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-4xl font-bold text-gray-200 uppercase p-4 text-center">{item.title.substring(0, 2)}</div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent" />
                {item.is_featured && (
                  <div className="absolute top-3 left-3 bg-jiji-orange text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm">
                    FEATURED
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <FavoriteButton listingId={item.id} />
                </div>
                {item.images_count > 1 && (
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Images size={10} weight="bold" />
                    <span>{item.images_count}</span>
                  </div>
                )}
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between border-t border-gray-100">
                <div>
                  <h3 className="text-[12px] font-semibold text-gray-900 line-clamp-1 mb-1">{item.title}</h3>
                  <div className="flex items-center gap-1 text-[9px] text-gray-500 mb-1">
                    <Star weight="fill" className="text-amber-400" size={12} />
                    {item.reviews_count > 0 ? `${Number(item.reviews_avg_rating).toFixed(1)} (${item.reviews_count})` : 'No reviews'}
                  </div>
                  <p className="text-[9px] text-gray-500 mb-1 leading-4 truncate">
                    {item.user.name} {item.user.is_verified ? '• Verified' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-jiji-orange font-bold text-sm mb-1">UGX {new Intl.NumberFormat().format(item.price)}</p>
                  <div className="flex items-center justify-between text-[8px] text-gray-400 uppercase tracking-wide">
                    <span className="flex items-center gap-1"><MapPin weight="bold" /> {item.city}</span>
                    <span className="flex items-center gap-1"><Clock weight="bold" /> {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {loading && Array(4).fill(0).map((_, i) => (
            <div key={i} className="snap-start w-[140px] sm:w-[190px] md:w-[210px] lg:w-[230px] flex-shrink-0 rounded-3xl bg-gray-100 animate-pulse h-[240px]" />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-[10px] py-[40px]">
        <h2 className="text-2xl font-bold font-outfit mb-10 flex items-center gap-3">
           Everything You Need 
          <span className="h-px bg-gray-200 flex-1"></span>
        </h2>

        <div className="block md:hidden relative">
          <div className="absolute top-1/2 left-2 -translate-y-1/2 z-10">
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-700 flex items-center justify-center"
            >
              ‹
            </button>
          </div>
          <div className="overflow-x-auto hide-scrollbar-mobile snap-x snap-mandatory flex gap-3 pb-3" ref={categoriesSliderRef}>
            {categories.map((cat, i) => (
              <Link
                key={i}
                to={`/category/${cat.slug}`}
                className="snap-start flex-none w-[120px] h-[138px] rounded-3xl border border-gray-100 bg-white p-3 text-center shadow-sm hover-lift"
              >
                <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden ${typeof cat.icon === 'string' ? '' : cat.color}`}>
                  {cat.icon}
                </div>
                <span className="mt-3 block text-xs font-semibold text-gray-700 leading-5">{cat.name}</span>
              </Link>
            ))}
            {loading && Array(8).fill(0).map((_, i) => (
              <div key={i} className="snap-start min-w-[135px] flex-shrink-0 rounded-3xl border border-gray-100 bg-gray-100 p-4 animate-pulse" />
            ))}
          </div>
          <div className="absolute top-1/2 right-2 -translate-y-1/2 z-10">
            <button
              type="button"
              onClick={() => scrollCategories(1)}
              className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-700 flex items-center justify-center"
            >
              ›
            </button>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat, i) => (
            <Link key={i} to={`/category/${cat.slug}`} className="flex h-[140px] flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-3 text-center group hover-lift">
              <div className={`w-20 h-20 flex items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 overflow-hidden ${typeof cat.icon === 'string' ? '' : cat.color}`}>
                {cat.icon}
              </div>
              <span className="mt-3 text-xs font-semibold text-gray-700 group-hover:text-jiji-orange transition-colors">{cat.name}</span>
            </Link>
          ))}
          {loading && Array(8).fill(0).map((_, i) => (
             <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl"></div>
                <div className="mt-3 w-12 h-3 bg-gray-100 rounded"></div>
             </div>
          ))}
        </div>
      </section>

      {/* Trending Section */}
      <section className="max-w-7xl mx-auto px-0 md:px-12 py-4 bg-[#EBF0F5] mb-16">
        <div className="flex justify-between items-center mb-8 px-6 md:px-0">
          <div>
            <h2 className="text-2xl font-bold font-outfit">Trending Near You</h2>
            <p className="text-gray-500 text-sm">Most viewed items in Kampala right now.</p>
          </div>
          <div className="flex items-center gap-4">
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
            <Link to="/search" className="hidden sm:flex text-jiji-orange font-semibold text-sm items-center gap-1 hover:underline">
              View All <CaretRight weight="bold" />
            </Link>
          </div>
        </div>

        {featuredItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h3 className="text-xl font-semibold">Featured Listings</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => scrollFeatured(-1)}
                  className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-700 flex items-center justify-center"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => scrollFeatured(1)}
                  className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-700 flex items-center justify-center"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-x-auto hide-scrollbar-mobile snap-x snap-mandatory flex gap-4 pb-4" ref={featuredSliderRef}>
                {featuredItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/listing/${item.slug}`}
                    className="snap-start w-[140px] sm:w-[190px] md:w-[210px] lg:w-[230px] h-[240px] flex-shrink-0 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover-lift flex flex-col justify-between"
                  >
                    <div className="h-[140px] bg-gray-50 relative overflow-hidden">
                      {item.primary_image ? (
                        <img src={item.primary_image.url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <div className="text-4xl font-bold text-gray-200 uppercase p-4 text-center">{item.title.substring(0, 2)}</div>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-jiji-orange text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        FEATURED
                      </div>
                      <div className="absolute top-3 right-3 rounded-full bg-white/90 p-2 shadow-sm">
                        <FavoriteButton listingId={item.id} className="p-0 text-gray-600" />
                      </div>
                      {item.images_count > 1 && (
                        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <Images size={10} weight="bold" />
                          <span>{item.images_count}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 flex-1 flex flex-col justify-between border-t border-gray-100">
                      <div>
                        <h3 className="text-[12px] font-semibold text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
                        <div className="flex items-center gap-1 text-[9px] text-gray-500 mb-1">
                          <Star weight="fill" className="text-amber-400" size={12} />
                          {item.reviews_count > 0 ? `${Number(item.reviews_avg_rating).toFixed(1)} (${item.reviews_count})` : 'No reviews'}
                        </div>
                        <p className="text-[9px] text-gray-500 mb-1 truncate">{item.user.name} {item.user.is_verified ? '• Verified' : ''}</p>
                      </div>
                      <div>
                        <p className="text-jiji-orange font-bold text-sm mb-1">UGX {new Intl.NumberFormat().format(item.price)}</p>
                        <div className="flex items-center justify-between text-[8px] text-gray-400 uppercase tracking-wide">
                          <span className="flex items-center gap-1"><MapPin weight="bold" /> {item.city}</span>
                          <span className="flex items-center gap-1"><Clock weight="bold" /> {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {loading && Array(3).fill(0).map((_, i) => (
                  <div key={i} className="snap-start w-[140px] sm:w-[190px] md:w-[210px] lg:w-[230px] h-[240px] flex-shrink-0 rounded-3xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={`grid gap-x-2.5 gap-y-2 md:gap-6 px-0 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1'}`}>
          {listingGridItems.map((item, index) => (
            <Link 
              key={item.id} 
              to={`/listing/${item.slug}`} 
              className={`flex bg-white border border-gray-100 overflow-hidden shadow-sm hover-lift group ${
                viewMode === 'grid' 
                  ? `flex-col h-[380px] rounded-2xl ${index % 2 === 1 ? 'mt-6 md:mt-0' : ''}` 
                  : 'flex-row h-[160px] md:h-[180px] rounded-2xl mb-3'
              }`}
            >
              <div className={`${viewMode === 'grid' ? 'flex-[0_0_55%]' : 'flex-[0_0_140px] md:flex-[0_0_180px]'} relative bg-gray-50`}>
                {item.primary_image ? (
                  <img src={item.primary_image.url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className={`${viewMode === 'grid' ? 'text-4xl' : 'text-2xl'} font-bold text-gray-200 uppercase`}>{item.title.substring(0, 2)}</div>
                  </div>
                )}
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
              <div className="flex-1 bg-white p-3 flex flex-col justify-between overflow-hidden">
                <div className="flex flex-col gap-0.5">
                  <p className="text-jiji-orange font-bold text-lg md:text-xl truncate">UGX {new Intl.NumberFormat().format(item.price)}</p>
                  <h3 className="text-[13px] font-medium text-gray-800 leading-tight line-clamp-2 group-hover:text-jiji-orange transition-colors">{item.title}</h3>
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
          {loading && [1,2,3,4,5].map(i => (
             <div key={i} className={`bg-gray-50 animate-pulse rounded-2xl ${viewMode === 'grid' ? 'aspect-[3/4]' : 'h-[160px] w-full'}`}></div>
          ))}
        </div>

        {sellerAds.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your Posted Ads</h3>
            </div>
            <div className={`grid gap-x-2.5 gap-y-2 md:gap-6 px-0 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1'}`}>
              {sellerAds.map((item, index) => (
                <Link 
                  key={item.id} 
                  to={`/listing/${item.slug}`} 
                  className={`flex bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 group ${
                    viewMode === 'grid' 
                      ? `flex-col h-[380px] rounded-2xl ${index % 2 === 1 ? 'mt-6 md:mt-0' : ''}` 
                      : 'flex-row h-[160px] md:h-[180px] rounded-2xl mb-3'
                  }`}
                >
                  <div className={`${viewMode === 'grid' ? 'flex-[0_0_55%]' : 'flex-[0_0_140px] md:flex-[0_0_180px]'} relative bg-gray-50`}>
                    {item.primary_image ? (
                      <img src={item.primary_image.url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className={`${viewMode === 'grid' ? 'text-4xl' : 'text-2xl'} font-bold text-gray-200 uppercase`}>{item.title.substring(0, 2)}</div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteButton listingId={item.id} />
                    </div>
                    {item.images_count > 1 && (
                      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Television size={10} weight="bold" />
                        <span>{item.images_count}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-white p-3 flex flex-col justify-between overflow-hidden">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-jiji-orange font-bold text-lg md:text-xl truncate">UGX {new Intl.NumberFormat().format(item.price)}</p>
                      <h3 className="text-[13px] font-medium text-gray-800 leading-tight line-clamp-2 group-hover:text-jiji-orange transition-colors">{item.title}</h3>
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
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
