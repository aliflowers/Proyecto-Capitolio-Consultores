import { FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa';

export default function Contacto() {
  return (
    <section id="contacto" className="py-12 bg-light">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl font-bold mb-10 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-20 after:h-1 after:bg-secondary">Contáctenos</h2>
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <div className="card shadow-md rounded-lg p-8">
            <h4 className="text-xl font-semibold mb-4">Formulario de Contacto</h4>
            <form>
              <div className="mb-4">
                <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre completo</label>
                <input type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="nombre" required />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Correo electrónico</label>
                <input type="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" required />
              </div>
              <div className="mb-4">
                <label htmlFor="telefono" className="block text-gray-700 text-sm font-bold mb-2">Teléfono</label>
                <input type="tel" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="telefono" />
              </div>
              <div className="mb-6">
                <label htmlFor="mensaje" className="block text-gray-700 text-sm font-bold mb-2">Mensaje</label>
                <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-none" id="mensaje" required></textarea>
              </div>
              <button type="submit" className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">Enviar Mensaje</button>
            </form>
          </div>
          <div>
            <div className="flex items-start mb-6">
              <div className="bg-primary text-white w-12 h-12 flex items-center justify-center rounded-full mr-4 text-xl">
                <FaMapMarkerAlt />
              </div>
              <div>
                <h5 className="text-lg font-semibold">Dirección</h5>
                <p className="text-gray-700">Centro Empresarial Torre Imperial, calle Boyaca entre calle carabobo y calle Pichincha, <br />Maracay, Edo Aragua.</p>
              </div>
            </div>
            <div className="flex items-start mb-6">
              <div className="bg-primary text-white w-12 h-12 flex items-center justify-center rounded-full mr-4 text-xl">
                <FaWhatsapp />
              </div>
              <div>
                <h5 className="text-lg font-semibold">WhatsApp</h5>
                <p className="text-gray-700">+58 424 331 3203<br /><a href="https://wa.me/584129876543" className="btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full mt-2 inline-block">Enviar mensaje</a></p>
              </div>
            </div>
            <div className="aspect-w-16 aspect-h-9 w-full">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d450.0284713020579!2d-67.60821498037826!3d10.255442888794915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e803b7d6852b3d9%3A0x3e96c4657adc3a95!2sCentro%20Empresarial%20Torre%20Imperial!5e0!3m2!1ses-419!2sve!4v1756347938583!5m2!1ses-419!2sve" width="600" height="450" style={{ border: 0 }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
