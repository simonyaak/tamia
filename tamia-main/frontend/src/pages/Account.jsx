import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { List, GridFour, MapPin, Clock, Camera, User } from '@phosphor-icons/react'

async function getCsrfToken() {
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
  return data.csrf_token
}

const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `/storage/${path}`
}

function Account() {
  const { user, loading, refreshUser } = useAuth()
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isBusiness, setIsBusiness] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [coverPhotoFile, setCoverPhotoFile] = useState(null)
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null)
  const [coverPhotoLoading, setCoverPhotoLoading] = useState(false)
  const [listingView, setListingView] = useState('list')
  const [listings, setListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [listingAction, setListingAction] = useState(null)
  const [listingMessage, setListingMessage] = useState('')
  const [promotingListing, setPromotingListing] = useState(null)
  const [promotionLoading, setPromotionLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verificationFeedback, setVerificationFeedback] = useState('')
  const [paymentInstructions, setPaymentInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mobile_money')

  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?next=/account', { replace: true })
    }
  }, [loading, user, navigate])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setBio(user.bio || '')
      setLocation(user.location || '')
      setWhatsappNumber(user.whatsapp_number || '')
      setIsBusiness(user.is_business || false)
      if (user.avatar) {
        setAvatarPreview(getImageUrl(user.avatar))
      }
      if (user.cover_photo) {
        setCoverPhotoPreview(getImageUrl(user.cover_photo))
      }
    }
  }, [user])

  useEffect(() => {
    async function loadListings() {
      if (!user) {
        setListings([])
        setListingsLoading(false)
        return
      }

      setListingsLoading(true)
      try {
        const response = await fetch('/api/user/listings', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          setListings([])
          return
        }

        const data = await response.json()
        setListings(data.listings || [])
      } catch (error) {
        console.error('Unable to load user listings:', error)
        setListings([])
      } finally {
        setListingsLoading(false)
      }
    }

    loadListings()
  }, [user])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setErrors({})

    const csrfToken = await getCsrfToken()
    const response = await fetch('/api/user', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrfToken,
      },
      body: JSON.stringify({ 
        name, 
        email, 
        phone, 
        bio, 
        location, 
        whatsapp_number: whatsappNumber, 
        is_business: isBusiness 
      }),
    })

    setSubmitting(false)

    if (response.ok) {
      setMessage('Profile updated successfully.')
      await refreshUser()
      return
    }

    const data = await response.json().catch(() => ({}))
    setErrors(data.errors || { general: data.message || 'Unable to update profile.' })
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    
    // Auto-upload
    setAvatarLoading(true)
    setMessage('')
    setErrors({ ...errors, avatar: null })
    
    const csrfToken = await getCsrfToken()
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setMessage('Profile photo updated successfully.')
        setAvatarFile(null)
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url)
        }
        await refreshUser()
      } else {
        const data = await response.json()
        setErrors({ ...errors, avatar: data.message || 'Avatar upload failed.' })
        // Revert preview if failed
        if (user && user.avatar) {
          setAvatarPreview(getImageUrl(user.avatar))
        } else {
          setAvatarPreview(null)
        }
      }
    } catch (err) {
      setErrors({ ...errors, avatar: 'An error occurred during upload.' })
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setCoverPhotoFile(file)
    setCoverPhotoPreview(URL.createObjectURL(file))
    
    // Auto-upload
    setCoverPhotoLoading(true)
    setMessage('')
    setErrors({ ...errors, cover_photo: null })
    
    const csrfToken = await getCsrfToken()
    const formData = new FormData()
    formData.append('cover_photo', file)

    try {
      const response = await fetch('/api/user/cover-photo', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setMessage('Cover photo updated successfully.')
        setCoverPhotoFile(null)
        if (data.cover_url) {
          setCoverPhotoPreview(data.cover_url)
        }
        await refreshUser()
      } else {
        const data = await response.json()
        setErrors({ ...errors, cover_photo: data.message || 'Cover photo upload failed.' })
        // Revert preview if failed
        if (user && user.cover_photo) {
          setCoverPhotoPreview(getImageUrl(user.cover_photo))
        } else {
          setCoverPhotoPreview(null)
        }
      }
    } catch (err) {
      setErrors({ ...errors, cover_photo: 'An error occurred during upload.' })
    } finally {
      setCoverPhotoLoading(false)
    }
  }

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Delete this listing?')) {
      return
    }

    setListingAction(listingId)
    setListingMessage('')
    const csrfToken = await getCsrfToken()

    const response = await fetch(`/listings/${listingId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrfToken,
      },
    })

    setListingAction(null)

    if (response.ok) {
      setListingMessage('Listing removed successfully.')
      setListings((current) => current.filter((item) => item.id !== listingId))
      return
    }

    const data = await response.json().catch(() => ({}))
    setListingMessage(data.message || 'Unable to remove listing. Please try again.')
  }

  const handlePromote = async (listingId, type, amount) => {
    setPromotionLoading(true)
    const csrfToken = await getCsrfToken()
    setPaymentInstructions('')
    
    try {
      const response = await fetch(`/api/listings/${listingId}/promote`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          type,
          amount,
          days: 7, // Default 7 days for now
          payment_method: paymentMethod,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        if (data.payment_pending) {
          setListingMessage(data.message || 'Mobile money payment initiated. Follow the instructions to complete your payment.')
          setPaymentInstructions(data.instructions || '')
        } else {
          setListingMessage(`Ad promoted to ${type} successfully!`)
          // Refresh listings
          const res = await fetch('/api/user/listings', { credentials: 'include' })
          const refreshData = await res.json()
          setListings(refreshData.listings || [])
          setPromotingListing(null)
        }
      } else {
        setListingMessage(data.message || 'Promotion failed.')
      }
    } catch (err) {
      setListingMessage('An error occurred during promotion.')
    } finally {
      setPromotionLoading(false)
    }
  }

  const handleRequestVerification = async () => {
    setVerifying(true)
    setVerificationFeedback('')
    const csrfToken = await getCsrfToken()

    try {
      const response = await fetch('/api/user/request-verification', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
      })

      if (response.ok) {
        setVerificationFeedback('Verification request submitted successfully. We will review your profile shortly.')
        await refreshUser()
      } else {
        const data = await response.json()
        setVerificationFeedback(data.message || 'Unable to submit request.')
      }
    } catch (err) {
      setVerificationFeedback('An error occurred. Please try again later.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading account...</div>
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view your account</div>
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white border border-gray-200 p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-sm text-gray-500">Update your profile and create a new listing from here.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/sell"
              className="inline-flex items-center justify-center rounded-2xl bg-jiji-orange px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E65A00]"
            >
              Post an Ad
            </Link>
            <Link
              to="/favorites"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-jiji-orange hover:text-jiji-orange"
            >
              Saved Items
            </Link>
          </div>
        </div>

        {/* Verification Section */}
        <div className={`mb-8 rounded-[24px] border p-6 ${user.is_verified ? 'bg-green-50 border-green-100' : user.verification_requested_at ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm ${user.is_verified ? 'bg-green-600 text-white' : 'bg-white text-gray-400'}`}>
                {user.is_verified ? '✓' : '?'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {user.is_verified ? 'Verified Identity' : user.verification_requested_at ? 'Pending Verification' : 'Get Verified'}
                </h3>
                <p className="text-sm text-gray-600">
                  {user.is_verified 
                    ? 'Your profile is verified. You have earned a blue trust badge on all your listings.' 
                    : user.verification_requested_at 
                      ? 'Your request is being reviewed by our team. This usually takes 24-48 hours.'
                      : 'Build trust with buyers by verifying your identity. Submit a request and an admin will review it.'}
                </p>
              </div>
            </div>
            {!user.is_verified && !user.verification_requested_at && (
              <button
                onClick={handleRequestVerification}
                disabled={verifying}
                className="whitespace-nowrap rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50"
              >
                {verifying ? 'Submitting...' : 'Request Verification'}
              </button>
            )}
          </div>
          {verificationFeedback && (
            <div className="mt-4 text-xs font-semibold text-gray-700 animate-pulse">{verificationFeedback}</div>
          )}
        </div>

        {/* Cover Photo */}
        <div className="mb-6">
          <div className="relative group w-full h-32 md:h-48 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg overflow-hidden flex items-center justify-center">
            {coverPhotoPreview && (
              <img src={coverPhotoPreview} alt="Cover Preview" className={`w-full h-full object-cover ${coverPhotoLoading ? 'opacity-50' : ''}`} />
            )}
            {coverPhotoLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <label className={`absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full cursor-pointer shadow-lg hover:bg-black/70 transition backdrop-blur-sm ${coverPhotoLoading ? 'pointer-events-none opacity-50' : ''}`}>
              <Camera size={20} weight="bold" />
              <input type="file" className="hidden" accept="image/*" onChange={handleCoverPhotoChange} disabled={coverPhotoLoading} />
            </label>
          </div>
          {errors.cover_photo && <p className="mt-2 text-xs text-red-600 font-semibold text-center">{errors.cover_photo}</p>}
        </div>

        <div className="mb-8 flex flex-col items-center -mt-16 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 bg-gray-100 flex items-center justify-center relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className={`w-full h-full object-cover ${avatarLoading ? 'opacity-50' : ''}`} />
              ) : (
                <User size={64} className="text-gray-300" />
              )}
              {avatarLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-jiji-orange border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <label className={`absolute bottom-0 right-0 p-2 bg-jiji-orange text-white rounded-full cursor-pointer shadow-lg hover:bg-[#E65A00] transition ${avatarLoading ? 'pointer-events-none opacity-50' : ''}`}>
              <Camera size={20} weight="bold" />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={avatarLoading} />
            </label>
          </div>
          {errors.avatar && <p className="mt-2 text-xs text-red-600 font-semibold">{errors.avatar}</p>}
        </div>

        {message && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>
        )}

        {errors.general && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Phone</span>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                    required
                  />
                </div>
                {user.phone_verified_at ? (
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-100">
                    <span className="text-lg leading-none">✓</span> Verified
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const csrfToken = await getCsrfToken();
                      const response = await fetch('/api/user/verify-phone', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                          'Accept': 'application/json',
                          'X-CSRF-TOKEN': csrfToken,
                        },
                      });
                      if (response.ok) {
                        setMessage('Phone verified successfully!');
                        await refreshUser();
                      } else {
                        const data = await response.json();
                        setErrors({ ...errors, phone: data.message || 'Verification failed.' });
                      }
                    }}
                    className="px-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition whitespace-nowrap"
                  >
                    Verify Phone
                  </button>
                )}
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Location</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kampala, Uganda"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">WhatsApp Number</span>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 211912345678"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
              />
              {errors.whatsapp_number && <p className="mt-1 text-sm text-red-600">{errors.whatsapp_number}</p>}
            </label>

            <div className="flex items-center gap-3 h-full pt-6">
              <input
                type="checkbox"
                id="isBusiness"
                checked={isBusiness}
                onChange={(e) => setIsBusiness(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-jiji-orange focus:ring-jiji-orange"
              />
              <label htmlFor="isBusiness" className="text-sm font-semibold text-gray-700 cursor-pointer">
                I am a Business / Professional Seller
              </label>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Bio / About Me</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell buyers about yourself or your business..."
              rows={3}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20 resize-none"
            />
            {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-jiji-orange px-4 py-3 text-white font-semibold transition hover:bg-[#E65A00] disabled:cursor-not-allowed disabled:bg-orange-200"
          >
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-4xl rounded-3xl bg-white border border-gray-200 p-8 shadow-sm mt-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
            <p className="text-sm text-gray-500">Manage your posted ads and remove any listings you no longer want.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-2 border border-gray-200 rounded-2xl p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => setListingView('list')}
                className={`p-2 rounded-lg transition ${
                  listingView === 'list'
                    ? 'bg-white shadow-sm text-jiji-orange'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List weight="bold" size={20} />
              </button>
              <button
                type="button"
                onClick={() => setListingView('grid')}
                className={`p-2 rounded-lg transition ${
                  listingView === 'grid'
                    ? 'bg-white shadow-sm text-jiji-orange'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GridFour weight="bold" size={20} />
              </button>
            </div>
            <Link
              to="/sell"
              className="inline-flex items-center justify-center rounded-2xl bg-jiji-orange px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E65A00]"
            >
              Post another Ad
            </Link>
          </div>
        </div>

        {listingMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{listingMessage}</div>
        )}

        {paymentInstructions && (
          <div className="mb-4 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-semibold">Mobile Money Instructions</p>
            <p className="mt-2 whitespace-pre-line">{paymentInstructions}</p>
          </div>
        )}

        {listingsLoading ? (
          <div className="text-center py-12 text-gray-500">Loading your ads...</div>
        ) : listings.length > 0 ? (
          listingView === 'list' ? (
            <div className="space-y-4">
              {listings.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <Link to={`/listing/${item.slug}`} className="text-lg font-semibold text-gray-900 hover:text-jiji-orange">
                        {item.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {item.views_count} Views</span>
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> {item.phone_clicks_count || 0} Contacts</span>
                        <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-600">{item.status}</span>
                        {item.is_featured && <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700">★ Featured</span>}
                        {item.is_urgent && <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">⚡ Urgent</span>}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
                        <span>Price: <span className="font-semibold text-gray-700">UGX {new Intl.NumberFormat().format(item.price)}</span></span>
                        <span>City: <span className="font-semibold text-gray-700">{item.city}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPromotingListing(item)}
                        className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                      >
                        Promote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(item.id)}
                        disabled={listingAction === item.id}
                        className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {listingAction === item.id ? 'Removing...' : 'Delete'}
                      </button>
                      <Link
                        to={`/listing/${item.slug}`}
                        className="rounded-2xl border border-gray-100 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-jiji-orange hover:text-jiji-orange"
                      >
                        View Ad
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((item) => (
                <div key={item.id} className="rounded-lg bg-white shadow-sm border border-gray-100 hover:shadow-lg transition flex flex-col justify-between">
                  <div className="h-[140px] bg-gray-50 relative overflow-hidden rounded-t-lg">
                    {item.primary_image ? (
                      <img src={item.primary_image.url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-semibold">
                        No Image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    {item.is_featured && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        ★ FEATURED
                      </div>
                    )}
                    {item.is_urgent && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm">
                        ⚡ URGENT
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between border-t border-gray-100">
                    <div>
                      <Link to={`/listing/${item.slug}`} className="text-sm font-semibold text-gray-900 hover:text-jiji-orange line-clamp-2">
                        {item.title}
                      </Link>
                      <p className="text-jiji-orange font-bold text-base mt-2">UGX {new Intl.NumberFormat().format(item.price)}</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex text-[10px] text-gray-500 gap-2 uppercase tracking-wide">
                        <span className="flex items-center gap-1"><MapPin weight="bold" size={12} /> {item.city}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setPromotingListing(item)}
                          className="w-full rounded-lg bg-amber-50 border border-amber-200 px-2 py-2 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
                        >
                          Promote
                        </button>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteListing(item.id)}
                            disabled={listingAction === item.id}
                            className="w-full sm:flex-1 rounded-lg border border-red-100 bg-red-50 px-2 py-2 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            {listingAction === item.id ? 'Removing...' : 'Delete'}
                          </button>
                          <Link
                            to={`/listing/${item.slug}`}
                            className="w-full sm:flex-1 rounded-lg border border-gray-100 bg-white px-2 py-2 text-[11px] font-semibold text-gray-700 transition hover:border-jiji-orange hover:text-jiji-orange text-center"
                          >
                            View Ad
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-10 text-center text-gray-500">
            You have not posted any ads yet. Create your first listing to start selling.
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {promotingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Promote your Ad</h2>
            <p className="text-sm text-gray-500 mb-8">Boost your listing's visibility and reach more buyers.</p>
            
            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment method</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile_money"
                      checked={paymentMethod === 'mobile_money'}
                      onChange={() => setPaymentMethod('mobile_money')}
                      className="h-4 w-4 text-jiji-orange"
                    />
                    <span className="text-sm font-medium text-gray-700">Mobile Money</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mock_wallet"
                      checked={paymentMethod === 'mock_wallet'}
                      onChange={() => setPaymentMethod('mock_wallet')}
                      className="h-4 w-4 text-jiji-orange"
                    />
                    <span className="text-sm font-medium text-gray-700">Wallet (instant)</span>
                  </label>
                </div>
              </div>

              <button 
                onClick={() => handlePromote(promotingListing.id, 'featured', 1500)}
                disabled={promotionLoading}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-amber-100 bg-amber-50 hover:border-amber-400 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-amber-900">Featured Ad ★</p>
                  <p className="text-xs text-amber-700">Show at the top for 7 days</p>
                </div>
                <p className="font-bold text-amber-900">UGX 1,500</p>
              </button>

              <button 
                onClick={() => handlePromote(promotingListing.id, 'urgent', 500)}
                disabled={promotionLoading}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-red-100 bg-red-50 hover:border-red-400 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-red-900">Urgent Badge ⚡</p>
                  <p className="text-xs text-red-700">Eye-catching urgency badge</p>
                </div>
                <p className="font-bold text-red-900">UGX 500</p>
              </button>
            </div>

            <button 
              onClick={() => setPromotingListing(null)}
              className="w-full mt-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Account
