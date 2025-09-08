'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaBriefcase, FaGavel, FaBalanceScale, FaChartLine, FaAward, FaLightbulb } from 'react-icons/fa';

export default function DerechoMercantil() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const servicios = [
    {
      titulo: 'Fusiones y Adquisiciones',
      descripcion: 'Asesoría integral en transacciones corporativas complejas, due diligence, estructuración y negociación.',
      icono: <FaBriefcase className="text-2xl text-secondary" />
    },
    {
      titulo: 'Derecho Societario',
      descripcion: 'Constitución de sociedades, reformas estatutarias, asambleas, fusiones y escisiones empresariales.',
      icono: <FaChartLine className="text-2xl text-secondary" />
    },
    {
      titulo: 'Contratos Comerciales',
      descripcion: 'Elaboración, revisión y negociación de contratos complejos, cláusulas contractuales especiales.',
      icono: <FaAward className="text-2xl text-secondary" />
    },
    {
      titulo: 'Derecho Concursal',
      descripcion: 'Asesoría en procesos de insolvencia, reorganización empresarial y crisis corporativas.',
      icono: <FaBalanceScale className="text-2xl text-secondary" />
    },
    {
      titulo: 'Propiedad Intelectual',
      descripcion: 'Registro y protección de marcas, patentes, derechos de autor y secretos comerciales.',
      icono: <FaLightbulb className="text-2xl text-secondary" />
    },
    {
      titulo: 'Cumplimiento Normativo',
      descripcion: 'Implementación de sistemas de compliance, auditorías regulatorias y gestión de riesgos.',
      icono: <FaGavel className="text-2xl text-secondary" />
    }
  ];

  const expedientesExitosos = [
    {
      titulo: 'Fusión Internacional Compleja',
      descripcion: 'Estructuración y ejecución de fusión millonaria entre empresas multinacionales con operación en 5 países.',
      resultado: 'Cierre exitoso en 6 meses con ahorro de $2.3M en impuestos'
    },
    {
      titulo: 'Reorganización Societaria',
      descripcion: 'Transformación de holding familiar con 12 empresas subsidiarias en estructura más eficiente.',
      resultado: 'Optimización del 35% en costos operativos y mejor gobierno corporativo'
    },
    {
      titulo: 'Defensa de Franquicia',
      descripcion: 'Litigio complejo en defensa de franquicia contra prácticas desleales de competencia.',
      resultado: 'Sentencia favorable que protegió la red de 45 franquiciados'
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
            <source src="/5311423-hd_1280_720_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-90"></div>
        </div>
        
        <div className="relative z-10 container mx-auto text-center px-4">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="bg-secondary text-primary w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <FaBriefcase className="text-4xl" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white animate-fade-in-up">
              Derecho Mercantil
            </h1>
            <p className="text-xl md:text-2xl max-w-4xl mx-auto mb-8 text-white animate-fade-in-up animation-delay-200">
              Asesoría jurídica especializada en transacciones comerciales, fusiones y adquisiciones, 
              contratos y derecho societario para empresas nacionales e internacionales.
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
              Especialización en Derecho Empresarial
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Nuestro equipo de abogados especializados en derecho mercantil brinda asesoría integral 
              a empresas, inversores y emprendedores en todas las etapas de su desarrollo comercial. 
              Desde la constitución de sociedades hasta complejas transacciones corporativas, 
              ofrecemos soluciones jurídicas estratégicas que impulsan el crecimiento empresarial.
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
                    El derecho mercantil es una de las ramas más dinámicas del derecho que regula las 
                    actividades empresariales y comerciales. Nuestra práctica se especializa en proporcionar 
                    asesoría jurídica integral a empresas de todos los tamaños, desde startups hasta 
                    corporaciones multinacionales.
                  </p>
                  <p className="text-gray-700">
                    Ofrecemos soluciones personalizadas que se adaptan a las necesidades específicas de 
                    cada cliente, combinando conocimiento técnico profundo con enfoque estratégico 
                    orientado a resultados.
                  </p>
                </div>
                <div className="relative h-80 rounded-lg overflow-hidden">
                  <Image 
                    src="/derecho_mercantil2.jpg"
                    alt="Derecho Mercantil"
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
                      <FaBriefcase />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">+15 años</h4>
                    <p className="text-gray-700 text-sm">Experiencia específica en derecho mercantil</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                    <div className="text-secondary text-3xl mb-4">
                      <FaChartLine />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">500+</h4>
                    <p className="text-gray-700 text-sm">Transacciones cerradas exitosamente</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                    <div className="text-secondary text-3xl mb-4">
                      <FaAward />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">98%</h4>
                    <p className="text-gray-700 text-sm">Tasa de éxito en litigios mercantiles</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'approach' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-primary text-center">Nuestro Enfoque Estratégico</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-primary">Diagnóstico Inicial</h4>
                      <p className="text-gray-700">
                        Evaluación completa de la situación jurídica y comercial del cliente para 
                        identificar oportunidades y riesgos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-primary">Estrategia Personalizada</h4>
                      <p className="text-gray-700">
                        Desarrollo de un plan jurídico adaptado a los objetivos específicos del cliente 
                        y al contexto del mercado.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-primary">Ejecución Eficiente</h4>
                      <p className="text-gray-700">
                        Implementación ágil de soluciones con seguimiento continuo y ajustes en tiempo real.
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
              Ofrecemos asesoría integral en todas las áreas del derecho mercantil, 
              con enfoque estratégico y atención personalizada.
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
              Resultados concretos que demuestran nuestra excelencia en derecho mercantil
            </p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {expedientesExitosos.map((expediente, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
              >
                <div className="text-secondary text-4xl mb-4">
                  <FaAward />
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
            <p className="text-gray-700">Experiencias reales de empresas que confían en nosotros</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <Image 
                    src="/hombre1.jpg"
                    alt="Cliente"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-primary">Carlos Rodríguez</h4>
                  <p className="text-gray-600">Director de Operaciones, TechCorp S.A.</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4">
                <FaAward />
                <FaAward />
                <FaAward />
                <FaAward />
                <FaAward />
              </div>
              <p className="text-gray-700 text-lg italic">
                "La asesoría legal de Capitolio Consultores fue fundamental para estructurar nuestra 
                última ronda de inversión. Su conocimiento en derecho societario y fusiones nos permitió 
                cerrar la operación con éxito y proteger los intereses de todos los stakeholders."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Llamado a la Acción */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Necesita Asesoría en Derecho Mercantil?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Póngase en contacto con nosotros para una consulta gratuita y descubra cómo podemos 
            ayudarle a alcanzar sus objetivos empresariales.
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
