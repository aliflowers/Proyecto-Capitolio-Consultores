'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa';
import ParallaxImage from '@/components/public/ParallaxImage';

export default function QuienesSomos() {
  const [activeSection, setActiveSection] = useState('historia');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['historia', 'mision', 'vision', 'valores'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-secondary">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/5519762-hd_1920_1080_30fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-90"></div>
        </div>
        
        <div className="relative z-10 container mx-auto text-center px-4">
          <div className="bg-secondary text-primary w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white animate-fade-in-up">
            Quiénes Somos
          </h1>
          <p className="text-xl md:text-2xl max-w-4xl mx-auto mb-8 text-white animate-fade-in-up animation-delay-200">
            Conozca nuestra trayectoria, valores y el equipo que hace de Capitolio Consultores 
            un referente en asesoría legal estratégica en Venezuela.
          </p>
          <div className="animate-fade-in-up animation-delay-400">
            <button 
              onClick={() => scrollToSection('historia')}
              className="bg-white text-primary px-8 py-4 rounded-md hover:bg-gray-200 transition-all text-lg font-semibold shadow-lg transform hover:scale-105"
            >
              Nuestra Historia
            </button>
          </div>
        </div>
      </section>

      {/* Navegación por Secciones */}
      <nav className="sticky top-0 bg-white shadow-md z-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 py-4">
              <button
              onClick={() => scrollToSection('historia')}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeSection === 'historia' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Nuestra Historia
            </button>
            <button
              onClick={() => scrollToSection('mision')}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeSection === 'mision' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Misión
            </button>
            <button
              onClick={() => scrollToSection('vision')}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeSection === 'vision' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Visión
            </button>
            <button
              onClick={() => scrollToSection('valores')}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeSection === 'valores' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Valores
            </button>
          </div>
        </div>
      </nav>

      {/* Sección de Historia */}
      <section id="historia" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Nuestra Historia
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Capitolio Consultores nació con la visión de transformar la práctica legal mediante la 
              integración de tecnología avanzada y experiencia jurídica. Fundada en 2010, hemos crecido 
              para convertirnos en referentes en asesoría legal estratégica.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ParallaxImage 
              src="/hombre1.jpg"
              alt="Historia de Capitolio Consultores"
            />
            
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Desde Nuestros Inicios</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    2010
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Fundación</h4>
                    <p className="text-gray-700">
                      Inauguramos nuestras operaciones con un enfoque innovador en derecho mercantil 
                      y civil, combinando tradición jurídica con tecnología avanzada.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    2015
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Expansión</h4>
                    <p className="text-gray-700">
                      Ampliamos nuestra práctica al derecho laboral y corporativo, estableciendo 
                      alianzas estratégicas con despachos internacionales.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    2020
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Innovación</h4>
                    <p className="text-gray-700">
                      Implementamos IA y procesamiento de documentos avanzado, posicionándonos 
                      como pioneros en tecnología legal en Venezuela.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    2025
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Liderazgo</h4>
                    <p className="text-gray-700">
                      Hoy somos referentes en asesoría legal estratégica con más de 500 clientes 
                      satisfechos y reconocimientos internacionales.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Misión */}
      <section id="mision" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Nuestra Misión
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Brindar soluciones legales innovadoras y efectivas que impulsen el éxito de nuestros clientes, 
              combinando experiencia jurídica con tecnología avanzada para resultados medibles.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Compromiso con la Excelencia</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Resultados Concretos</h4>
                    <p className="text-gray-700">
                      Nos enfocamos en obtener resultados tangibles que generen valor real para nuestros clientes.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Innovación Constante</h4>
                    <p className="text-gray-700">
                      Utilizamos tecnología avanzada para ofrecer servicios legales más eficientes y precisos.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Compromiso Personal</h4>
                    <p className="text-gray-700">
                      Tratamos cada expediente con dedicación exclusiva y atención personalizada a las necesidades.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <ParallaxImage 
              src="/Mujer2.jpg"
              alt="Misión de Capitolio Consultores"
            />
          </div>
        </div>
      </section>

      {/* Sección de Visión */}
      <section id="vision" className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Nuestra Visión
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Ser el despacho legal más avanzado y confiable en Venezuela, reconocido por nuestra 
              excelencia, uso de tecnología y compromiso con resultados medibles para nuestros clientes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ParallaxImage 
              src="/hombre2.jpg"
              alt="Visión de Capitolio Consultores"
            />
            
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Hacia el Futuro</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Liderazgo Tecnológico</h4>
                    <p className="text-gray-700">
                      Consolidarnos como líderes en la integración de IA y tecnología en la práctica legal.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Expansión Internacional</h4>
                    <p className="text-gray-700">
                      Extender nuestra presencia y servicios a mercados internacionales latinoamericanos.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Impacto Social</h4>
                    <p className="text-gray-700">
                      Contribuir al desarrollo del sistema legal venezolano con iniciativas pro bono.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Valores */}
      <section id="valores" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Nuestros Valores
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Los principios que guían cada decisión, acción y relación en Capitolio Consultores.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200">
              <div className="text-secondary text-4xl mb-6 flex justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary text-center">Integridad</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Actuamos con honestidad, transparencia y ética profesional en todas nuestras relaciones.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200">
              <div className="text-secondary text-4xl mb-6 flex justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.816-.591 1.78-.8 2.746-.21 1-.335 2.02-.39 3.04-.055 1.02-.065 2.05-.03 3.08a1 1 0 00.385 1.45c.33.214.713.403 1.116.57.816.334 1.78.591 2.746.8.966.21 1.987.335 3.007.39 1.02.055 2.05.065 3.08.03a1 1 0 00.88-1.45c-.214-.33-.558-.614-.88-.822-.322-.214-.713-.403-1.116-.57-.816-.334-1.78-.591-2.746-.8-.966-.21-1.987-.335-3.007-.39-1.02-.055-2.05-.065-3.08-.03z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary text-center">Excelencia</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Buscamos la perfección en cada servicio, superando las expectativas de nuestros clientes.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200">
              <div className="text-secondary text-4xl mb-6 flex justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary text-center">Innovación</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Adoptamos tecnología avanzada para ofrecer soluciones legales más eficientes y precisas.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200">
              <div className="text-secondary text-4xl mb-6 flex justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary text-center">Compromiso</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Dedicamos tiempo exclusivo a cada expediente, asegurando atención personalizada y resultados.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200">
              <div className="text-secondary text-4xl mb-6 flex justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary text-center">Confidencialidad</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Protegemos la privacidad y datos sensibles de nuestros clientes con estricto rigor.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200">
              <div className="text-secondary text-4xl mb-6 flex justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary text-center">Calidad</h3>
              <p className="text-gray-700 text-center leading-relaxed">
                Mantenemos estándares de excelencia en cada servicio que brindamos a nuestros clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Equipo */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">Nuestro Equipo</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Profesionales altamente calificados comprometidos con la excelencia legal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary shadow-lg">
                  <Image 
                    src="/hombre1.jpg"
                    alt="Dr. Juan Pérez"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-primary text-center">Dr. Juan Pérez</h3>
              <p className="text-gray-600 text-center mb-4">Socio Principal</p>
              <div className="flex justify-center mb-4">
                <div className="flex text-yellow-400">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
              </div>
              <p className="text-gray-700 text-center leading-relaxed">
                Especialista en derecho mercantil con más de 15 años de experiencia en transacciones corporativas.
              </p>
              <div className="text-center mt-6">
                <Link href="#" className="btn border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-semibold">
                  LinkedIn
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary shadow-lg">
                  <Image 
                    src="/Mujer2.jpg"
                    alt="Dra. María González"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-primary text-center">Dra. María González</h3>
              <p className="text-gray-600 text-center mb-4">Asociada Senior</p>
              <div className="flex justify-center mb-4">
                <div className="flex text-yellow-400">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
              </div>
              <p className="text-gray-700 text-center leading-relaxed">
                Expertise en derecho civil y familiar, con enfoque humanista y resultados concretos.
              </p>
              <div className="text-center mt-6">
                <Link href="#" className="btn border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-semibold">
                  LinkedIn
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary shadow-lg">
                  <Image 
                    src="/hombre2.jpg"
                    alt="Dr. Carlos Rodríguez"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-primary text-center">Dr. Carlos Rodríguez</h3>
              <p className="text-gray-600 text-center mb-4">Especialista Mercantil</p>
              <div className="flex justify-center mb-4">
                <div className="flex text-yellow-400">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
              </div>
              <p className="text-gray-700 text-center leading-relaxed">
                Conocimiento profundo del derecho societario y corporativo, fusiones y adquisiciones.
              </p>
              <div className="text-center mt-6">
                <Link href="#" className="btn border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-semibold">
                  LinkedIn
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary shadow-lg">
                  <Image 
                    src="/Mujer3.jpg"
                    alt="Dra. Ana Martínez"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-primary text-center">Dra. Ana Martínez</h3>
              <p className="text-gray-600 text-center mb-4">Especialista Laboral</p>
              <div className="flex justify-center mb-4">
                <div className="flex text-yellow-400">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
              </div>
              <p className="text-gray-700 text-center leading-relaxed">
                Representación en conflictos laborales y negociación colectiva con enfoque estratégico.
              </p>
              <div className="text-center mt-6">
                <Link href="#" className="btn border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors text-sm font-semibold">
                  LinkedIn
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Llamado a la Acción */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Necesita Asesoría Legal Especializada?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Póngase en contacto con nosotros para una consulta gratuita y descubra cómo podemos 
            ayudarle a alcanzar sus objetivos legales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-secondary text-primary px-8 py-4 rounded-md hover:bg-yellow-400 transition-all text-lg font-semibold shadow-lg transform hover:scale-105">
              Agendar Consulta
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-md hover:bg-white hover:text-primary transition-all text-lg font-semibold shadow-lg transform hover:scale-105">
              Descargar Brochure
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
