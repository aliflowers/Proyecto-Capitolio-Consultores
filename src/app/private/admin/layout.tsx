import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server-auth';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  
  // Solo super admins pueden acceder a la sección de administración
  if (!user || !user.is_super_admin) {
    redirect('/private');
  }

  return (
    <div className="w-full">
      {/* Sub-navegación de administración */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/private/admin/roles"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Roles y Permisos
            </Link>
            <Link
              href="/private/admin/users"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Gestión de Usuarios
            </Link>
            <Link
              href="/private/admin/audit"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Auditoría
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
