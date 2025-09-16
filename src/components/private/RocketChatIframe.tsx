"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const authAttemptRef = useRef(0);
  const lastAuthTimeRef = useRef(0);
  const rcBaseUrl = useMemo(() => getRcBaseUrl().replace(/\/$/, ''), []);
  const rcOrigin = useMemo(() => getRcOrigin(), []);

  const iframeSrc = useMemo(() => {
    if (!rcBaseUrl) return '';
    // Usar la página de login/home de Rocket.Chat
    return `${rcBaseUrl}/home`;
  }, [rcBaseUrl]);

  useEffect(() => {
    if (!rcBaseUrl) {
      setError('Falta NEXT_PUBLIC_ROCKETCHAT_URL o NEXT_PUBLIC_ROCKETCHAT_BASE_URL');
    }
  }, [rcBaseUrl]);

  const handleSSO = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas
    if (isAuthenticating || isAuthenticated) {
      console.log('SSO ya en proceso o completado, ignorando...');
      return;
    }

    // Rate limiting: esperar al menos 5 segundos entre intentos
    const now = Date.now();
    const timeSinceLastAuth = now - lastAuthTimeRef.current;
    if (timeSinceLastAuth < 5000) {
      console.log(`Esperando ${5000 - timeSinceLastAuth}ms antes del próximo intento SSO`);
      return;
    }

    // Límite de intentos
    if (authAttemptRef.current >= 3) {
      setError('Se excedió el número máximo de intentos de autenticación. Por favor, recarga la página.');
      return;
    }

    setIsAuthenticating(true);
    authAttemptRef.current++;
    lastAuthTimeRef.current = now;

    try {
      console.log(`Intento SSO #${authAttemptRef.current}`);
      const res = await fetch('/api/rc/sso', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok || !json?.loginToken) {
        throw new Error(json?.error || 'No se pudo obtener loginToken');
      }
      
      // Enviar el token al iframe
      console.log('Token SSO obtenido, enviando al iframe...');
      iframeRef.current?.contentWindow?.postMessage({
        event: 'login-with-token',
        loginToken: json.loginToken,
      }, rcOrigin);
      
      setIsAuthenticated(true);
      setError(null);
    } catch (e: any) {
      console.error('Error en SSO:', e);
      setError(e?.message || 'Fallo el SSO con Rocket.Chat');
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, isAuthenticated, rcOrigin]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== rcOrigin) return;

      try {
        const { event: eventName } = (typeof event.data === 'string' ? JSON.parse(event.data) : event.data) || {};

        if (eventName === 'login-prompt') {
          console.log('Recibido login-prompt de Rocket.Chat');
          handleSSO();
        } else if (eventName === 'login-success') {
          console.log('Login exitoso en Rocket.Chat');
          setIsAuthenticated(true);
          setError(null);
        }
      } catch (e: any) {
        console.error('Error procesando mensaje:', e);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [rcOrigin, handleSSO]);

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
      style={{
        width: '100%',
        height: 'calc(100vh - 120px)', // Ajusta la altura según sea necesario
        border: 'none',
      }}
      allow="autoplay; camera; microphone"
    />
  );
}