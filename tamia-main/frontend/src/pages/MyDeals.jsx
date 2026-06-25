import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Handshake, Clock, ShieldCheck, CheckCircle, XCircle, ArrowRight, MapPin, Key } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

function MyDeals() {
  const { user, loading: authLoading } = useAuth()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login?next=/my-deals'
      return
    }
    if (user) fetchDeals()
  }, [user, authLoading])

  const fetchDeals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/deals', { credentials: 'include' })
      const data = await res.json()
      setDeals(data.deals.data)
    } catch (err) {
      console.error('Failed to load deals')
    } finally {
      setLoading(false)
    }
  }

  const getCsrfToken = async () => {
    const res = await fetch('/api/csrf-token', { credentials: 'include' })
    const data = await res.json()
    return data.csrf_token
  }

  const handleVerifyPin = async (dealId) => {
    if (pinInput.length !== 4) return
    setVerifying(true)
    try {
      const token = await getCsrfToken()
      const res = await fetch(`/api/deals/${dealId}/verify-pin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': token },
        body: JSON.stringify({ pin: pinInput })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: data.message, type: 'success' })
        fetchDeals()
      } else {
        setMessage({ text: data.message, type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Error verifying PIN', type: 'error' })
    } finally {
      setVerifying(false)
      setPinInput('')
    }
  }

  const handleAutoVerify = async (dealId) => {
    if (!navigator.geolocation) {
      setMessage({ text: 'Geolocation not supported', type: 'error' })
      return
    }

    setVerifying(true)
    setMessage({ text: 'Detecting proximity...', type: 'info' })

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords
        const token = await getCsrfToken()

        // 1. Update our location
        await fetch(`/api/deals/${dealId}/update-location`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': token },
          body: JSON.stringify({ lat: latitude, lng: longitude })
        })

        // 2. Try to verify proximity
        const res = await fetch(`/api/deals/${dealId}/verify-proximity`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': token }
        })
        
        const data = await res.json()
        if (res.ok) {
          setMessage({ text: data.message, type: 'success' })
          fetchDeals()
        } else {
          setMessage({ text: data.message, type: 'info' })
        }
      } catch (err) {
        setMessage({ text: 'Error during proximity check', type: 'error' })
      } finally {
        setVerifying(false)
      }
    }, (err) => {
      setMessage({ text: 'Please enable location permissions', type: 'error' })
      setVerifying(false)
    })
  }

  const handleAction = async (dealId, action) => {
    try {
      const token = await getCsrfToken()
      const res = await fetch(`/api/deals/${dealId}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': token }
      })
      const data = await res.json()
      setMessage({ text: data.message, type: res.ok ? 'success' : 'error' })
      fetchDeals()
    } catch (err) {
      setMessage({ text: 'Action failed', type: 'error' })
    }
  }

  if (loading || authLoading) return <div className="p-12 text-center">Loading your reservations...</div>

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#1A1A1A] text-white rounded-2xl shadow-lg">
            <Handshake size={32} weight="fill" className="text-[#00B53F]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>
            <p className="text-sm text-gray-500">Meeting handshakes & commitments</p>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 
            message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'
          }`}>
            {message.type === 'success' ? <CheckCircle weight="fill" /> : <Info weight="fill" />}
            <span className="text-sm font-bold">{message.text}</span>
            <button onClick={() => setMessage({ text: '', type: '' })} className="ml-auto opacity-50 hover:opacity-100"><XCircle size={20} /></button>
          </div>
        )}

        {deals.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <ShieldCheck size={64} weight="thin" className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No active reservations</h2>
            <p className="text-gray-500 mb-6">Reserved items will appear here. Only one reservation is allowed at a time.</p>
            <Link to="/" className="inline-block bg-[#00B53F] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#009E37] transition-all">
              Start Browsing
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {deals.map((deal) => {
              const isBuyer = deal.buyer_id === user.id;
              const statusColors = {
                active: 'bg-green-100 text-green-700',
                completed: 'bg-blue-100 text-blue-700',
                cancelled: 'bg-gray-100 text-gray-600'
              };

              return (
                <div key={deal.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                          <img 
                            src={deal.listing?.primary_image?.url || `/storage/${deal.listing?.primary_image?.path}`} 
                            className="w-full h-full object-cover" 
                            alt={deal.listing?.title}
                            onError={(e) => e.target.src = 'https://placehold.co/400x400?text=No+Image'}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1 leading-tight">{deal.listing?.title}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[deal.status]}`}>
                              {deal.status}
                            </span>
                            {deal.meeting_verified && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#00B53F] bg-green-50 px-2 py-0.5 rounded">
                                <ShieldCheck weight="fill" size={14} /> MEETING VERIFIED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={14} /> Expires {new Date(deal.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-3 min-w-[220px]">
                        {deal.status === 'active' && !deal.meeting_verified && (
                          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                            {isBuyer ? (
                              <>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Step 1: Meet & Verify</p>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Enter PIN" 
                                    maxLength={4}
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-center font-bold tracking-widest focus:ring-1 focus:ring-[#00B53F] focus:outline-none"
                                  />
                                  <button 
                                    onClick={() => handleVerifyPin(deal.id)}
                                    disabled={pinInput.length !== 4 || verifying}
                                    className="bg-[#00B53F] text-white p-2 rounded-lg disabled:opacity-50"
                                  >
                                    <Key weight="bold" />
                                  </button>
                                </div>
                                <button 
                                  onClick={() => handleAutoVerify(deal.id)}
                                  disabled={verifying}
                                  className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-[#00B53F] hover:bg-green-100 p-2 rounded-lg transition-colors"
                                >
                                  <MapPin weight="fill" /> {verifying ? 'Detecting...' : 'Verify via Proximity'}
                                </button>
                              </>
                            ) : (
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Show this PIN to Buyer</p>
                                <div className="text-3xl font-black tracking-widest text-gray-900 bg-white border-2 border-dashed border-gray-200 py-2 rounded-xl">
                                  {deal.meeting_pin}
                                </div>
                                <button 
                                  onClick={() => handleAutoVerify(deal.id)}
                                  disabled={verifying}
                                  className="mt-3 w-full flex items-center justify-center gap-2 text-[11px] font-bold text-[#00B53F] hover:bg-green-100 p-2 rounded-lg transition-colors"
                                >
                                  <MapPin weight="fill" /> Detect Buyer Nearby
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {deal.status === 'active' && isBuyer && (
                          <button 
                            onClick={() => handleAction(deal.id, 'confirm')}
                            className="w-full bg-[#00B53F] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#009E37] transition-all"
                          >
                            <CheckCircle size={18} weight="bold" />
                            Complete Purchase
                          </button>
                        )}
                        
                        {deal.status === 'active' && (
                          <button 
                            onClick={() => handleAction(deal.id, 'cancel')}
                            className="w-full border-2 border-red-50 text-red-500 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                          >
                            <XCircle size={18} weight="bold" />
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-12 bg-[#1A1A1A] rounded-3xl p-8 text-white relative overflow-hidden">
          <MapPin size={120} weight="fill" className="absolute -right-8 -bottom-8 text-white/10" />
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShieldCheck size={24} className="text-[#00B53F]" />
            How Reservations Work
          </h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-[#00B53F] font-black text-lg">01</p>
              <p className="text-sm font-bold">Reserve</p>
              <p className="text-[11px] text-gray-400">Lock the item for 48 hours. You can only reserve one item at a time.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[#00B53F] font-black text-lg">02</p>
              <p className="text-sm font-bold">Handshake</p>
              <p className="text-[11px] text-gray-400">Meet up and verify presence via GPS or by entering the Seller's secret PIN.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[#00B53F] font-black text-lg">03</p>
              <p className="text-sm font-bold">Safe Exit</p>
              <p className="text-[11px] text-gray-400">Once verified, you can safely cancel if the item is bad without hurting your score.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyDeals
