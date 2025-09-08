import Link from 'next/link';

export default function ResolucionFavorableConflictoLaboral() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <nav className="mb-8">
          <Link href="/blog-juridico" className="text-primary hover:text-secondary transition-colors">
            ← Volver al Blog Jurídico
          </Link>
        </nav>
        
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src="/resolución_favorable_en_conflicto_laboral_complejo.jpg" 
            alt="Resolución favorable en conflicto laboral complejo" 
            className="w-full h-64 object-cover"
          />
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded">
                Casos de Éxito
              </span>
              <span className="text-gray-500 text-sm">Publicado: Agosto 27, 2025</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Resolución favorable en conflicto laboral complejo
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-6 leading-relaxed">
                Nuestro equipo logró un resultado exitoso en un caso de conflictos colectivos laborales que involucró 
                a más de 200 trabajadores de una importante empresa manufacturera. Este caso ejemplifica nuestro 
                enfoque estratégico y compromiso con la resolución efectiva de disputas laborales complejas.
              </p>
              
              <h2 className="text-2xl font-semibold text-primary mb-4 mt-8">Contexto del Caso</h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                La disputa surgió de diferencias contractuales relacionadas con condiciones laborales, horas extras 
                no compensadas y violaciones presuntas a derechos laborales fundamentales. La situación había 
                generado una huelga parcial que afectaba significativamente las operaciones de la empresa y 
                generaba incertidumbre entre los trabajadores.
              </p>
              
              <h2 className="text-2xl font-semibold text-primary mb-4 mt-8">Estrategia de Resolución</h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Nuestro enfoque se centró en la mediación constructiva y el análisis detallado de la legislación 
                laboral vigente. Trabajamos en estrecha colaboración con representantes de ambos lados para 
                identificar puntos de共识 común y desarrollar soluciones mutuamente beneficiosas. La estrategia 
                incluyó la presentación de evidencia documental sólida y argumentos legales basados en 
                jurisprudencia reciente.
              </p>
              
              <h2 className="text-2xl font-semibold text-primary mb-4 mt-8">Resultado Alcanzado</h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Logramos un acuerdo que benefició a todas las partes involucradas. Los trabajadores recibieron 
                compensación por horas extras adeudadas y mejoras en sus condiciones laborales, mientras que 
                la empresa obtuvo un marco claro para futuras relaciones laborales y la reanudación de sus 
                operaciones normales. El acuerdo incluyó mecanismos de seguimiento para prevenir futuros conflictos.
              </p>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-6 my-8">
                <h3 className="text-lg font-semibold text-green-700 mb-2">Lección Clave</h3>
                <p className="text-gray-700 mb-4">
                  Este caso demuestra que incluso los conflictos laborales más complejos pueden resolverse 
                  satisfactoriamente mediante un enfoque profesional, preparación exhaustiva y compromiso 
                  con la justicia equitativa.
                </p>
              </div>
              
              <h2 className="text-2xl font-semibold text-primary mb-4 mt-8">Recomendaciones Preventivas</h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Para prevenir conflictos similares, recomendamos a las organizaciones implementar políticas 
                laborales claras, mecanismos de comunicación efectivos y revisiones periódicas de cumplimiento 
                normativo. La prevención proactiva es siempre más efectiva que la resolución reactiva de disputas.
              </p>
            </div>
          </div>
        </article>
        
        <div className="mt-8 flex justify-center">
          <Link 
            href="/blog-juridico" 
            className="bg-primary text-white px-6 py-3 rounded-md hover:bg-secondary transition-colors font-medium"
          >
            Ver todos los artículos
          </Link>
        </div>
      </div>
    </div>
  );
}
