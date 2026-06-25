import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChatCircle, Clock, Storefront } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

function Messages() {
  const { user, loading } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?next=/messages', { replace: true })
    }
  }, [loading, user, navigate])

  useEffect(() => {
    if (!user) {
      return
    }

    async function loadConversations() {
      setLoadingConversations(true)

      try {
        const response = await fetch('/api/conversations', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          setConversations([])
          return
        }

        const data = await response.json()
        setConversations(data.conversations || [])
      } catch (error) {
        console.error('Unable to load conversations:', error)
        setConversations([])
      } finally {
        setLoadingConversations(false)
      }
    }

    loadConversations()
  }, [user])

  if (loading || loadingConversations) {
    return <div className="min-h-screen flex items-center justify-center">Loading messages...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Messages</h1>
          <p className="text-gray-500 mt-2">Your conversations with sellers and buyers.</p>
        </div>
        <Link to="/account" className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-jiji-orange hover:text-jiji-orange">
          Back to Account
        </Link>
      </div>

      {conversations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {conversations.map((conversation) => {
            const lastMessage = conversation.messages?.[0]
            const otherUser = conversation.buyer?.id === user.id ? conversation.seller : conversation.buyer

            return (
              <Link
                key={conversation.id}
                to={`/messages/${conversation.id}`}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-3xl bg-jiji-orange/10 text-jiji-orange grid place-items-center text-2xl font-bold">
                    {conversation.listing?.title?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold">{conversation.listing?.category?.name || 'Listing'}</p>
                    <h2 className="text-xl font-semibold text-gray-900">{conversation.listing?.title}</h2>
                    <p className="mt-2 text-sm text-gray-500">With {otherUser?.name || 'the seller'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  {lastMessage ? (
                    <>
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-xl">{lastMessage.body}</p>
                      <span className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> {new Date(lastMessage.created_at).toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No messages yet.</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <ChatCircle size={48} className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold mb-3">No conversations yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-10">Start a conversation from any listing page to ask the seller a question.</p>
          <Link to="/" className="bg-jiji-orange text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#E65A00] transition-all">
            Browse Listings
          </Link>
        </div>
      )}
    </div>
  )
}

export default Messages
