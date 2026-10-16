import { Sparkles, Download, X } from 'lucide-react';

export default function UpdateModal({ updateInfo, onClose }) {
  if (!updateInfo || !updateInfo.hasUpdate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade">
      <div className="relative w-full max-w-md rounded-3xl bg-[#161824] border border-white/10 p-6 text-white shadow-2xl space-y-5 animate-rise">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Cerrar aviso de actualización"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand to-purple-500 grid place-items-center shadow-lg shadow-brand/30">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Actualización disponible</span>
            <h2 className="text-lg font-extrabold">Orunei v{updateInfo.latestVersion}</h2>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
          {updateInfo.releaseNotes}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <a
            href={updateInfo.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-brand text-white font-bold text-sm shadow-lg shadow-brand/30 hover:brightness-110 active:scale-95 transition"
          >
            <Download size={16} />
            Descargar e instalar APK
          </a>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Recordar más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
