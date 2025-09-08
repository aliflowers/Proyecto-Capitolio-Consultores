'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import { FaSignOutAlt } from 'react-icons/fa'; // Importar el icono

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error cerrando sesión:', error)
      // Aunque falle, intentar redirigir al login
      router.push('/login')
    }
  }

  return (
    <button 
      onClick={handleLogout} 
      className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg text-red-500 dark:text-red-400 bg-red-50 dark:bg-gray-700/50 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-200 font-semibold"
    >
      <FaSignOutAlt className="h-5 w-5" />
      <span>Cerrar Sesión</span>
    </button>
  )
}
