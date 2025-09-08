'use client';

import { useState } from 'react';
import { FaBell, FaUserCircle } from 'react-icons/fa';
import { User } from '@/lib/server-auth'; // Importar el tipo User
import LogoutButton from './LogoutButton';

export default function Header({ user }: { user: User | null }) {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

  const displayName = user?.email || 'Usuario';
  const role = user?.is_super_admin ? 'Super Administrador' : 'Usuario';

  const handleNotificationsClick = () => {
    // Lógica futura para notificaciones
    alert('No hay notificaciones nuevas.');
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
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FaBell className="h-6 w-6 text-gray-600" />
        </button>
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
