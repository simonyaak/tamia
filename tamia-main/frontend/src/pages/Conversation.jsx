import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, PaperPlaneRight, UserCircle } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

function Conversation() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const [conversation, setConversation] = useState(null)
  const [messageBody, setMessageBody] = useState('')
  const [loadingConversation, setLoadingConversation] = useState(true)
  const [sending, setSending] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?next=/messages/${id}`, { replace: true })
    }
  }, [loading, user, navigate, id])

  useEffect(() => {
    if (!user) {
      return
    }

    async function loadConversation() {
      setLoadingConversation(true)
      try {
        const response = await fetch(`/api/conversations/${id}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          setConversation(null)
          return
        }

        const data = await response.json()
        setConversation(data.conversation)
      } catch (error) {
        console.error('Unable to load conversation:', error)
      } finally {
        setLoadingConversation(false)
      }
    }

    loadConversation()
  }, [id, user])

  const messages = useMemo(() => {
    if (!conversation?.messages) return []
    return [...conversation.messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }, [conversation])

  const recipient = useMemo(() => {
    if (!conversation || !user) return null
    return conversation.buyer?.id === user.id ? conversation.seller : conversation.buyer
  }, [conversation, user])

  const handleSendMessage = async (event) => {
    event.preventDefault()
    if (!messageBody.trim()) return
    setSending(true)

    const tokenResponse = await fetch('/api/csrf-token', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    const tokenData = await tokenResponse.json().catch(() => ({}))
    const token = tokenData.csrf_token

    const response = await fetch(`/api/conversations/${id}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': token,
      },
      body: JSON.stringify({ body: messageBody }),
    })

    setSending(false)

    if (!response.ok) {
      console.error('Unable to send message')
      return
    }

    const data = await response.json().catch(() => null)
    if (data?.message && conversation) {
      setConversation((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), data.message],
      }))
      setMessageBody('')
    }
  }

  if (loading || loadingConversation) {
    return <div className="min-h-screen flex items-center justify-center">Loading conversation...</div>
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-200 text-center">
          <p className="text-gray-600">Unable to load this conversation.</p>
          <Link to="/messages" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-jiji-orange px-5 py-3 text-sm font-semibold text-white hover:bg-[#E65A00] transition-colors">
            <ArrowLeft size={16} /> Back to Messages
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 min-h-screen">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Conversation</h1>
          <p className="text-gray-500 mt-1">With {recipient?.name || 'the other user'} about {conversation.listing?.title}</p>
        </div>
        <Link to="/messages" className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-jiji-orange hover:text-jiji-orange transition-colors">
          <ArrowLeft size={16} /> Go Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <aside className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">Listing</h2>
          <Link to={`/listing/${conversation.listing.slug}`} className="block rounded-3xl overflow-hidden border border-gray-200 mb-4">
            {conversation.listing.primaryImage ? (
              <img src={conversation.listing.primaryImage.url} alt={conversation.listing.title} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-300">No image</div>
            )}
          </Link>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{conversation.listing.title}</h3>
            <p className="text-sm text-gray-500 mt-2">UGX {new Intl.NumberFormat().format(conversation.listing.price)}</p>
          </div>
        </aside>

        <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-6">
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className={`rounded-3xl p-5 ${message.sender_id === user.id ? 'bg-jiji-orange/10 self-end text-right' : 'bg-gray-100 text-left'}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserCircle size={16} /> {message.sender.name}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(message.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-line">{message.body}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">No messages yet. Send the first message below.</div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Write a reply</span>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              />
            </label>
            <button type="submit" disabled={sending} className="inline-flex items-center gap-2 rounded-2xl bg-jiji-orange px-5 py-3 font-semibold text-white hover:bg-[#E65A00] transition-colors disabled:cursor-not-allowed disabled:bg-orange-200">
              <PaperPlaneRight size={16} /> {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Conversation
