import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Clock, WhatsappLogo, ShieldCheck, CaretRight, User, Eye, Tag, Info, ShareNetwork, X } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import FavoriteButton from '../components/FavoriteButton'
import FollowButton from '../components/FollowButton'
import ReviewList from '../components/ReviewList'
import WriteReview from '../components/WriteReview'
import SmartDealModal from '../components/SmartDealModal'
import { Handshake } from '@phosphor-icons/react'

function ListingDetails() {
  const { slug } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [messageBody, setMessageBody] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageStatus, setMessageStatus] = useState('')
  const [messageError, setMessageError] = useState('')
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [phoneTrackingSent, setPhoneTrackingSent] = useState(false)
  const [sellerFollowState, setSellerFollowState] = useState({ isFollowing: false, followersCount: 0 })
  const [shareFeedback, setShareFeedback] = useState('')
  const [sharing, setSharing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDealModalOpen, setIsDealModalOpen] = useState(false)
  const [activeDeal, setActiveDeal] = useState(null)

  const getImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `/storage/${path}`
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(`/api/listing/${slug}`)
      .then(res => res.json())
      .then(async data => {
        setItem(data)
        // Check for existing deal if logged in
        if (user) {
          try {
            const dealRes = await fetch(`/api/deals?listing_id=${data.id}`, { credentials: 'include' });
            const dealData = await dealRes.json();
            const currentDeal = dealData.deals.data.find(d => 
              d.listing_id === data.id && 
              (d.status === 'active' || d.status === 'pending')
            );
            setActiveDeal(currentDeal);
          } catch (e) { console.error("Error fetching deal:", e); }
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching listing details:", err)
        setLoading(false)
      })
  }, [slug])

  useEffect(() => {
    if (item) {
      if (item.images && item.images.length > 0) {
        setSelectedImage(getImageUrl(item.images[0].path || item.images[0].url))
      } else if (item.primary_image) {
        setSelectedImage(getImageUrl(item.primary_image.path || item.primary_image.url))
      }

      setSellerFollowState({
        isFollowing: item.user?.is_following || false,
        followersCount: item.user?.followers_count || 0,
      })
    }
  }, [item])

  const otherUser = item && user && item.user.id !== user.id
  const canSeeDealButton = item && (!user || item.user.id !== user.id)

  const handleSendMessage = async (event) => {
    event.preventDefault()
    setMessageStatus('')
    setMessageError('')

    if (!messageBody.trim()) {
      setMessageError('Please enter a message.')
      return
    }

    if (!user) {
      navigate(`/login?next=/listing/${slug}`, { replace: true })
      return
    }

    setSendingMessage(true)

    const tokenResponse = await fetch('/api/csrf-token', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    const tokenData = await tokenResponse.json().catch(() => ({}))
    const token = tokenData.csrf_token

    const response = await fetch(`/api/listings/${item.id}/conversation`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': token,
      },
      body: JSON.stringify({ body: messageBody.trim() }),
    })

    setSendingMessage(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setMessageError(data.message || 'Unable to send message. Please try again.')
      return
    }

    const data = await response.json().catch(() => null)
    if (data?.conversation?.id) {
      setMessageStatus('Message sent successfully.')
      setMessageBody('')
      navigate(`/messages/${data.conversation.id}`)
      return
    }

    setMessageStatus('Message sent successfully.')
  }

  const handleShowPhone = async () => {
    setShowPhone(true)
    if (!phoneTrackingSent && item) {
      setPhoneTrackingSent(true)
      try {
        fetch(`/api/listings/${item.id}/click-phone`, { 
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
      } catch (err) {
        console.error("Error tracking phone click:", err)
      }
    }
  }

  const handleShare = async () => {
    if (!item) return
    setSharing(true)
    
    const shareUrl = `${window.location.origin}/s/${item.slug}`
    const shareData = {
      title: item.title,
      text: `Check out ${item.title} on Tamia!`,
      url: shareUrl,
    }

    try {
      if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShareFeedback('Link copied!')
        setTimeout(() => setShareFeedback(''), 3000)
      }
    } catch (err) {
      console.error('Error sharing:', err)
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShareFeedback('Link copied!')
        setTimeout(() => setShareFeedback(''), 3000)
      } catch (e) {
        setShareFeedback('Failed to copy')
        setTimeout(() => setShareFeedback(''), 3000)
      }
    }
    setSharing(false)
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const handleTouchStart = (e) => {
    setTouchEnd(null) // Reset touch end
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    if (isLeftSwipe) {
      nextImage()
    } else if (isRightSwipe) {
      prevImage()
    }
    setTouchStart(null)
    setTouchEnd(null)
  }

  const allImages = useMemo(() => {
    if (!item) return []
    const imgs = []
    if (item.primary_image) imgs.push(getImageUrl(item.primary_image.path || item.primary_image.url))
    if (item.images && item.images.length > 0) {
      item.images.forEach(img => {
        const url = getImageUrl(img.path || img.url)
        if (url && !imgs.includes(url)) imgs.push(url)
      })
    }
    return imgs
  }, [item])

  const nextImage = (e) => {
    e?.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = (e) => {
    e?.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 animate-pulse">
        <div className="flex gap-12 flex-col lg:flex-row">
          <div className="flex-1 space-y-4">
            <div className="bg-gray-200 h-[500px] rounded-3xl"></div>
            <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
          </div>
          <div className="w-full lg:w-[350px] space-y-4">
            <div className="bg-gray-200 h-[200px] rounded-3xl"></div>
            <div className="bg-gray-200 h-[100px] rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center">
        <h2 className="text-2xl font-bold font-outfit mb-4">Listing not found</h2>
        <Link to="/" className="text-jiji-orange font-semibold hover:underline">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F6F8] min-h-screen pb-24">
      {/* Mobile-Friendly Full-Bleed Image Slider Section */}
      <div 
        className="relative bg-black aspect-square md:aspect-video lg:h-[600px] overflow-hidden group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex w-full transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {allImages.length > 0 ? (
            allImages.map((img, idx) => (
              <div 
                key={idx} 
                className="w-full h-full flex-shrink-0 cursor-pointer"
                onClick={() => setIsFullscreen(true)}
              >
                <img src={img} alt={`${item.title} - ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-gray-100 flex-shrink-0">
              <Info size={80} weight="thin" />
              <span className="mt-2 font-bold uppercase tracking-widest">No Image Available</span>
            </div>
          )}
        </div>
        
        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100"
            >
              <CaretRight size={24} className="rotate-180" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100"
            >
              <CaretRight size={24} />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {allImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentImageIndex === idx 
                    ? 'w-6 bg-white' 
                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Verified Badge */}
        <div className="absolute top-4 left-4 bg-[#00B53F] text-white text-[10px] font-bold px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1">
          <ShieldCheck weight="fill" size={14} />
          Verified
        </div>

        {/* Image Counter */}
        {allImages.length > 0 && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Eye size={14} weight="bold" />
            <span>{currentImageIndex + 1}/{allImages.length}</span>
          </div>
        )}

        {/* Favorite & Share Buttons on Image */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-3 items-end">
          <div className="relative">
            <button 
              onClick={handleShare} 
              disabled={sharing}
              className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg text-gray-700 hover:text-[#00B53F] transition-colors disabled:opacity-70 flex items-center justify-center"
            >
              <ShareNetwork size={20} weight="bold" />
            </button>
            {shareFeedback && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                {shareFeedback}
              </div>
            )}
          </div>
          <FavoriteButton listingId={item.id} className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-3 p-3">
        {/* Main Info Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin size={14} className="text-gray-400" />
              <span>{item.location}, {new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            <div className="border border-blue-100 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-50/50">
              Promoted
            </div>
          </div>

          <h1 className="text-xl font-bold text-[#1A1A1A] mb-3 leading-tight">{item.title}</h1>
          
          <div className="flex items-baseline gap-2 mb-6">
            <p className="text-2xl font-bold text-[#00B53F]">UGX {new Intl.NumberFormat().format(item.price)}</p>
            <span className="text-[13px] text-gray-400 font-medium">Negotiable</span>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 border-2 border-[#00B53F] text-[#00B53F] py-3 rounded-xl font-bold text-sm hover:bg-[#00B53F]/5 transition-all">
              Request call back
            </button>
            <button 
              onClick={handleShowPhone}
              className="flex-1 bg-[#00B53F] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#009E37] transition-all shadow-md shadow-green-100"
            >
              <WhatsappLogo weight="bold" size={18} />
              {showPhone ? (item.user.phone || '211 123 456 789') : 'Show contact'}
            </button>
          </div>

          {/* Smart Deal Section */}
          {canSeeDealButton && (
            <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
              {activeDeal ? (
                <div className="bg-[#00B53F]/5 border border-[#00B53F]/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#00B53F] uppercase tracking-wider">Active Reservation</p>
                    <p className="text-sm text-gray-700 font-medium">You have reserved this item.</p>
                  </div>
                  <Link to="/my-deals" className="bg-[#00B53F] text-white px-4 py-2 rounded-xl text-xs font-bold">
                    View Deal
                  </Link>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    if (!user) {
                      navigate(`/login?next=/listing/${slug}`, { replace: true })
                    } else {
                      setIsDealModalOpen(true)
                    }
                  }}
                  className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg shadow-black/10"
                >
                  <Handshake weight="bold" size={22} className="text-[#00B53F]" />
                  Commit & Reserve Item (Free)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Chat with the seller</h3>
          
          {/* Quick Reply Chips */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-2">
            {['Make an offer', 'Is this available', 'Last price?', 'Where are you located?'].map((chip) => (
              <button 
                key={chip}
                onClick={() => setMessageBody(chip)}
                className="whitespace-nowrap px-4 py-2 rounded-xl border border-[#00B53F] text-[#00B53F] text-xs font-semibold hover:bg-[#00B53F]/5 transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="relative">
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={1}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm focus:border-[#00B53F] focus:outline-none focus:ring-0 transition-all resize-none"
                placeholder="Type a message"
                required
              />
            </div>
            {otherUser && !authLoading && (
              <button
                type="submit"
                disabled={sendingMessage}
                className="hidden lg:block w-full rounded-xl bg-jiji-orange px-4 py-3 text-white font-bold transition hover:bg-[#E65A00] disabled:cursor-not-allowed disabled:bg-orange-200"
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            )}
          </form>
        </div>

        {/* Description Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider text-[10px]">Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {item.description}
          </p>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Condition</p>
              <p className="text-sm font-semibold text-gray-700 capitalize">{item.condition}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Brand</p>
              <p className="text-sm font-semibold text-gray-700">{item.brand || 'Not Specified'}</p>
            </div>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-[#FFF8E6] rounded-xl p-5 border border-[#FFF0CC]">
          <h4 className="text-xs font-bold text-[#D48806] flex items-center gap-2 mb-3">
            <ShieldCheck weight="bold" size={16} />
            Safety Tips
          </h4>
          <ul className="text-[11px] text-[#A0701A] space-y-1.5 list-disc pl-4 font-medium">
            <li>Meet the seller in a public place</li>
            <li>Don't pay in advance, even for delivery</li>
            <li>Check the item before you buy it</li>
          </ul>
        </div>

        {/* Seller Info (Brief) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-lg text-gray-400 shrink-0 overflow-hidden">
              {item.user.avatar ? (
                <img src={getImageUrl(item.user.avatar)} alt={item.user.name} className="w-full h-full object-cover" />
              ) : (
                item.user.name.substring(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight flex items-center gap-1.5">
                {item.user.name}
                {item.user.is_verified && (
                  <ShieldCheck weight="fill" className="text-[#00B53F]" size={16} title="ID Verified" />
                )}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <p className="text-xs text-gray-500 font-medium">
                  Joined {new Date(item.user.created_at || Date.now()).getFullYear()}
                </p>
                {item.user.phone_verified_at && (
                  <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck weight="bold" size={12} />
                    Phone Verified
                  </p>
                )}
              </div>
            </div>
          </div>
          <Link to={`/profile/${item.user.id}`} className="text-[#00B53F] font-bold text-sm shrink-0">
            View Profile
          </Link>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white bg-black/50 p-2 rounded-full z-[110] transition-colors"
          >
            <X size={28} weight="bold" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={allImages[currentImageIndex]} 
              alt={`${item.title} fullscreen`} 
              className="max-w-full max-h-full object-contain select-none"
            />
            
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all"
                >
                  <CaretRight size={32} className="rotate-180" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all"
                >
                  <CaretRight size={32} />
                </button>
              </>
            )}
            
            {/* Modal Pagination Dots */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-[110]">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentImageIndex === idx 
                        ? 'w-8 bg-white' 
                        : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isDealModalOpen && (
        <SmartDealModal 
          isOpen={isDealModalOpen} 
          onClose={() => setIsDealModalOpen(false)}
          listing={item}
          onDealStarted={(deal) => setActiveDeal(deal)}
        />
      )}
    </div>
  )
}

export default ListingDetails
