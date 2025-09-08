'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BlogJuridico() {
  const [articles, setArticles] = useState([
    {
      id: 1,
      title: "Nuevas regulaciones en derecho mercantil venezolano",
      excerpt: "Análisis detallado de las últimas modificaciones en el marco legal mercantil y su impacto en las empresas.",
      image: "/nuevas_regulaciones_en_derecho_mercantil_venezolano.jpg",
      category: "Novedades Legales",
      categoryColor: "bg-primary",
      slug: "nuevas-regulaciones-derecho-mercantil",
      date: "27 de Agosto, 2025",
      readTime: "5 min lectura"
    },
    {
      id: 2,
      title: "Resolución favorable en conflicto laboral complejo",
      excerpt: "Cómo nuestro equipo logró un resultado exitoso en un expediente de conflictos colectivos laborales.",
      image: "/resolución_favorable_en_conflicto_laboral_complejo.jpg",
      category: "Expedientes de Éxito",
      categoryColor: "bg-green-500",
      slug: "resolucion-favorable-conflicto-laboral",
      date: "26 de Agosto, 2025",
      readTime: "4 min lectura"
    },
    {
      id: 3,
      title: "Evolución de la jurisprudencia en derecho civil",
      excerpt: "Estudio comparativo de sentencias recientes que han modificado la interpretación de normas civiles.",
      image: "/evolucion_de_la_jurisprudencia_en_derecho_civil.jpg",
      category: "Análisis Jurisprudencial",
      categoryColor: "bg-blue-500",
      slug: "evolucion-jurisprudencia-derecho-civil",
      date: "25 de Agosto, 2025",
      readTime: "6 min lectura"
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [filteredArticles, setFilteredArticles] = useState(articles);

  const categories = ['Todos', 'Novedades Legales', 'Expedientes de Éxito', 'Análisis Jurisprudencial'];

  useEffect(() => {
    if (selectedCategory === 'Todos') {
      setFilteredArticles(articles);
    } else {
      setFilteredArticles(articles.filter(article => article.category === selectedCategory));
    }
  }, [selectedCategory, articles]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-primary to-secondary">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Blog Jurídico
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Análisis expertos, expedientes de éxito y tendencias legales que marcan la diferencia
          </motion.p>
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="w-24 h-1 bg-secondary rounded-full"></div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-primary">Explorando el Mundo Legal</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Bienvenido a nuestro Blog Jurídico, donde compartimos conocimiento legal actualizado, 
              análisis profundos de expedientes relevantes y perspectivas expertas sobre el panorama legal venezolano. 
              Nuestro objetivo es mantenerlo informado sobre las últimas tendencias y desarrollos en el ámbito jurídico.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="sticky top-0 py-8 bg-gray-100 shadow-md z-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-56 object-cover transition-transform duration-700 hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`${article.categoryColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                      {article.category}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <span className="text-xs font-medium text-gray-700">{article.readTime}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span>{article.date}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-gray-900 hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {article.excerpt}
                  </p>
                  
                  <Link 
                    href={`/blog-juridico/articulos/${article.slug}`}
                    className="inline-flex items-center text-primary font-semibold hover:text-secondary transition-colors"
                  >
                    Leer más
                    <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Mantente Actualizado</h2>
            <p className="text-xl mb-8 text-white">Suscríbete a nuestro boletín para recibir los últimos artículos jurídicos</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Tu correo electrónico"
                className="flex-1 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button className="bg-secondary text-primary px-6 py-3 rounded-md hover:bg-yellow-400 transition-colors font-semibold">
                Suscribirse
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
