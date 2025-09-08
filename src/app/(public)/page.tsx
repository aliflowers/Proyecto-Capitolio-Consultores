'use client';

import Link from 'next/link';
import { FaBriefcase, FaGavel, FaBalanceScale, FaAward, FaLightbulb, FaUserFriends, FaChartLine, FaStar } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [isHoveringTestimonials, setIsHoveringTestimonials] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  const videos = [
    '/5311423-hd_1280_720_25fps.mp4',
    '/5519762-hd_1920_1080_30fps.mp4',
    '/5519944-hd_1920_1080_30fps.mp4',
    '/8061443-hd_1920_1080_25fps.mp4',
    '/8061655-hd_1920_1080_25fps.mp4'
  ];

  const testimonials = [
    {
      name: "María González",
      position: "Directora Ejecutiva",
      image: "/Mujer1.jpg",
      text: "La asesoría legal de Capitolio Consultores fue fundamental para resolver nuestro caso complejo de derecho mercantil. Su enfoque estratégico y atención personalizada marcaron la diferencia.",
      rating: 5
    },
    {
      name: "Carlos Rodríguez",
      position: "Gerente de Recursos Humanos",
      image: "/hombre1.jpg",
      text: "Contratamos sus servicios para un conflicto laboral y el resultado superó nuestras expectativas. Profesionales comprometidos y altamente calificados.",
      rating: 5
    },
    {
      name: "Ana Martínez",
      position: "Propietaria",
      image: "/Mujer2.jpg",
      text: "La representación legal que recibimos fue impecable. Su equipo demostró un conocimiento profundo del derecho civil y una dedicación excepcional.",
      rating: 5
    },
    {
      name: "Luis Fernández",
      position: "Director Financiero",
      image: "/hombre2.jpg",
      text: "La expertise de Capitolio Consultores en derecho corporativo nos ha ahorrado miles de dólares en disputas legales. Un equipo verdaderamente profesional.",
      rating: 5
    },
    {
      name: "Carmen López",
      position: "Emprendedora",
      image: "/Mujer3.jpg",
      text: "Desde que confié mis asuntos legales a Capitolio Consultores, puedo enfocarme en hacer crecer mi negocio sin preocupaciones legales.",
      rating: 5
    },
    {
      name: "Jorge Ramírez",
      position: "Director de Operaciones",
      image: "/hombre3.jpg",
      text: "El equipo de Capitolio Consultores comprendió nuestras necesidades empresariales y proporcionó soluciones legales innovadoras que impulsaron nuestro crecimiento.",
      rating: 5
    }
  ];

  // Función para manejar cuando un video termina
  const handleVideoEnd = (index: number) => {
    if (index === currentVideoIndex) {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
    }
  };

  // Función para reiniciar y reproducir el video cuando se vuelve activo
  useEffect(() => {
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      currentVideo.currentTime = 0;
      currentVideo.play().catch((e: Error) => console.log('Error al reproducir video:', e));
    }
  }, [currentVideoIndex]);

  // Sistema de carrusel automático de videos con duración máxima de 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
    }, 3000); // 3 segundos por video

    return () => clearInterval(interval);
  }, [videos.length]);

  // Efecto de transición suave entre videos con fade
  useEffect(() => {
    const videoElements = videoRefs.current;
    if (videoElements.length > 0) {
      // Resetear todos los videos
      videoElements.forEach((video, index) => {
        if (video) {
          video.style.opacity = index === currentVideoIndex ? '1' : '0';
        }
      });

      // Aplicar fade in/out con animación CSS
      const currentVideo = videoElements[currentVideoIndex];
      if (currentVideo) {
        currentVideo.style.transition = 'opacity 1s ease-in-out';
        currentVideo.style.opacity = '1';
      }

      // Fade out del video anterior
      const prevIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
      const prevVideo = videoElements[prevIndex];
      if (prevVideo) {
        prevVideo.style.transition = 'opacity 1s ease-in-out';
        prevVideo.style.opacity = '0';
      }
    }
  }, [currentVideoIndex, videos.length]);

  // Efecto de animación para elementos al hacer scroll
  useEffect(() => {
    const handleScrollAnimations = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.85) {
          element.classList.add('animated');
        }
      });
    };

    window.addEventListener('scroll', handleScrollAnimations);
    handleScrollAnimations();

    return () => window.removeEventListener('scroll', handleScrollAnimations);
  }, []);

  // Renderizar estrellas de calificación
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar 
        key={i} 
        className={i < rating ? "text-yellow-400" : "text-gray-300"} 
      />
    ));
  };

  // Carrusel automático de testimonios con desplazamiento horizontal cada 3 segundos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isHoveringTestimonials) {
      interval = setInterval(() => {
        setCurrentTestimonialIndex((prevIndex) => {
          const totalGroups = Math.ceil(testimonials.length / 3);
          const newIndex = prevIndex + 1;
          // Resetear el índice cuando llega al final de los grupos
          if (newIndex >= totalGroups) {
            return 0;
          }
          return newIndex;
        });
      }, 3000); // 3 segundos por grupo de testimonios
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isHoveringTestimonials, testimonials.length]);

  // Intersection Observer para efecto de scroll con animaciones
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('appear');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observar todos los elementos con clase 'reveal'
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      revealElements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, []);

  // Efecto de fade in para secciones al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.75) {
          section.classList.add('fade-in-visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Ejecutar una vez al cargar

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efecto de scroll en cascada con transiciones suaves
  useEffect(() => {
    const handleScrollAnimations = () => {
      const elements = document.querySelectorAll('.fade-in-item');
      elements.forEach((element, index) => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.85) {
          setTimeout(() => {
            element.classList.add('fade-in-visible');
          }, index * 100); // Retraso escalonado de 100ms por elemento
        }
      });
    };

    window.addEventListener('scroll', handleScrollAnimations);
    handleScrollAnimations(); // Ejecutar una vez al cargar

    return () => window.removeEventListener('scroll', handleScrollAnimations);
  }, []);

  // Efecto de fade in para elementos al hacer scroll
  useEffect(() => {
    const handleScrollFade = () => {
      const fadeElements = document.querySelectorAll('.fade-in-element');
      fadeElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.9) {
          element.classList.add('opacity-100', 'translate-y-0');
        }
      });
    };

    window.addEventListener('scroll', handleScrollFade);
    handleScrollFade();

    return () => window.removeEventListener('scroll', handleScrollFade);
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video de fondo con fade - Playlist secuencial de 5 videos */}
        <div className="absolute inset-0">
          {videos.map((video, index) => (
            <video
              key={index}
              ref={(el) => {
                if (el) {
                  videoRefs.current[index] = el;
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
              }`}
              autoPlay
              loop={false}
              muted
              playsInline
              onEnded={() => handleVideoEnd(index)}
            >
              <source src={video} type="video/mp4" />
            </video>
          ))}
        </div>
        
        {/* Overlay con el degradado original */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-80"></div>
        
        {/* Contenido sobre el video */}
        <div className="relative z-10 container mx-auto text-center px-4">
          <h1 className="text-5xl font-bold mb-4 text-white animate-fade-in-up">Asesoría Legal Estratégica. Resultados Excepcionales.</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8 text-white animate-fade-in-up animation-delay-200">Capitolio Consultores: Su socio legal de confianza con tecnología avanzada</p>
          <div className="flex justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Link href="/areas-de-practica" className="btn bg-white text-primary px-6 py-3 rounded-md hover:bg-gray-200 transition-colors text-lg font-semibold">Nuestros Servicios</Link>
            <Link href="/contacto" className="btn border border-white text-white px-6 py-3 rounded-md hover:bg-white hover:text-primary transition-colors text-lg font-semibold">Agende una Consulta</Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-12 bg-gray-50 reveal">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold mb-10 relative after:content-[''] after:absolute after:bottom-[-10px] after:left-1/2 after:-translate-x-1/2 after:w-[505px] after:h-1 after:bg-secondary">Nuestras Áreas de Práctica</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="card shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 reveal">
              <div className="card-body text-center p-6">
                <div className="text-primary text-5xl mb-4 flex justify-center">
                  <FaBriefcase />
                </div>
                <h4 className="text-xl font-semibold mb-2">Derecho Mercantil</h4>
                <p className="text-gray-700">Asesoría integral en transacciones comerciales, fusiones y adquisiciones, contratos y derecho societario.</p>
              </div>
            </div>
            <div className="card shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 reveal animation-delay-200">
              <div className="card-body text-center p-6">
                <div className="text-primary text-5xl mb-4 flex justify-center">
                  <FaGavel />
                </div>
                <h4 className="text-xl font-semibold mb-2">Derecho Civil</h4>
                <p className="text-gray-700">Soluciones en derecho de familia, sucesiones, propiedad inmobiliaria y obligaciones civiles.</p>
              </div>
            </div>
            <div className="card shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 reveal animation-delay-400">
              <div className="card-body text-center p-6">
                <div className="text-primary text-5xl mb-4 flex justify-center">
                  <FaBalanceScale />
                </div>
                <h4 className="text-xl font-semibold mb-2">Derecho Laboral</h4>
                <p className="text-gray-700">Representación en conflictos laborales, negociación colectiva y consultoría en relaciones laborales.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Section - New Section */}
      <section id="por-que-elegirnos" className="py-12 bg-gray-200 reveal">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold mb-10 relative after:content-[''] after:absolute after:bottom-[-10px] after:left-1/2 after:-translate-x-1/2 after:w-[268px] after:h-1 after:bg-secondary">Por Qué Elegirnos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
            <div className="text-center p-6 reveal">
              <div className="bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaAward className="text-3xl" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Experiencia</h4>
              <p className="text-gray-700">Más de 15 años brindando soluciones legales efectivas en diversas áreas del derecho.</p>
            </div>
            <div className="text-center p-6 reveal animation-delay-200">
              <div className="bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLightbulb className="text-3xl" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Innovación</h4>
              <p className="text-gray-700">Utilizamos tecnología avanzada para ofrecer servicios legales más eficientes.</p>
            </div>
            <div className="text-center p-6 reveal animation-delay-400">
              <div className="bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserFriends className="text-3xl" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Compromiso Personal</h4>
              <p className="text-gray-700">Tratamos cada caso con dedicación exclusiva y atención personalizada.</p>
            </div>
            <div className="text-center p-6 reveal animation-delay-600">
              <div className="bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaChartLine className="text-3xl" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Resultados Medibles</h4>
              <p className="text-gray-700">Nuestra prioridad es obtener resultados concretos para nuestros clientes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - New Section */}
      <section 
        id="testimonios"
        className="py-12 bg-gray-50 reveal"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold mb-10 relative after:content-[''] after:absolute after:bottom-[-10px] after:left-1/2 after:-translate-x-1/2 after:w-[505px] after:h-1 after:bg-secondary">Lo Que Dicen Nuestros Clientes</h2>
          
          {/* Carrusel de Testimonios 3D Profesional */}
          <div className="max-w-6xl mx-auto">
            <div className="relative overflow-hidden py-8 -mx-4 px-4">
              {/* Fondo con degradado de azul a amarillo */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary"
                onMouseEnter={() => setIsHoveringTestimonials(true)}
                onMouseLeave={() => setIsHoveringTestimonials(false)}
              ></div>
              
              {/* Contenido del carrusel con slider horizontal continuo */}
              <div className="relative z-10">
                <div className="flex overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out" 
                    style={{ transform: `translateX(-${currentTestimonialIndex * 100}%)` }}
                  >
                    {/* Renderizar testimonios en grupos de 3 */}
                    {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, groupIndex) => (
                      <div key={groupIndex} className="flex-shrink-0 w-full flex">
                        {testimonials.slice(groupIndex * 3, (groupIndex + 1) * 3).map((testimonial, index) => (
                          <div 
                            key={groupIndex * 3 + index} 
                            className="flex-shrink-0 w-1/3 px-2"
                          >
                            <div className="card shadow-xl rounded-lg overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl bg-white bg-opacity-90 backdrop-blur-sm border border-secondary border-opacity-20 h-full">
                              <div className="card-body p-6">
                                {/* Foto circular del cliente */}
                                <div className="flex justify-center mb-4">
                                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-secondary shadow-lg">
                                    <img 
                                      src={testimonial.image} 
                                      alt={testimonial.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder-person-default.jpg';
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Estrellas de calificación */}
                                <div className="flex justify-center mb-3">
                                  {renderStars(testimonial.rating)}
                                </div>
                                
                                {/* Texto del testimonio */}
                                <p className="text-gray-700 italic text-center mb-4 text-sm leading-relaxed">"{testimonial.text}"</p>
                                
                                {/* Información del cliente */}
                                <div className="text-center">
                                  <p className="font-semibold text-primary">{testimonial.name}</p>
                                  <p className="text-gray-600 text-sm">{testimonial.position}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Completar el grupo con elementos vacíos si es necesario */}
                        {Array.from({ length: 3 - testimonials.slice(groupIndex * 3, (groupIndex + 1) * 3).length }).map((_, emptyIndex) => (
                          <div key={`empty-${groupIndex}-${emptyIndex}`} className="flex-shrink-0 w-1/3 px-2">
                            <div className="h-full"></div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Indicadores de navegación */}
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonialIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonialIndex ? 'bg-secondary scale-125' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Controles de navegación */}
                <div className="flex justify-center mt-4 space-x-4">
                  <button
                    onClick={() => setCurrentTestimonialIndex((prevIndex: number) => (prevIndex - 1 + testimonials.length) % testimonials.length)}
                    className="bg-secondary text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setCurrentTestimonialIndex((prevIndex: number) => (prevIndex + 1) % testimonials.length)}
                    className="bg-secondary text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            
              {/* Indicador de autoplay */}
              {isHoveringTestimonials && (
                <div className="text-center mt-4">
                  <span className="inline-flex items-center text-sm text-gray-600 bg-white bg-opacity-80 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4 mr-1 animate-pulse text-secondary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Reproducción automática activa
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Jurídico Section - New Section */}
      <section id="insights" className="py-12 bg-gray-50 reveal">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold mb-10 relative after:content-[''] after:absolute after:bottom-[-10px] after:left-1/2 after:-translate-x-1/2 after:w-[268px] after:h-1 after:bg-secondary">Blog Jurídico</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="card shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105">
              <img src="/nuevas_regulaciones_en_derecho_mercantil_venezolano.jpg" className="w-full h-48 object-cover" alt="Nuevas regulaciones en derecho mercantil venezolano" />
              <div className="card-body p-6">
                <span className="bg-primary text-white text-xs font-semibold px-2 py-1 rounded mb-2 inline-block">Novedades Legales</span>
                <h5 className="text-xl font-semibold mb-2">Nuevas regulaciones en derecho mercantil venezolano</h5>
                <p className="text-gray-700 mb-4">Análisis detallado de las últimas modificaciones en el marco legal mercantil y su impacto en las empresas.</p>
                <Link href="/blog-juridico/articulos/nuevas-regulaciones-derecho-mercantil" className="btn border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors">Leer más</Link>
              </div>
            </div>
            <div className="card shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105">
              <img src="/resolución_favorable_en_conflicto_laboral_complejo.jpg" className="w-full h-48 object-cover" alt="Resolución favorable en conflicto laboral complejo" />
              <div className="card-body p-6">
                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded mb-2 inline-block">Casos de Éxito</span>
                <h5 className="text-xl font-semibold mb-2">Resolución favorable en conflicto laboral complejo</h5>
                <p className="text-gray-700 mb-4">Cómo nuestro equipo logró un resultado exitoso en un caso de conflictos colectivos laborales.</p>
                <Link href="/blog-juridico/articulos/resolucion-favorable-conflicto-laboral" className="btn border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors">Leer más</Link>
              </div>
            </div>
            <div className="card shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105">
              <img src="/evolucion_de_la_jurisprudencia_en_derecho_civil.jpg" className="w-full h-48 object-cover" alt="Evolución de la jurisprudencia en derecho civil" />
              <div className="card-body p-6">
                <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded mb-2 inline-block">Análisis Jurisprudencial</span>
                <h5 className="text-xl font-semibold mb-2">Evolución de la jurisprudencia en derecho civil</h5>
                <p className="text-gray-700 mb-4">Estudio comparativo de sentencias recientes que han modificado la interpretación de normas civiles.</p>
                <Link href="/blog-juridico/articulos/evolucion-jurisprudencia-derecho-civil" className="btn border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors">Leer más</Link>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/blog-juridico" className="btn bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors text-lg font-semibold shadow-md hover:shadow-lg">
              Ver más
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section - New Section */}
      <section id="contacto" className="py-12 bg-primary text-white reveal">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Necesita Asesoría Legal?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">Póngase en contacto con nosotros hoy mismo para una consulta gratuita y descubra cómo podemos ayudarle a alcanzar sus objetivos legales.</p>
          <div className="flex justify-center gap-4">
            <Link href="/contacto" className="btn bg-secondary text-primary px-6 py-3 rounded-md hover:bg-yellow-400 transition-colors text-lg font-semibold">Contáctenos Ahora</Link>
            <Link href="/areas-de-practica" className="btn border border-white text-white px-6 py-3 rounded-md hover:bg-white hover:text-primary transition-colors text-lg font-semibold">Conozca Nuestros Servicios</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
