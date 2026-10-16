import { Capacitor } from '@capacitor/core';

/**
 * Retorna true exclusivamente cuando la aplicación se ejecuta dentro del contenedor nativo de Android (APK / Capacitor).
 * Retorna false en navegadores web estándar (escritorio y móvil).
 */
export function isNativeApp() {
  return typeof window !== 'undefined' && typeof Capacitor !== 'undefined' && Boolean(Capacitor.isNativePlatform());
}
