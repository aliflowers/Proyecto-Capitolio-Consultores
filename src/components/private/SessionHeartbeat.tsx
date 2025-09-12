"use client";

import { useEffect, useRef } from 'react';

const PING_INTERVAL_MS = 60 * 1000; // 1 minuto

export default function SessionHeartbeat() {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    async function ping() {
      try {
        await fetch('/api/auth/ping', { method: 'POST' });
      } catch {}
    }

    // Ping inmediato al montar (pestaña abierta)
    ping();

    // Ping periódico mientras la pestaña esté abierta
    timerRef.current = window.setInterval(ping, PING_INTERVAL_MS);

    // En cierre de pestaña/navegador, enviar un ping final (beacon) para fijar la expiración a +5 min desde el cierre
    const onBeforeUnload = () => {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/auth/ping');
        } else {
          // Fallback rápido
          fetch('/api/auth/ping', { method: 'POST', keepalive: true });
        }
      } catch {}
    };
    window.addEventListener('pagehide', onBeforeUnload);
    window.addEventListener('beforeunload', onBeforeUnload);

    // Limpieza
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      window.removeEventListener('pagehide', onBeforeUnload);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return null;
}

