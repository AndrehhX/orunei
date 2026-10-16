import { useEffect, useState, useRef } from 'react';
import Hls from 'hls.js';
import { X, WifiOff, AlertCircle, Loader2, Subtitles } from 'lucide-react';
import { getOfflinePlaybackSource } from '../offline/downloadEngine';

export default function OfflinePlayerModal({ episode, onClose }) {
  const [playbackReady, setPlaybackReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offlineSubtitles, setOfflineSubtitles] = useState([]);
  const [selectedSub, setSelectedSub] = useState('es');
  const [showSubMenu, setShowSubMenu] = useState(false);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playbackSourceRef = useRef(null);

  // Cargar video local y subtítulos
  useEffect(() => {
    let isCancelled = false;
    const subUrls = [];

    async function loadMedia() {
      setLoading(true);
      setError(null);
      try {
        const source = await getOfflinePlaybackSource(episode.animeId, episode.episodeNumber);
        if (isCancelled) return;
        if (!source) {
          setError('No se pudo encontrar el archivo descargado en este dispositivo.');
          setLoading(false);
          return;
        }

        playbackSourceRef.current = source;

        // Convertir subtítulos descargados a URLs locales de tipo Blob
        if (Array.isArray(episode.subtitles) && episode.subtitles.length > 0) {
          const preparedSubs = episode.subtitles.map((sub, idx) => {
            const subBlob = new Blob([sub.vttText], { type: 'text/vtt' });
            const sUrl = URL.createObjectURL(subBlob);
            subUrls.push(sUrl);
            return {
              id: sub.id || `sub-${sub.lang}-${idx}`,
              lang: sub.lang || 'es',
              label: sub.label || (sub.lang?.startsWith('es') ? 'Español' : sub.lang),
              blobUrl: sUrl,
              default: sub.default || sub.lang?.startsWith('es'),
            };
          });
          setOfflineSubtitles(preparedSubs);
          const defTrack = preparedSubs.find(s => s.default) || preparedSubs[0];
          if (defTrack) setSelectedSub(defTrack.id);
        }

        setPlaybackReady(true);
        setLoading(false);
      } catch (err) {
        if (!isCancelled) {
          setError('Error al cargar el video sin conexión: ' + (err.message || ''));
          setLoading(false);
        }
      }
    }

    if (episode) {
      loadMedia();
    }

    return () => {
      isCancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (playbackSourceRef.current) {
        playbackSourceRef.current.revoke();
        playbackSourceRef.current = null;
      }
      subUrls.forEach(u => URL.revokeObjectURL(u));
    };
  }, [episode]);

  // Inicializar reproductor de video (HLS o directo) una vez que el DOM de videoRef esté montado
  useEffect(() => {
    if (!playbackReady || !videoRef.current || !playbackSourceRef.current) return;

    const source = playbackSourceRef.current;
    const video = videoRef.current;

    if (source.type === 'hls' && Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
      });
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = source.url;
    }
  }, [playbackReady]);

  // Manejar cambio de pista de subtítulos activa en el elemento video
  useEffect(() => {
    if (!videoRef.current) return;
    const textTracks = videoRef.current.textTracks;
    for (let i = 0; i < textTracks.length; i++) {
      const track = textTracks[i];
      if (selectedSub === 'off') {
        track.mode = 'disabled';
      } else {
        const activeSub = offlineSubtitles.find(s => s.id === selectedSub);
        if (activeSub && (track.language === activeSub.lang || track.label === activeSub.label)) {
          track.mode = 'showing';
        } else {
          track.mode = 'disabled';
        }
      }
    }
  }, [selectedSub, offlineSubtitles]);

  if (!episode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade">
      <div className="relative flex flex-col w-full h-full max-w-5xl max-h-[92vh] mx-auto p-4 sm:p-6 justify-center">
        {/* Barra superior */}
        <div className="flex items-center justify-between gap-3 pb-3 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
              <WifiOff size={13} />
              Modo Offline (Sin Internet)
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold truncate">{episode.animeTitle}</h2>
              <p className="text-xs text-slate-400 truncate">
                {episode.episodeTitle} · {episode.sizeFormatted}
                {offlineSubtitles.length > 0 && ` · ${offlineSubtitles.length} subtítulo(s) guardado(s)`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Selector de subtítulos descargados */}
            {offlineSubtitles.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSubMenu(!showSubMenu)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                    selectedSub !== 'off'
                      ? 'bg-brand/20 border-brand/40 text-brand'
                      : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                  aria-label="Seleccionar subtítulos sin conexión"
                >
                  <Subtitles size={14} />
                  <span className="hidden sm:inline">
                    {selectedSub === 'off' ? 'Subtítulos' : offlineSubtitles.find(s => s.id === selectedSub)?.label || 'Subtítulos'}
                  </span>
                </button>

                {showSubMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-2 z-50 text-xs">
                    <p className="px-2 py-1 font-bold text-slate-400 border-b border-white/10 mb-1">
                      Subtítulos Offline
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSelectedSub('off'); setShowSubMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                        selectedSub === 'off' ? 'bg-brand text-white font-bold' : 'hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      Desactivados
                    </button>
                    {offlineSubtitles.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => { setSelectedSub(sub.id); setShowSubMenu(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                          selectedSub === sub.id ? 'bg-brand text-white font-bold' : 'hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition shrink-0"
              aria-label="Cerrar reproductor offline"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenedor del reproductor */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 size={36} className="animate-spin text-brand" />
              <p className="text-xs text-slate-400">Cargando episodio y subtítulos desde el almacenamiento local…</p>
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

          {!loading && !error && playbackReady && (
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              crossOrigin="anonymous"
              className="w-full h-full object-contain"
            >
              {offlineSubtitles.map((sub) => (
                <track
                  key={sub.id}
                  kind="subtitles"
                  src={sub.blobUrl}
                  srcLang={sub.lang}
                  label={sub.label}
                  default={sub.id === selectedSub}
                />
              ))}
            </video>
          )}
        </div>
      </div>
    </div>
  );
}
