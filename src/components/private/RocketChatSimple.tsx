"use client";

import React, { useEffect, useMemo, useState } from 'react';

function getRcBaseUrl(): string {
  return process.env.NEXT_PUBLIC_ROCKETCHAT_URL || '';
}

export default function RocketChatSimple({ channel = "general" }: { channel?: string }) {
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const rcBaseUrl = useMemo(() => getRcBaseUrl().replace(/\/$/, ''), []);

  // URL del iframe con el token de login
  const iframeSrc = useMemo(() => {
    if (!rcBaseUrl) return '';
    
    // Si tenemos token, usar login directo
    if (loginToken) {
      return `${rcBaseUrl}/home?resumeToken=${loginToken}`;
    }
    
    // Si no, mostrar la p\u00e1gina principal
    return `${rcBaseUrl}/`;
  }, [rcBaseUrl, loginToken]);

  useEffect(() => {
    if (!rcBaseUrl) {
      setError('Falta configurar NEXT_PUBLIC_ROCKETCHAT_URL');
      setIsLoading(false);
      return;
    }

    // Obtener token de login una sola vez al montar el componente
    let cancelled = false;

    async function getLoginToken() {
      try {
        setIsLoading(true);
        console.log('Obteniendo token SSO para Rocket.Chat...');
        
        const res = await fetch('/api/rc/sso', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!cancelled) {
          const json = await res.json().catch(() => ({}));
          
          if (!res.ok || !json?.loginToken) {
            throw new Error(json?.error || 'No se pudo obtener token de login');
          }
          
          console.log('Token SSO obtenido exitosamente');
          setLoginToken(json.loginToken);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('Error obteniendo token SSO:', e);
          setError(e?.message || 'Error al conectar con Rocket.Chat');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    getLoginToken();

    return () => {
      cancelled = true;
    };
  }, [rcBaseUrl]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Chat Interno</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando con el chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Mensaje informativo */}
      {!loginToken && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 p-2 text-center text-sm text-yellow-800">
          Por favor, inicia sesi\u00f3n en Rocket.Chat con tu usuario y contrase\u00f1a
        </div>
      )}
      
      <iframe
        src={iframeSrc}
        title="Rocket.Chat"
        className="w-full h-full border-0"
        allow="camera; microphone; fullscreen; display-capture"
      />
    </div>
  );
}
