'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaGavel, FaUsers, FaHome, FaRing, FaFileContract, FaBalanceScale } from 'react-icons/fa';

export default function DerechoCivil() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const servicios = [
    {
      titulo: 'Derecho de Familia',
      descripcion: 'Asesoría en divorcios, custodia de menores, pensiones alimenticias, adopciones y mediación familiar.',
      icono: <FaUsers className="text-2xl text-secondary" />
    },
    {
      titulo: 'Sucesiones y Herencias',
      descripcion: 'Gestión de testamentos, particiones hereditarias, aceptaciones y renuncias a herencias.',
      icono: <FaFileContract className="text-2xl text-secondary" />
    },
    {
      titulo: 'Derecho Inmobiliario',
      descripcion: 'Compraventas, hipotecas, arrendamientos, propiedad horizontal y conflictos registrales.',
      icono: <FaHome className="text-2xl text-secondary" />
    },
    {
      titulo: 'Matrimonio y Convivencia',
      descripcion: 'Capitulaciones matrimoniales, convenios reguladores y contratos de convivencia.',
      icono: <FaRing className="text-2xl text-secondary" />
    },
    {
      titulo: 'Responsabilidad Civil',
      descripcion: 'Indemnizaciones por daños, accidentes de tráfico, negligencias médicas y responsabilidad contractual.',
      icono: <FaBalanceScale className="text-2xl text-secondary" />
    },
    {
      titulo: 'Derechos Reales',
      descripcion: 'Servidumbres, usufructos, derechos de superficie y protección de posesión.',
      icono: <FaGavel className="text-2xl text-secondary" />
    }
  ];

  const expedientesExitosos = [
    {
      titulo: 'Herencia Multimillonaria',
      descripcion: 'Gestión compleja de herencia con bienes inmuebles en 3 países y múltiples acreedores.',
      resultado: 'Partición exitosa en 8 meses con ahorro de $1.2M en impuestos'
    },
    {
      titulo: 'Custodia Internacional',
      descripcion: 'Caso de custodia cruzada entre Venezuela y España con niños menores de edad.',
      resultado: 'Sentencia favorable que garantizó el bienestar de los menores'
    },
    {
      titulo: 'Compra-Venta Inmobiliaria',
      descripcion: 'Estructuración de operación inmobiliaria compleja con financiación bancaria y garantías.',
      resultado: 'Cierre exitoso de operación por $3.5M sin contingencias legales'
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section con Video de Fondo */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="bg-secondary text-primary w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <FaGavel className="text-4xl" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white animate-fade-in-up">
              Derecho Civil
            </h1>
            <p className="text-xl md:text-2xl max-w-4xl mx-auto mb-8 text-white animate-fade-in-up animation-delay-200">
              Soluciones jurídicas integrales en derecho de familia, sucesiones, propiedad inmobiliaria 
              y obligaciones civiles para personas naturales y jurídicas.
            </p>
            <div className="animate-fade-in-up animation-delay-400">
              <button 
                onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-primary px-8 py-4 rounded-md hover:bg-gray-200 transition-all text-lg font-semibold shadow-lg transform hover:scale-105"
              >
                Nuestros Servicios
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Introducción */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Especialización en Derecho Civil
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Nuestro equipo de abogados especializados en derecho civil brinda asesoría integral 
              a particulares, familias y empresas en todas las materias del derecho privado. 
              Desde asuntos familiares delicados hasta complejas transacciones inmobiliarias, 
              ofrecemos soluciones jurídicas personalizadas con enfoque humanista y resultados concretos.
            </p>
          </div>

          {/* Tabs de Navegación */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === 'overview' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Visión General
            </button>
            <button
              onClick={() => setActiveTab('expertise')}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === 'expertise' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Nuestra Expertise
            </button>
            <button
              onClick={() => setActiveTab('approach')}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === 'approach' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Nuestro Enfoque
            </button>
          </div>

          {/* Contenido de los Tabs */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">Visión General del Servicio</h3>
                  <p className="text-gray-700 mb-4">
                    El derecho civil es la rama del derecho que regula las relaciones personales y patrimoniales 
                    entre particulares. Nuestra práctica se especializa en proporcionar asesoría jurídica 
                    integral en todas las materias del derecho privado, con énfasis en soluciones prácticas 
                    y sostenibles en el tiempo.
                  </p>
                  <p className="text-gray-700">
                    Ofrecemos servicios personalizados que combinan conocimiento técnico profundo con 
                    sensibilidad humana, entendiendo que cada expediente involucra situaciones personales únicas 
                    que requieren tratamiento especializado.
                  </p>
                </div>
                <div className="relative h-80 rounded-lg overflow-hidden">
                  <Image 
                    src="/derecho_civil2.jpg"
                    alt="Derecho Civil"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {activeTab === 'expertise' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-primary text-center">Nuestra Expertise Especializada</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                    <div className="text-secondary text-3xl mb-4">
                      <FaGavel />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">+12 años</h4>
                    <p className="text-gray-700 text-sm">Experiencia específica en derecho civil</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                    <div className="text-secondary text-3xl mb-4">
                      <FaUsers />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">800+</h4>
                    <p className="text-gray-700 text-sm">Expedientes civiles resueltos exitosamente</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                    <div className="text-secondary text-3xl mb-4">
                      <FaHome />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">95%</h4>
                    <p className="text-gray-700 text-sm">Tasa de satisfacción en clientes civiles</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'approach' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-primary text-center">Nuestro Enfoque Humanista</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-primary">Escucha Activa</h4>
                      <p className="text-gray-700">
                        Comprensión profunda de las circunstancias personales y objetivos del cliente 
                        para desarrollar estrategias adaptadas a sus necesidades reales.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-primary">Solución Constructiva</h4>
                      <p className="text-gray-700">
                        Enfoque orientado a resultados positivos que busque la mejor solución para todas 
                        las partes involucradas, especialmente en asuntos familiares.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-primary">Confidencialidad Absoluta</h4>
                      <p className="text-gray-700">
                        Trato discreto y profesional de asuntos personales con estricto respeto a la 
                        privacidad y dignidad de nuestros clientes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sección de Servicios Especializados */}
      <section id="servicios" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-primary">Servicios Especializados</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Ofrecemos asesoría integral en todas las áreas del derecho civil, 
              con enfoque personalizado y atención humanista.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200"
              >
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    {servicio.icono}
                  </div>
                  <h3 className="text-xl font-semibold text-primary">{servicio.titulo}</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{servicio.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Expedientes de Éxito */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">Expedientes de Éxito</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Resultados concretos que demuestran nuestra excelencia en derecho civil
            </p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {expedientesExitosos.map((expediente, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
              >
                <div className="text-secondary text-4xl mb-4">
                  <FaGavel />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-primary">{expediente.titulo}</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">{expediente.descripcion}</p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-green-600 font-semibold">{expediente.resultado}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Testimonios */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">Lo Que Dicen Nuestros Clientes</h2>
            <p className="text-gray-700">Experiencias reales de personas que confían en nosotros</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <Image 
                    src="/Mujer2.jpg"
                    alt="Cliente"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-primary">Ana Martínez</h4>
                  <p className="text-gray-600">Empresaria y Propietaria</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                <FaGavel />
                <FaGavel />
                <FaGavel />
                <FaGavel />
                <FaGavel />
              </div>
              <p className="text-gray-700 text-lg italic">
                "La gestión de la herencia de mis padres fue un proceso emocionalmente difícil, 
                pero el equipo de Capitolio Consultores lo hizo extremadamente fácil. Su conocimiento 
                en derecho sucesorio y su trato humano fueron fundamentales para resolver todo 
                de manera eficiente y respetuosa."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Llamado a la Acción */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Necesita Asesoría en Derecho Civil?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Póngase en contacto con nosotros para una consulta gratuita y descubra cómo podemos 
            ayudarle a resolver sus asuntos civiles con profesionalismo y sensibilidad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-secondary text-primary px-8 py-4 rounded-md hover:bg-yellow-400 transition-all text-lg font-semibold shadow-lg transform hover:scale-105">
              Agendar Consulta
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-md hover:bg-white hover:text-primary transition-all text-lg font-semibold shadow-lg transform hover:scale-105">
              Descargar Guía Gratuita
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
