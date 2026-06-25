import React, { useState, useEffect, useRef } from 'react'
import { Handshake, MagnifyingGlass, PlusCircle, List, X, House, Heart, Chat, DownloadSimple } from '@phosphor-icons/react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationDropdown from './NotificationDropdown'

function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showScrollNav, setShowScrollNav] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const lastScrollY = useRef(0)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY
      const diff = lastScrollY.current - currentScroll
      if (Math.abs(diff) < 12) return

      if (diff > 0 && currentScroll > 120) {
        setShowScrollNav(true)
      } else if (diff < 0) {
        setShowScrollNav(false)
      }
      lastScrollY.current = currentScroll
    }

    lastScrollY.current = window.scrollY
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav className="bg-white border-b border-gray-100 py-4 px-4 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link to="/" className="flex items-center gap-1.5">
          <div className="bg-jiji-orange p-[6px] rounded-[14px] shadow-[0_2px_10px_rgba(242,133,0,0.2)]">
            <Handshake weight="fill" className="text-white text-xl md:text-2xl" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-gray-900" style={{ fontFamily: "'Unbounded', cursive" }}>
            Ta<span className="text-jiji-green">mia</span>
          </span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <input 
              type="text" 
              placeholder="I'm looking for..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-full py-2.5 px-6 focus:ring-2 focus:ring-jiji-orange transition-all text-sm"
            />
            <button type="submit" className="absolute right-2 top-1.5 bg-jiji-orange text-white p-1.5 rounded-full hover:bg-[#E65A00] transition-colors">
              <MagnifyingGlass weight="bold" />
            </button>
          </form>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {isInstallable && (
            <button 
              onClick={handleInstall}
              className="flex items-center gap-2 text-jiji-orange hover:bg-jiji-orange/5 px-3 py-1.5 rounded-lg transition-colors border border-jiji-orange/20"
            >
              <DownloadSimple weight="bold" />
              Get App
            </button>
          )}
          {!loading && (
            user ? (
              <>
                <NotificationDropdown />
                <span className="text-gray-700 hidden lg:inline">Hi, {user.name}</span>
                <Link to="/favorites" className="text-gray-700 hover:text-jiji-orange">Saved</Link>
                <Link to="/my-deals" className="text-gray-700 hover:text-jiji-orange">My Deals</Link>
                <Link to="/account" className="text-gray-700 hover:text-jiji-orange">Account</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-jiji-orange">Admin</Link>
                )}
                <button type="button" onClick={logout} className="text-gray-700 hover:text-jiji-orange">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-jiji-orange">Sign In</Link>
                <Link to="/register" className="text-gray-700 hover:text-jiji-orange">Register</Link>
              </>
            )
          )}
          <Link to="/sell" className="bg-jiji-orange text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all hover:bg-[#E65A00]">
            <PlusCircle weight="bold" /> SELL
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificationDropdown />}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-jiji-orange p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-4 animate-slide-down">
          <form onSubmit={handleSearch} className="relative w-full mb-4">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-full py-2.5 px-6 focus:ring-2 focus:ring-jiji-orange transition-all text-sm"
            />
            <button type="submit" className="absolute right-2 top-1.5 bg-jiji-orange text-white p-1.5 rounded-full hover:bg-[#E65A00] transition-colors">
              <MagnifyingGlass weight="bold" size={16} />
            </button>
          </form>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            {isInstallable && (
              <button 
                onClick={handleInstall}
                className="w-full flex items-center gap-3 text-jiji-orange bg-jiji-orange/5 px-4 py-3 rounded-xl font-bold transition-all border border-jiji-orange/10 mb-2"
              >
                <DownloadSimple weight="bold" size={20} />
                Download Tamia App
              </button>
            )}
            {!loading && (
              user ? (
                <>
                  <div className="text-gray-700 font-semibold px-4 py-2">Hi, {user.name}</div>
                  <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-jiji-orange px-4 py-2 font-semibold">Saved</Link>
                  <Link to="/my-deals" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-jiji-orange px-4 py-2 font-semibold">My Deals</Link>
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-jiji-orange px-4 py-2 font-semibold">Account</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-jiji-orange px-4 py-2 font-semibold">Admin</Link>
                  )}
                  <button type="button" onClick={() => { logout(); setMobileMenuOpen(false) }} className="block w-full text-left text-gray-700 hover:text-jiji-orange px-4 py-2 font-semibold">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-jiji-orange px-4 py-2 font-semibold">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-jiji-orange px-4 py-2 font-semibold">Register</Link>
                </>
              )
            )}
          </div>

          <Link to="/sell" onClick={() => setMobileMenuOpen(false)} className="block w-full bg-jiji-orange text-white px-6 py-3 rounded-lg text-center font-semibold transition-all hover:bg-[#E65A00]">
            + Post an Ad
          </Link>
        </div>
      )}

      {showScrollNav && !mobileMenuOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
          <nav className="flex w-full items-center justify-between gap-2 rounded-none border-t border-gray-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-xl transition-all">
            <Link to="/" className={`flex min-w-[64px] flex-col items-center justify-center rounded-full px-2 py-2 text-[11px] font-semibold ${location.pathname === '/' ? 'text-jiji-orange' : 'text-gray-500 hover:text-jiji-orange'}`}>
              <House size={20} weight="bold" />
              Home
            </Link>
            <Link to="/favorites" className={`flex min-w-[64px] flex-col items-center justify-center rounded-full px-2 py-2 text-[11px] font-semibold ${location.pathname === '/favorites' ? 'text-jiji-orange' : 'text-gray-500 hover:text-jiji-orange'}`}>
              <Heart size={20} weight="bold" />
              Saved
            </Link>
            <Link to="/sell" className={`flex min-w-[64px] flex-col items-center justify-center rounded-full px-2 py-2 text-[11px] font-semibold ${location.pathname === '/sell' ? 'text-jiji-orange' : 'text-gray-500 hover:text-jiji-orange'}`}>
              <PlusCircle size={20} weight="bold" />
              Sell
            </Link>
            <Link to="/messages" className={`flex min-w-[64px] flex-col items-center justify-center rounded-full px-2 py-2 text-[11px] font-semibold ${location.pathname === '/messages' ? 'text-jiji-orange' : 'text-gray-500 hover:text-jiji-orange'}`}>
              <Chat size={20} weight="bold" />
              Messages
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}

export default Navbar
