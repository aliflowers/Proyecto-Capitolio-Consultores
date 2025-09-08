import Link from 'next/link';

export default function NuevasRegulacionesDerechoMercantil() {
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
            src="/nuevas_regulaciones_en_derecho_mercantil_venezolano.jpg" 
            alt="Nuevas regulaciones en derecho mercantil venezolano" 
            className="w-full h-64 object-cover"
          />
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-primary text-white text-sm font-semibold px-3 py-1 rounded">
                Novedades Legales
              </span>
              <span className="text-gray-500 text-sm">Publicado: Agosto 27, 2025</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Nuevas regulaciones en derecho mercantil venezolano
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-6 leading-relaxed">
                El panorama legal mercantil en Venezuela ha experimentado cambios significativos en los últimos meses, 
                con la introducción de nuevas regulaciones que impactan directamente en la operación de empresas y 
                organizaciones comerciales. Estas modificaciones reflejan la evolución constante del marco jurídico 
                venezolano en respuesta a las necesidades del mercado y a las exigencias internacionales.
              </p>
              
              <h2 className="text-2xl font-semibold text-primary mb-4 mt-8">Marco Normativo Actualizado</h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Las nuevas disposiciones abordan aspectos cruciales del derecho mercantil, incluyendo la modernización 
                de los procedimientos de registro mercantil, actualización de las normas sobre sociedades comerciales, 
                y nuevas regulaciones en materia de contratación electrónica. Estos cambios buscan facilitar el ambiente 
                de negocios mientras se mantienen los estándares de protección legal necesarios.
              </p>
              
              <h2 className="text-2xl font-semibold text-primary mb-4 mt-8">Impacto en las Empresas</h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Las organizaciones deben adaptarse a estos nuevos requisitos para mantener su conformidad legal. 
                Las empresas que operan en el sector mercantil venezolano deberán revisar sus prácticas actuales 
                y actualizar sus procedimientos para alinearse con las nuevas regulaciones. Esto incluye la 
                implementación de nuevos sistemas de registro, actualización de contratos y adaptación de procesos 
                internos.
              </p>
              
              <h2 className="text-2xl font-semibold text-primary mb-4 mt-8">Recomendaciones Prácticas</h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Recomendamos a nuestros clientes que realicen una auditoría completa de sus operaciones mercantiles 
                para identificar áreas que requieran ajustes. Además, es fundamental mantenerse actualizado con 
                las modificaciones legislativas y buscar asesoría especializada para garantizar el cumplimiento 
                normativo. Nuestro equipo de expertos está disponible para proporcionar orientación personalizada 
                y acompañamiento en el proceso de adaptación.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-primary p-6 my-8">
                <h3 className="text-lg font-semibold text-primary mb-2">¿Necesita asesoría específica?</h3>
                <p className="text-gray-700 mb-4">
                  Nuestros abogados especialistas en derecho mercantil pueden ayudarle a navegar estas nuevas 
                  regulaciones y asegurar que su empresa cumpla con todos los requisitos legales.
                </p>
                <Link 
                  href="/contacto" 
                  className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-secondary transition-colors font-medium"
                >
                  Contáctenos para una consulta
                </Link>
              </div>
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
