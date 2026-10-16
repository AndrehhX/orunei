import { useEffect, useState } from 'react';
import { Download, X, ArrowRight } from 'lucide-react';
import { getActiveDownloads, subscribeDownloads, cancelDownload } from '../offline/downloadEngine';

export default function ActiveDownloadBar({ onGoToDownloads }) {
  const [activeItems, setActiveItems] = useState([]);

  useEffect(() => {
    const update = () => {
      setActiveItems(getActiveDownloads());
    };
    update();
    const unsub = subscribeDownloads(update);
    return () => unsub();
  }, []);

  if (activeItems.length === 0) return null;

  const current = activeItems[0];

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg animate-rise">
      <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 dark:bg-[#161824]/95 backdrop-blur-xl border border-brand/40 shadow-2xl shadow-brand/20 text-white">
        {/* Ícono animado */}
        <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-brand/20 text-brand shrink-0">
          <Download size={20} className="animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand"></span>
          </span>
        </div>

        {/* Título y barra de progreso */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="truncate pr-2">{current.animeTitle} · {current.episodeTitle}</span>
            <span className="text-brand shrink-0">{current.progress}%</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${current.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>{current.sizeFormatted}</span>
            {activeItems.length > 1 && (
              <span className="text-brand font-semibold">+{activeItems.length - 1} en cola</span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onGoToDownloads && (
            <button
              onClick={onGoToDownloads}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
              title="Ir a Descargas"
              aria-label="Ir a Descargas"
            >
              <ArrowRight size={16} />
            </button>
          )}

          <button
            onClick={() => cancelDownload(current.animeId, current.episodeNumber)}
            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition"
            title="Cancelar descarga"
            aria-label="Cancelar descarga"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
