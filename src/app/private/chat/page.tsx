'use client';

import { useEffect, useState } from 'react';

export default function ChatPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let abort = false;
    async function load() {
      try {
        const res = await fetch('/api/chat/rc/login', { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'No se pudo obtener la URL del chat. Verifique configuración RC_URL/RC_ADMIN_ID/RC_ADMIN_TOKEN.');
        }
        if (!abort) setUrl(data.url);
      } catch (e: any) {
        if (!abort) setError(e?.message || 'Error cargando chat');
      }
    }
    load();
    return () => { abort = true; };
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Chat interno</h1>
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-gray-500">Asegúrate de definir RC_URL, RC_ADMIN_ID y RC_ADMIN_TOKEN en el entorno y que Rocket.Chat esté accesible.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-10rem)] p-0 m-0">
      <h1 className="sr-only">Chat interno</h1>
      {url ? (
        <iframe src={url} className="w-full h-full border-0" allow="clipboard-read; clipboard-write; microphone; camera;" />
      ) : (
        <div className="p-6 text-gray-600">Cargando chat...</div>
      )}
    </div>
  );
}
