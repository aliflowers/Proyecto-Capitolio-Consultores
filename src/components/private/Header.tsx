'use client';

import { useEffect, useState } from 'react';
import { FaBell, FaUserCircle } from 'react-icons/fa';
import { User } from '@/lib/server-auth'; // Importar el tipo User
import LogoutButton from './LogoutButton';

export default function Header({ user }: { user: User | null }) {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

  const displayName = user?.email || 'Usuario';
  const role = user?.is_super_admin ? 'Super Administrador' : 'Usuario';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [openNotif, setOpenNotif] = useState(false);

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications?onlyUnread=true&limit=10', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnread(data.unread || 0);
      }
    } catch {}
  }

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 60_000); // cada 60s
    return () => clearInterval(id);
  }, []);

  const handleNotificationsClick = () => {
    setOpenNotif(!openNotif);
    if (!openNotif) loadNotifications();
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center relative">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Bienvenido de nuevo, {displayName}</h2>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleNotificationsClick}
          className="relative p-2 rounded-full hover:bg-gray-100"
        >
          <FaBell className="h-6 w-6 text-gray-600" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">{Math.min(unread, 9)}{unread>9?'+':''}</span>
          )}
        </button>
        {openNotif && (
          <div className="absolute right-16 top-12 w-96 bg-white rounded-md shadow-lg py-2 z-50 border">
            <div className="px-4 py-2 border-b font-semibold">Notificaciones</div>
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No hay notificaciones nuevas</div>
            ) : (
              <ul className="max-h-80 overflow-auto">
                {notifications.map(n => (
                  <li key={n.id} className="px-4 py-3 hover:bg-gray-50 text-sm flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{n.title}</div>
                      <div className="text-gray-600">{n.body}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.scheduled_at || n.created_at).toLocaleString()}</div>
                    </div>
                    {!n.is_read && (
                      <button className="text-primary hover:underline text-sm" onClick={async ()=>{await fetch(`/api/notifications/${n.id}`, { method:'PATCH' }); loadNotifications();}}>Marcar leído</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="relative">
          <button 
            onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FaUserCircle className="h-6 w-6 text-gray-600" />
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2">
                <p className="text-sm text-gray-700">Sesión iniciada como</p>
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
              </div>
              <div className="border-t border-gray-100 my-1"></div>
              <div className="p-1">
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
