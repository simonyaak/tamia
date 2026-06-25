import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, UserMinus } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

function FollowButton({ sellerId, initialIsFollowing = false, initialFollowers = 0, onToggle }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowers)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  useEffect(() => {
    setFollowersCount(initialFollowers)
  }, [initialFollowers])

  const handleToggle = async () => {
    if (!user) {
      navigate(`/login?next=/profile/${sellerId}`)
      return
    }

    if (saving) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const tokenResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      })
      const tokenData = await tokenResponse.json().catch(() => ({}))
      const token = tokenData.csrf_token

      const response = await fetch(`/api/users/${sellerId}/follow`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': token,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.message || 'Unable to update follow status.')
        return
      }

      setIsFollowing(data.following)
      setFollowersCount(data.follower_count || 0)

      if (onToggle) {
        onToggle(data.following, data.follower_count || 0)
      }
    } catch (err) {
      console.error('Follow error:', err)
      setError('Unable to update follow status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isFollowing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-jiji-orange text-white hover:bg-[#e65a00]'} ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isFollowing ? <UserMinus size={18} weight="bold" /> : <UserPlus size={18} weight="bold" />}
        {isFollowing ? 'Following' : 'Follow Seller'}
      </button>
      <div className="text-center text-xs text-gray-500">
        {followersCount.toLocaleString()} follower{followersCount === 1 ? '' : 's'}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default FollowButton
