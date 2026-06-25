import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { user, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const next = new URLSearchParams(location.search).get('next') || '/'

  React.useEffect(() => {
    if (user) {
      navigate(next, { replace: true })
    }
  }, [user, navigate, next])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const result = await register({
      name,
      email,
      phone,
      password,
      password_confirmation: passwordConfirmation,
    })

    setSubmitting(false)

    if (result.success) {
      navigate(next, { replace: true })
      return
    }

    setErrors(result.errors)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Register</h1>
        <p className="text-sm text-gray-500 mb-8">Create your account to post ads and manage your listings.</p>

        {errors.general && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Phone</span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
              required
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
              required
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Confirm Password</span>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-jiji-orange focus:outline-none focus:ring-2 focus:ring-jiji-orange/20"
              required
            />
            {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-jiji-orange px-4 py-3 text-white font-semibold transition hover:bg-[#E65A00] disabled:cursor-not-allowed disabled:bg-orange-200"
          >
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">OR</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>

        <div className="mt-6">
          <a
            href={`https://tamia.onrender.com/auth/google?next=${encodeURIComponent(next)}`}
            className="flex items-center justify-center gap-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Register with Google
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already registered?{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-jiji-orange hover:text-[#E65A00]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
