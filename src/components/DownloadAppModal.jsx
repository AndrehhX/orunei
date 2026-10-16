import { Download, Smartphone, WifiOff, Zap, ShieldCheck, X } from 'lucide-react';
import { LATEST_APK_URL, CURRENT_APP_VERSION } from '../offline/appUpdater';

export default function DownloadAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#141522] border border-white/10 p-6 sm:p-8 text-white shadow-2xl space-y-6 animate-rise">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Cerrar ventana de descarga"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-2">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-tr from-brand via-purple-500 to-indigo-500 grid place-items-center shadow-xl shadow-brand/40 text-2xl font-black">
            📱
          </div>
          <h2 className="text-2xl font-black tracking-tight">Descargar Orunei para Android</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Disfruta de anime ilimitado y descarga episodios completos para verlos sin internet en tus viajes.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-left">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-brand font-bold text-xs">
              <WifiOff size={15} />
              <span>Modo Offline</span>
            </div>
            <p className="text-[11px] text-slate-400">Descarga episodios estilo Netflix/Crunchyroll y míralos sin conexión.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Zap size={15} />
              <span>Máximo rendimiento</span>
            </div>
            <p className="text-[11px] text-slate-400">Reproducción fluida a pantalla completa y cero pestañas perdidas.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <Smartphone size={15} />
              <span>Auto-Actualizaciones</span>
            </div>
            <p className="text-[11px] text-slate-400">La app detecta automáticamente nuevas versiones desde el repositorio.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <ShieldCheck size={15} />
              <span>100% Gratuito y Seguro</span>
            </div>
            <p className="text-[11px] text-slate-400">Instalador oficial verificado y firmado digitalmente.</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <a
            href={LATEST_APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand to-purple-600 text-white font-bold text-sm shadow-xl shadow-brand/35 hover:brightness-110 active:scale-95 transition"
          >
            <Download size={18} />
            Descargar APK Oficial (v{CURRENT_APP_VERSION})
          </a>

          <div className="text-center">
            <p className="text-[11px] text-slate-500">
              Compatible con Android 7.0 o superior · ~15 MB
            </p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">💡 Guía rápida de instalación:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
            <li>Pulsa el botón de descarga para guardar <code className="text-white">orunei.apk</code>.</li>
            <li>Abre el archivo descargado desde las notificaciones de tu teléfono.</li>
            <li>Si Android te pide autorizar la instalación de fuentes desconocidas, selecciona permitir y pulsa Instalar.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
