'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const servicesMenuRef = useRef<HTMLDivElement>(null);
  const aboutMenuRef = useRef<HTMLDivElement>(null);
  const servicesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aboutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manejar el scroll para efectos visuales
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manejar clics fuera del menú para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeMenu &&
        servicesMenuRef.current && 
        !servicesMenuRef.current.contains(event.target as Node) &&
        aboutMenuRef.current && 
        !aboutMenuRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  const handleMenuEnter = (menuName: string) => {
    // Clear any existing timeout
    if (menuName === 'services' && servicesTimeoutRef.current) {
      clearTimeout(servicesTimeoutRef.current);
      servicesTimeoutRef.current = null;
    }
    if (menuName === 'about' && aboutTimeoutRef.current) {
      clearTimeout(aboutTimeoutRef.current);
      aboutTimeoutRef.current = null;
    }
    
    setActiveMenu(menuName);
  };

  const handleMenuLeave = (menuName: string) => {
    // Set timeout to close menu after a delay
    const timeout = setTimeout(() => {
      setActiveMenu(null);
    }, 300); // Increased delay to 300ms for better UX

    if (menuName === 'services') {
      servicesTimeoutRef.current = timeout;
    } else if (menuName === 'about') {
      aboutTimeoutRef.current = timeout;
    }
  };

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (servicesTimeoutRef.current) {
        clearTimeout(servicesTimeoutRef.current);
      }
      if (aboutTimeoutRef.current) {
        clearTimeout(aboutTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'backdrop-blur-md bg-primary/80 shadow-lg' 
        : 'bg-primary'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo principal (izquierda) */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo_principal_menu_header.png" 
              alt="Capitolio Consultores Logo" 
              width={300}
              height={75}
              className="h-20 w-auto transition-transform duration-300 hover:scale-105"
              priority
            />
          </Link>

          {/* Navegación de escritorio centrada */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            <Link 
              href="/" 
              className="px-4 py-2 rounded-md text-white hover:bg-white/20 hover:text-black transition-all duration-300 font-medium"
            >
              Inicio
            </Link>
            
            {/* Menú Servicios con Submenú */}
            <div 
              className="relative group"
              ref={servicesMenuRef}
              onMouseEnter={() => handleMenuEnter('services')}
              onMouseLeave={() => handleMenuLeave('services')}
            >
              <Link 
                href="/areas-de-practica" 
                className={`px-4 py-2 rounded-md flex items-center font-medium transition-all duration-300 text-white ${
                  activeMenu === 'services' ? 'bg-white/30 text-black' : 'hover:bg-white/20 hover:text-black'
                }`}
              >
                Servicios
                <svg 
                  className={`w-4 h-4 ml-1 transition-transform duration-300 ${
                    activeMenu === 'services' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              
              {/* Submenú Servicios */}
              <div 
                className={`absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-2 z-50 transition-all duration-300 origin-top ${
                  activeMenu === 'services' 
                    ? 'opacity-100 scale-y-100 transform' 
                    : 'opacity-0 scale-y-95 transform pointer-events-none'
                }`}
              >
                <Link 
                  href="/servicios/mercantil" 
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-200 hover:text-primary transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                  onClick={() => setActiveMenu(null)}
                >
                  <div className="font-medium">Derecho Mercantil</div>
                  <div className="text-sm text-gray-600 mt-1">Asesoría comercial y corporativa</div>
                </Link>
                <Link 
                  href="/servicios/civil" 
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-200 hover:text-primary transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                  onClick={() => setActiveMenu(null)}
                >
                  <div className="font-medium">Derecho Civil</div>
                  <div className="text-sm text-gray-600 mt-1">Derechos individuales y familiares</div>
                </Link>
                <Link 
                  href="/servicios/laboral" 
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-200 hover:text-primary transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                  onClick={() => setActiveMenu(null)}
                >
                  <div className="font-medium">Derecho Laboral</div>
                  <div className="text-sm text-gray-600 mt-1">Relaciones laborales y empleo</div>
                </Link>
              </div>
            </div>

            {/* Menú Nosotros con Submenú */}
            <div 
              className="relative group"
              ref={aboutMenuRef}
              onMouseEnter={() => handleMenuEnter('about')}
              onMouseLeave={() => handleMenuLeave('about')}
            >
              <Link 
                href="/quienes-somos" 
                className={`px-4 py-2 rounded-md flex items-center font-medium transition-all duration-300 text-white ${
                  activeMenu === 'about' ? 'bg-white/30 text-black' : 'hover:bg-white/20 hover:text-black'
                }`}
              >
                Nosotros
                <svg 
                  className={`w-4 h-4 ml-1 transition-transform duration-300 ${
                    activeMenu === 'about' ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              
              {/* Submenú Nosotros */}
              <div 
                className={`absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-2 z-50 transition-all duration-300 origin-top ${
                  activeMenu === 'about' 
                    ? 'opacity-100 scale-y-100 transform' 
                    : 'opacity-0 scale-y-95 transform pointer-events-none'
                }`}
              >
                <Link 
                  href="/quienes-somos#historia" 
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-200 hover:text-primary transition-colors duration-200 border-b border-gray-100"
                  onClick={() => setActiveMenu(null)}
                >
                  <div className="font-medium">Nuestra Historia</div>
                  <div className="text-sm text-gray-600 mt-1">Trayectoria y experiencia</div>
                </Link>
                <Link 
                  href="/quienes-somos#mision" 
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-200 hover:text-primary transition-colors duration-200 border-b border-gray-100"
                  onClick={() => setActiveMenu(null)}
                >
                  <div className="font-medium">Misión</div>
                  <div className="text-sm text-gray-600 mt-1">Nuestro propósito</div>
                </Link>
                <Link 
                  href="/quienes-somos#vision" 
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-200 hover:text-primary transition-colors duration-200 border-b border-gray-100"
                  onClick={() => setActiveMenu(null)}
                >
                  <div className="font-medium">Visión</div>
                  <div className="text-sm text-gray-600 mt-1">Hacia dónde vamos</div>
                </Link>
                <Link 
                  href="/quienes-somos#valores" 
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-200 hover:text-primary transition-colors duration-200"
                  onClick={() => setActiveMenu(null)}
                >
                  <div className="font-medium">Valores</div>
                  <div className="text-sm text-gray-600 mt-1">Principios que nos guían</div>
                </Link>
              </div>
            </div>
            
            <Link 
              href="/blog-juridico" 
              className="px-4 py-2 rounded-md text-white hover:bg-white/20 hover:text-black transition-all duration-300 font-medium"
            >
              Blog Jurídico
            </Link>
            
            <Link 
              href="/contacto" 
              className="px-4 py-2 rounded-md text-white hover:bg-white/20 hover:text-black transition-all duration-300 font-medium"
            >
              Contacto
            </Link>
            
            <Link 
              href="/login" 
              className="bg-secondary text-primary px-6 py-2 rounded-md hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105 font-medium flex items-center ml-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Acceso Abogados
            </Link>
          </div>

          {/* Logo secundario (derecha, solo escritorio) */}
          <div className="hidden lg:block">
            <Image
              src="/yovera_eliezer_logo1.png"
              alt="Yovera Eliezer Logo"
              width={180}
              height={60}
              className="h-14 w-auto ml-4 opacity-95 hover:opacity-100 transition-opacity duration-200"
            />
          </div>

          {/* Botón menú móvil */}
          <div className="lg:hidden">
            <button className="p-2 rounded-md hover:bg-white/20 transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
