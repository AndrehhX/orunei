import { useEffect, useState } from 'react';
import { X, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { getOfflineVideoBlob } from '../offline/downloadEngine';

export default function OfflinePlayerModal({ episode, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let url = null;
    let isCancelled = false;

    async function loadVideo() {
      setLoading(true);
      setError(null);
      try {
        const blob = await getOfflineVideoBlob(episode.animeId, episode.episodeNumber);
        if (isCancelled) return;
        if (!blob) {
          setError('No se pudo encontrar el archivo descargado en este dispositivo.');
          setLoading(false);
          return;
        }
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      } catch (err) {
        if (!isCancelled) {
          setError('Error al cargar el video sin conexión.');
          setLoading(false);
        }
      }
    }

    if (episode) {
      loadVideo();
    }

    return () => {
      isCancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [episode]);

  if (!episode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade">
      <div className="relative flex flex-col w-full h-full max-w-5xl max-h-[92vh] mx-auto p-4 sm:p-6 justify-center">
        {/* Barra superior */}
        <div className="flex items-center justify-between gap-3 pb-3 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
              <WifiOff size={13} />
              Modo Offline
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold truncate">{episode.animeTitle}</h2>
              <p className="text-xs text-slate-400 truncate">{episode.episodeTitle} · {episode.sizeFormatted}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition shrink-0"
            aria-label="Cerrar reproductor offline"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenedor del reproductor */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 size={36} className="animate-spin text-brand" />
              <p className="text-xs text-slate-400">Cargando episodio desde el almacenamiento local…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-2 text-center p-6 text-white max-w-md">
              <AlertCircle size={36} className="text-rose-500" />
              <p className="text-sm font-bold text-rose-400">{error}</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold hover:bg-white/20 transition"
              >
                Volver a la biblioteca
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <video
              src={blobUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}
