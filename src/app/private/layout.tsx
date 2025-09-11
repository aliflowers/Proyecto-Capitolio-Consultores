import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server-auth';
import LogoutButton from '@/components/private/LogoutButton';
import Header from '@/components/private/Header'; // Importar el nuevo header
import Image from 'next/image'; // Importar el componente Image de Next.js
import React from 'react'; // Importar React
import Link from 'next/link'; // Importar el componente Link
import { FaTachometerAlt, FaFileAlt, FaFolderOpen, FaUsers, FaRobot, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';

export default async function PrivateLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="private-root flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-primary shadow-md flex flex-col sticky top-0 h-screen">
        <div className="p-4">
          {/* Logotipo de la empresa */}
          <div className="mb-8">
            <Image 
              src="/logo_principal_capitolio_consultores_blanco.png" 
              alt="Logo Capitolio Consultores" 
              width={180} 
              height={40} 
              priority 
            />
          </div>
          <nav className="flex flex-col space-y-2">
            <Link href="/private/" className="text-light hover:bg-blue-900 p-2 rounded-md">
              <span className="inline-flex items-center gap-2"><FaTachometerAlt /> Dashboard</span>
            </Link>
            <Link href="/private/documentos" className="text-light hover:bg-blue-900 p-2 rounded-md">
              <span className="inline-flex items-center gap-2"><FaFileAlt /> Documentos</span>
            </Link>
            <Link href="/private/expedientes" className="text-light hover:bg-blue-900 p-2 rounded-md">
              <span className="inline-flex items-center gap-2"><FaFolderOpen /> Expedientes</span>
            </Link>
            <Link href="/private/clientes" className="text-light hover:bg-blue-900 p-2 rounded-md">
              <span className="inline-flex items-center gap-2"><FaUsers /> Clientes</span>
            </Link>
            <Link href="/private/asistente" className="text-light hover:bg-blue-900 p-2 rounded-md">
              <span className="inline-flex items-center gap-2"><FaRobot /> Asistente IA</span>
            </Link>
            <Link href="/private/calendario" className="text-light hover:bg-blue-900 p-2 rounded-md">
              <span className="inline-flex items-center gap-2"><FaCalendarAlt /> Calendario</span>
            </Link>
            {/* Solo mostrar administración a super admins */}
            {user.is_super_admin && (
              <div className="mt-4 pt-4 border-t border-blue-800">
                <span className="text-xs uppercase text-blue-300 font-semibold px-2">Administración</span>
                <Link href="/private/admin/roles" className="block mt-2 text-light hover:bg-blue-900 p-2 rounded-md whitespace-nowrap">
                  <span className="inline-flex items-center gap-2"><FaShieldAlt /> Roles y Permisos</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0"> {/* Añadido min-w-0 para prevenir el desbordamiento en flexbox */}
        <Header user={user} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
