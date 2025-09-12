"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';

function getRcBaseUrl(): string {
  // Solo para construir el src del iframe; debe ser público
  return process.env.NEXT_PUBLIC_ROCKETCHAT_URL || process.env.NEXT_PUBLIC_ROCKETCHAT_BASE_URL || '';
}

function getRcOrigin(): string {
  const base = getRcBaseUrl();
  try {
    return new URL(base).origin;
  } catch {
    return '';
  }
}

export default function RocketChatIframe({ channel = "general" }: { channel?: string }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rcBaseUrl = useMemo(() => getRcBaseUrl().replace(/\/$/, ''), []);
  const rcOrigin = useMemo(() => getRcOrigin(), []);

  const iframeSrc = useMemo(() => {
    if (!rcBaseUrl) return '';
    // Embebido sin tokens en la URL
    return `${rcBaseUrl}/channel/${encodeURIComponent(channel)}?layout=embedded`;
  }, [rcBaseUrl, channel]);

  useEffect(() => {
    if (!rcBaseUrl) {
      setError('Falta NEXT_PUBLIC_ROCKETCHAT_URL o NEXT_PUBLIC_ROCKETCHAT_BASE_URL');
    }
  }, [rcBaseUrl]);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      try {
        if (!rcOrigin || ev.origin !== rcOrigin) return; // validar origin exacto
        const data = ev.data || {};
        // Rocket.Chat envía un evento de ‘ready’ cuando el iframe está listo
        if (data.eventName === 'ready' || data.externalCommand === 'ready') {
          // Solicitar token al backend SSO
          fetch('/api/rc/sso', { method: 'POST' })
            .then(async (res) => {
              const json = await res.json().catch(() => ({}));
              if (!res.ok || !json?.loginToken) {
                throw new Error(json?.error || 'No se pudo obtener loginToken');
              }
              // Enviar el token al iframe
              iframeRef.current?.contentWindow?.postMessage({
                event: 'login-with-token',
                loginToken: json.loginToken,
              }, rcOrigin);
            })
            .catch((e) => setError(e?.message || 'Fallo el SSO con Rocket.Chat'));
        }
      } catch (e: any) {
        setError(e?.message || 'Error de integración con Rocket.Chat');
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [rcOrigin]);

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Chat interno</h2>
        <p className="text-red-600">{error}</p>
        <p className="mt-1 text-sm text-gray-500">Verifica las variables de entorno y la configuración de Iframe Auth en Rocket.Chat.</p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc}
      title="Rocket.Chat"
      className="w-full h-[calc(100vh-10rem)] border-0"
      allow="clipboard-read; clipboard-write; microphone; camera;"
    />
  );
}

