import React, { useState } from 'react'
import { Handshake, Clock, X, Info, CheckCircle, ShieldCheck } from '@phosphor-icons/react'

function SmartDealModal({ listing, isOpen, onClose, onDealStarted }) {
  const [duration, setDuration] = useState('48')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleStartDeal = async () => {
    setSubmitting(true)
    setError('')

    try {
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      const { csrf_token } = await csrfResponse.json()

      const response = await fetch('/api/deals', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrf_token,
        },
        body: JSON.stringify({
          listing_id: listing.id,
          duration_hours: parseInt(duration),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reserve item')
      }

      setSuccess(true)
      setTimeout(() => {
        onDealStarted(data.deal)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-[#1A1A1A] p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
          <div className="w-16 h-16 bg-[#00B53F]/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Handshake size={40} weight="fill" className="text-[#00B53F]" />
          </div>
          <h2 className="text-xl font-bold">Reserve this Item</h2>
          <p className="text-sm text-gray-400 mt-1">Free Commitment System</p>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle size={60} weight="fill" className="text-[#00B53F] mx-auto" />
              <h3 className="text-lg font-bold text-gray-900">Item Reserved!</h3>
              <p className="text-sm text-gray-500">You have successfully committed to this item. The seller has been notified.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">The Rule of One</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      You can only have **one active reservation** at a time. This proves to the seller that you are 100% serious.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} weight="fill" className="text-[#00B53F]" />
                    <span className="text-sm font-bold text-gray-800">Reliability Protection</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    When you meet, you'll use a **Meeting Handshake** (PIN or GPS) to prove you showed up. This protects your reputation even if you don't buy.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">How long do you need?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: '24', label: '24 Hours' },
                      { val: '48', label: '2 Days' },
                      { val: '72', label: '3 Days' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setDuration(opt.val)}
                        className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${
                          duration === opt.val
                            ? 'border-[#00B53F] bg-[#00B53F]/5 text-[#00B53F]'
                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                onClick={handleStartDeal}
                disabled={submitting}
                className="w-full bg-[#00B53F] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#009E37] transition-all shadow-xl shadow-green-100 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? 'Reserving...' : 'Commit & Reserve Item'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartDealModal
