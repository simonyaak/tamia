import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Handshake } from '@phosphor-icons/react';

export default function GoogleAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      navigate('/login?error=missing_token');
      return;
    }

    const exchangeToken = async () => {
      try {
        const response = await fetch('/api/auth/google/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          await refreshUser(); // Update auth context state
          navigate(data.redirect_to || '/');
        } else {
          console.error('Failed to exchange token:', data);
          navigate('/login?error=google_failed');
        }
      } catch (error) {
        console.error('Error exchanging token:', error);
        navigate('/login?error=google_failed');
      }
    };
    
    exchangeToken();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#EBF0F5] flex flex-col justify-center items-center py-12 px-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 max-w-sm w-full flex flex-col items-center">
        <div className="bg-jiji-orange p-3 rounded-[20px] mb-6 animate-pulse">
          <Handshake weight="fill" className="text-white text-3xl" />
        </div>
        <h2 className="text-xl font-bold font-outfit tracking-tight text-gray-900 mb-2">Securely logging you in...</h2>
        <p className="text-gray-500 text-sm text-center">Please wait while we complete your Google sign-in.</p>
      </div>
    </div>
  );
}
