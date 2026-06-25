import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Handshake } from '@phosphor-icons/react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import CategoryView from './pages/CategoryView'
import ListingDetails from './pages/ListingDetails'
import SearchView from './pages/SearchView'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import Conversation from './pages/Conversation'
import Favorites from './pages/Favorites'
import Messages from './pages/Messages'
import Sell from './pages/Sell'
import UserProfile from './pages/UserProfile'
import AdminDashboard from './pages/AdminDashboard'
import MyDeals from './pages/MyDeals'
import GoogleAuth from './pages/GoogleAuth'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#EBF0F5] font-inter">
          <Navbar />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:slug" element={<CategoryView />} />
            <Route path="/listing/:slug" element={<ListingDetails />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/google-auth" element={<GoogleAuth />} />
            <Route path="/account" element={<Account />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Conversation />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/my-deals" element={<MyDeals />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<div className="p-20 text-center text-2xl font-bold">404 - Page Not Found</div>} />
          </Routes>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-100 py-12 px-6 md:px-12">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-1.5">
                <div className="bg-jiji-orange p-[6px] rounded-[14px]">
                  <Handshake weight="fill" className="text-white text-base md:text-lg" />
                </div>
                <span className="text-xl font-bold font-outfit tracking-tight text-gray-900">Ta<span className="text-jiji-green">mia</span></span>
              </div>
              <p className="text-gray-400 text-sm">
                &copy; 2026 Tamia South Sudan. Professional Marketplace Solution.
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
