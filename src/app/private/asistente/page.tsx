import ChatInterface from '@/components/private/ChatInterface';

export default function AsistentePage() {
  return (
    <div className="w-full p-4">
      <h1 className="text-3xl font-bold mb-8 text-primary">Asistente de Investigación Jurídica</h1>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <ChatInterface />
      </div>
    </div>
  );
}