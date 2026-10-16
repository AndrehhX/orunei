import { useState, useEffect } from 'react';

let NetworkPlugin = null;
try {
  // Import dinámico seguro para no fallar en entornos de servidor o test
  import('@capacitor/network').then((mod) => {
    NetworkPlugin = mod.Network;
  }).catch(() => {});
} catch {}

/**
 * Determina sincrónicamente si hay conexión disponible de manera segura
 */
export function getInitialOnlineStatus() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Hook para monitorear el estado de conectividad en tiempo real (WiFi/Datos/Offline)
 * Integra @capacitor/network y eventos estándar del navegador.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);

  useEffect(() => {
    let isCancelled = false;

    const handleStatus = (online) => {
      if (!isCancelled) setIsOnline(Boolean(online));
    };

    // 1. Integración con Capacitor Network si está presente
    let capacitorListener = null;
    if (NetworkPlugin) {
      NetworkPlugin.getStatus().then((status) => {
        handleStatus(status.connected);
      }).catch(() => {});

      NetworkPlugin.addListener('networkStatusChange', (status) => {
        handleStatus(status.connected);
      }).then((listener) => {
        capacitorListener = listener;
      }).catch(() => {});
    }

    // 2. Eventos nativos del navegador / WebView
    const onOnline = () => handleStatus(true);
    const onOffline = () => handleStatus(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
    }

    return () => {
      isCancelled = true;
      if (capacitorListener?.remove) {
        capacitorListener.remove();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
