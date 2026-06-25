import React, { useState, useEffect } from 'react';
import { Bell, Chat, Phone, Star } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import PushNotificationManager from './PushNotificationManager';

function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          'Accept': 'application/json',
          // Note: if you use a token, you might need Authorization header here, 
          // or relying on cookie session if it's set up that way.
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        }
      });
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date() })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOneAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        }
      });
      setUnreadCount(Math.max(0, unreadCount - 1));
      setNotifications(notifications.map(n => n.id === id ? { ...n, read_at: new Date() } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'chat': return <Chat size={20} className="text-blue-500" />;
      case 'phone': return <Phone size={20} className="text-jiji-green" />;
      case 'star': return <Star size={20} className="text-yellow-500" />;
      default: return <Bell size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-jiji-orange transition-colors"
      >
        <Bell size={24} weight={unreadCount > 0 ? "fill" : "regular"} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-slide-down">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-jiji-orange font-semibold hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  You have no notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => !notif.read_at && markOneAsRead(notif.id)}
                      className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.read_at ? 'bg-orange-50/30' : ''}`}
                    >
                      <div className="mt-0.5 bg-gray-100 p-2 rounded-full h-fit">
                        {getIcon(notif.icon)}
                      </div>
                      <div className="flex-1">
                        <Link to={notif.link || '#'} onClick={() => setIsOpen(false)} className="block">
                          <h4 className={`text-sm ${!notif.read_at ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.body}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </Link>
                      </div>
                      {!notif.read_at && (
                        <div className="w-2 h-2 bg-jiji-orange rounded-full mt-1.5 flex-shrink-0"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-center">
              <PushNotificationManager />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationDropdown;
