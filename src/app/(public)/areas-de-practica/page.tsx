'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaBriefcase, FaGavel, FaBalanceScale } from 'react-icons/fa';

export default function Servicios() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const areasDePractica = [
    {
      id: 'mercantil',
      titulo: 'Derecho Mercantil',
      descripcion: 'Asesoría integral en transacciones comerciales, fusiones y adquisiciones, contratos y derecho societario.',
      icono: <FaBriefcase className="text-4xl" />,
      imagen: '/derecho_mercantil.jpg',
      detalles: [
        'Asesoría en fusiones y adquisiciones',
        'Elaboración y revisión de contratos comerciales',
        'Derecho societario y corporativo',
        'Resolución de conflictos mercantiles',
        'Cumplimiento normativo y regulatorio'
      ]
    },
    {
      id: 'civil',
      titulo: 'Derecho Civil',
      descripcion: 'Soluciones en derecho de familia, sucesiones, propiedad inmobiliaria y obligaciones civiles.',
      icono: <FaGavel className="text-4xl" />,
      imagen: '/derecho_civl.jpg',
      detalles: [
        'Derecho de familia y matrimonial',
        'Sucesiones y herencias',
        'Propiedad inmobiliaria y registral',
        'Obligaciones y responsabilidad civil',
        'Derechos reales y posesión'
      ]
    },
    {
      id: 'laboral',
      titulo: 'Derecho Laboral',
      descripcion: 'Representación en conflictos laborales, negociación colectiva y consultoría en relaciones laborales.',
      icono: <FaBalanceScale className="text-4xl" />,
      imagen: '/derecho_laboral.jpg',
      detalles: [
        'Conflictos laborales individuales y colectivos',
        'Negociación colectiva y convenios',
        'Seguridad social y prestaciones',
        'Despidos y indemnizaciones',
        'Auditorías laborales y compliance'
      ]
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section con Video de Fondo */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video de fondo con efecto overlay */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/8061443-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-90"></div>
        </div>
        
        {/* Contenido sobre el parallax */}
        <div className="relative z-10 container mx-auto text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white animate-fade-in-up">
            Nuestros Servicios
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-white animate-fade-in-up animation-delay-200">
            Especialización jurídica de excelencia en las áreas fundamentales del derecho
          </p>
          <div className="animate-fade-in-up animation-delay-400">
            <button 
              onClick={() => document.getElementById('areas-practica')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-secondary text-primary px-8 py-4 rounded-md hover:bg-yellow-400 transition-all text-lg font-semibold shadow-lg transform hover:scale-105"
            >
              Explorar Áreas de Práctica
            </button>
          </div>
        </div>
        
        {/* Indicador de scroll */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Sección de Áreas de Práctica */}
      <section id="areas-practica" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-primary">Áreas de Práctica Especializadas</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Ofrecemos asesoría legal integral en las áreas fundamentales del derecho, 
              con enfoque estratégico y resultados medibles para nuestros clientes.
            </p>
          </div>

          {/* Grid de Áreas de Práctica */}
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {areasDePractica.map((area, index) => (
              <div 
                key={area.id}
                className="group bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
              >
                {/* Imagen con overlay */}
                <div className="relative h-64 overflow-hidden">
                  <Image 
                    src={area.imagen}
                    alt={area.titulo}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-secondary/60"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white bg-secondary/90 p-6 rounded-full backdrop-blur-sm">
                      {area.icono}
                    </div>
                  </div>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-primary text-center">{area.titulo}</h3>
                  <p className="text-gray-700 mb-6 text-center leading-relaxed">{area.descripcion}</p>
                  
                  {/* Lista de servicios específicos */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 text-secondary text-center">Servicios Especializados</h4>
                    <ul className="space-y-2">
                      {area.detalles.map((detalle, idx) => (
                        <li key={idx} className="flex items-start text-gray-600">
                          <span className="text-secondary mr-2">•</span>
                          <span className="text-sm">{detalle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Botón de acción */}
                  <div className="text-center">
                    <Link 
                      href={`/servicios/${area.id}`}
                      className="bg-primary text-white px-6 py-3 rounded-md hover:bg-secondary transition-all duration-300 font-semibold transform hover:scale-105"
                    >
                      Saber Más
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Valor Agregado */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-white">¿Por Qué Elegir Nuestros Servicios?</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Compromiso, excelencia y resultados que marcan la diferencia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-white text-3xl mb-4">
                <FaBriefcase />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Experiencia</h3>
              <p className="text-white/90">Más de 15 años brindando soluciones legales efectivas</p>
            </div>

            <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-white text-3xl mb-4">
                <FaGavel />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Especialización</h3>
              <p className="text-white/90">Enfoque específico en las áreas fundamentales del derecho</p>
            </div>

            <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-white text-3xl mb-4">
                <FaBalanceScale />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Resultados</h3>
              <p className="text-white/90">Soluciones concretas que generan valor para nuestros clientes</p>
            </div>

            <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-white text-3xl mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Calidad</h3>
              <p className="text-white/90">Estándares de excelencia en cada servicio que brindamos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Llamado a la Acción */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">¿Necesita Asesoría Legal Especializada?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Póngase en contacto con nosotros para una consulta gratuita y descubra cómo podemos ayudarle a alcanzar sus objetivos legales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-secondary text-primary px-8 py-4 rounded-md hover:bg-yellow-400 transition-all text-lg font-semibold shadow-lg transform hover:scale-105">
              Agendar Consulta
            </button>
            <button className="border-2 border-primary text-primary px-8 py-4 rounded-md hover:bg-primary hover:text-white transition-all text-lg font-semibold shadow-lg transform hover:scale-105">
              Ver Todos los Servicios
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
