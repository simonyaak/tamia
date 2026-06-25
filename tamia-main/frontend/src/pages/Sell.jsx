import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Sell() {
  const { user, loading } = useAuth()
  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')
  const [condition, setCondition] = useState('used')
  const [categoryId, setCategoryId] = useState('')
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [resultMessage, setResultMessage] = useState('')
  const navigate = useNavigate()

  // Removed automatic redirect to allow guests to fill details first.
  // Redirect happens only on submission if not logged in.

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        setCategories(data)
        if (data.length > 0) {
          setCategoryId(data[0].id)
        }
      } catch (error) {
        console.error('Unable to load categories:', error)
      }
    }

    fetchCategories()

    // Restore saved form data if returning from login
    const savedData = sessionStorage.getItem('pending_listing')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setTitle(parsed.title || '')
        setDescription(parsed.description || '')
        setPrice(parsed.price || '')
        setCity(parsed.city || '')
        setLocation(parsed.location || '')
        setCondition(parsed.condition || 'used')
        setCategoryId(parsed.category_id || '')
        // Note: files cannot be restored from sessionStorage
        sessionStorage.removeItem('pending_listing')
      } catch (e) {
        console.error('Failed to restore saved listing data')
      }
    } else if (user) {
      // Auto-fill location from user profile if no saved data
      if (user.location) {
        const parts = user.location.split(',')
        setCity(parts[0]?.trim() || '')
        setLocation(user.location)
      }
    }
  }, [user])

  // Smart Category Suggestion based on title
  useEffect(() => {
    if (!title || categories.length === 0) return

    const suggestions = {
      'phone': 'Mobile Phones',
      'iphone': 'Mobile Phones',
      'samsung': 'Mobile Phones',
      'laptop': 'Laptops',
      'car': 'Vehicles',
      'toyota': 'Vehicles',
      'house': 'Property',
      'apartment': 'Property',
      'shoes': 'Fashion',
      'shirt': 'Fashion',
      'tv': 'Electronics',
      'television': 'Electronics',
    }

    const titleLower = title.toLowerCase()
    for (const [key, categoryName] of Object.entries(suggestions)) {
      if (titleLower.includes(key)) {
        const matched = categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()))
        if (matched) {
          setCategoryId(matched.id)
          break
        }
      }
    }
  }, [title, categories])

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previews])

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files)
    setImages(files)
    setPreviews(files.map((file) => URL.createObjectURL(file)))
  }

  const removePreview = (index) => {
    setImages((current) => current.filter((_, i) => i !== index))
    setPreviews((current) => current.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setResultMessage('')
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('price', price)
    formData.append('city', city)
    formData.append('location', location)
    formData.append('condition', condition)
    formData.append('category_id', categoryId)
    images.forEach((file) => formData.append('images[]', file))

    // Handle Guest Submission
    if (!user) {
      sessionStorage.setItem('pending_listing', JSON.stringify({
        title, description, price, city, location, condition, category_id: categoryId
      }))
      navigate('/login?next=/sell&intent=post_ad')
      return
    }

    const csrfResponse = await fetch('/api/csrf-token', {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
    const csrfData = await csrfResponse.json().catch(() => ({}))
    const csrfToken = csrfData.csrf_token

    if (!csrfToken) {
      setErrors({ general: 'Unable to get a CSRF token. Please refresh and try again.' })
      setSubmitting(false)
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/listings')
    xhr.withCredentials = true
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      setSubmitting(false)
      setUploadProgress(0)

      if (xhr.status >= 200 && xhr.status < 300) {
        setResultMessage('Listing posted successfully! It is now live.')
        navigate('/', { replace: true })
        return
      }

      const data = JSON.parse(xhr.responseText || '{}')
      if (xhr.status === 401 || xhr.status === 419) {
        setErrors({ general: 'Your session has expired. Please sign in again.' })
        return
      }

      setErrors(data.errors || { general: data.message || 'Unable to submit listing. Please try again.' })
    }

    xhr.onerror = () => {
      setSubmitting(false)
      setUploadProgress(0)
      setErrors({ general: 'Unable to submit listing. Please check your connection and try again.' })
    }

    xhr.send(formData)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white border border-gray-200 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Post an Ad</h1>
        {!user && (
          <div className="mb-6 rounded-2xl bg-blue-50 p-4 border border-blue-100 flex items-start gap-3">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">You are posting as a guest.</p>
              <p className="text-xs text-blue-600">You can fill in all details now. We will ask you to log in or register when you click submit.</p>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-8">Fill in the details below. Your ad will be live immediately after you sign in.</p>

        {errors.general && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.general}</div>
        )}
        {resultMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{resultMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">City</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                list="city-suggestions"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              />
              <datalist id="city-suggestions">
                <option value="Kampala" />
                <option value="Entebbe" />
                <option value="Jinja" />
                <option value="Mbarara" />
                <option value="Gulu" />
                <option value="Mbale" />
                <option value="Arua" />
                <option value="Fort Portal" />
                <option value="Masaka" />
                <option value="Lira" />
              </datalist>
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Location</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
              required
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Category</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Condition</span>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
                required
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
              {errors.condition && <p className="mt-1 text-sm text-red-600">{errors.condition}</p>}
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2 block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-jiji-orange file:px-4 file:py-2 file:text-white file:font-semibold"
            />
            {errors['images.0'] && <p className="mt-1 text-sm text-red-600">{errors['images.0']}</p>}
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previews.map((src, index) => (
                <div key={src} className="relative overflow-hidden rounded-3xl border border-gray-200">
                  <img src={src} alt={`Preview ${index + 1}`} className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-sm text-red-600 shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="rounded-3xl overflow-hidden bg-gray-100">
              <div className="h-2 bg-jiji-orange transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-jiji-orange px-4 py-3 text-white font-semibold transition hover:bg-[#E65A00] disabled:cursor-not-allowed disabled:bg-orange-200 shadow-lg shadow-jiji-orange/20"
          >
            {submitting ? 'Processing...' : user ? 'Submit Listing' : 'Continue to Login & Post'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Sell
