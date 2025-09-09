import Link from 'next/link';
import Image from 'next/image';
import { FaInstagram, FaFacebookF, FaXTwitter, FaYoutube } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-10 mt-10">
      <div className="container mx-auto px-4">
        {/* 4 columnas en desktop para reservar espacio a la derecha para un segundo logo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          <div>
            <div className="mb-4">
              <Image 
                src="/logo_principal_capitolio_consultores_blanco.png" 
                alt="Capitolio Consultores Logo" 
                width={450}
                height={110}
                className="h-28 w-auto transition-transform duration-300 hover:scale-105"
             />
            </div>
            <p className="text-gray-300">Su socio legal de confianza con tecnología avanzada para resultados excepcionales.</p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-white hover:text-secondary transition-all duration-300 transform hover:scale-110">
                <FaInstagram className="text-xl" />
              </a>
              <a href="#" className="text-white hover:text-secondary transition-all duration-300 transform hover:scale-110">
                <FaFacebookF className="text-xl" />
              </a>
              <a href="#" className="text-white hover:text-secondary transition-all duration-300 transform hover:scale-110">
                <FaXTwitter className="text-xl" />
              </a>
              <a href="#" className="text-white hover:text-secondary transition-all duration-300 transform hover:scale-110">
                <FaYoutube className="text-xl" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-secondary transition-colors">Inicio</Link></li>
              <li><Link href="/areas-de-practica" className="text-gray-300 hover:text-secondary transition-colors">Servicios</Link></li>
              <li><Link href="/quienes-somos" className="text-gray-300 hover:text-secondary transition-colors">Nosotros</Link></li>
              <li><Link href="/blog-juridico" className="text-gray-300 hover:text-secondary transition-colors">Blog Jurídico</Link></li>
              <li><Link href="/contacto" className="text-gray-300 hover:text-secondary transition-colors">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Información de Contacto</h4>
            <p className="text-gray-300"><i className="fas fa-map-marker-alt me-2"></i>Centro Empresarial Torre Imperial,c calle Boyaca entre calle carabobo y calle Pichincha, Maracay, Edo Aragua.</p>
            <p className="text-gray-300"><i className="fas fa-phone me-2"></i>+58 424 331 3203</p>
            <p className="text-gray-300"><i className="fas fa-envelope me-2"></i>info@capitolioconsultores.com</p>
          </div>
          {/* Columna del logo secundario a la derecha */}
          <div className="flex md:justify-end">
            <Image
              src="/yovera_eliezer_logo2.png"
              alt="Yovera Eliezer Logo"
              width={320}
              height={120}
              className="h-28 w-auto opacity-95 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
        </div>
        <hr className="my-8 border-gray-700" />
        <div className="text-center text-gray-400">
          <p className="mb-2">&copy; 2025 Capitolio Consultores. Todos los derechos reservados.</p>
          <p className="text-sm">Desarrollado por Naisoft Solutions.</p>
        </div>
      </div>
    </footer>
  );
}
