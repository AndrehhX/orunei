import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, ChevronLeft, ChevronRight, Settings, Subtitles, AlertCircle, Check, Loader2 } from 'lucide-react';
import { getEpisodePlayback } from '../api/streamAdapter';

export default function AnimePlayer({
  animeTitle,
  miruroId,
  initialEpisode = 1,
  totalEpisodes = 1,
  onClose,
  onEpisodeChange
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [episode, setEpisode] = useState(initialEpisode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);

  // Calidad
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showSettings, setShowSettings] = useState(false);

  // Subtítulos
  const [subTracks, setSubTracks] = useState([]);
  const [selectedSub, setSelectedSub] = useState('off');
  const [showSubMenu, setShowSubMenu] = useState(false);

  // Sincronizar número de episodio si cambia desde afuera
  useEffect(() => {
    if (initialEpisode && initialEpisode !== episode) {
      setEpisode(initialEpisode);
    }
  }, [initialEpisode]);

  // Cargar episodio al cambiar número de episodio o miruroId
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setQualities([]);
    setCurrentQuality(-1);
    setSubTracks([]);
    setSelectedSub('off');

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!miruroId) {
      setError('Este título aún no cuenta con fuentes disponibles en el catálogo de transmisión.');
      setLoading(false);
      return;
    }

    getEpisodePlayback(miruroId, episode)
      .then((data) => {
        if (isCancelled) return;
        setPlaybackData(data);
        setLoading(false);

        // Configurar subtítulos disponibles
        const tracks = data.subtitles?.tracks || [];
        setSubTracks(tracks);

        // Seleccionar automáticamente español (latino o españa) si existe
        const defaultSub = tracks.find((t) => t.lang?.startsWith('es')) || tracks[0];
        if (defaultSub) {
          setSelectedSub(defaultSub.lang);
        } else {
          setSelectedSub('off');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setError(err.message || 'Error al obtener el flujo de reproducción.');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [miruroId, episode]);

  // Inicializar Hls.js una vez cargada la fuente
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackData?.proxiedStreamUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30
      });
      hlsRef.current = hls;

      hls.loadSource(playbackData.proxiedStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const levels = data.levels.map((lvl, index) => ({
          index,
          height: lvl.height,
          label: lvl.height ? `${lvl.height}p` : `Calidad ${index + 1}`,
          bitrate: lvl.bitrate
        }));
        setQualities(levels);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError('Ocurrió un error al decodificar la transmisión de video.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playbackData.proxiedStreamUrl;
      video.play().catch(() => {});
    }
  }, [playbackData]);

  // Actualizar modo de pistas de subtítulos nativas
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const textTracks = video.textTracks;
    for (let i = 0; i < textTracks.length; i++) {
      const t = textTracks[i];
      if (selectedSub === 'off') {
        t.mode = 'disabled';
      } else {
        const match = subTracks.find((s) => s.lang === selectedSub);
        if (match && t.label === match.label) {
          t.mode = 'showing';
        } else {
          t.mode = 'disabled';
        }
      }
    }
  }, [selectedSub, subTracks]);

  const changeQuality = (levelIndex) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
    }
    setShowSettings(false);
  };

  const handlePrevEp = () => {
    if (episode > 1) {
      const nextEp = episode - 1;
      setEpisode(nextEp);
      onEpisodeChange?.(nextEp);
    }
  };

  const handleNextEp = () => {
    if (!totalEpisodes || episode < totalEpisodes) {
      const nextEp = episode + 1;
      setEpisode(nextEp);
      onEpisodeChange?.(nextEp);
    }
  };

  return (
    <div id="player-theater" className="relative mb-6 flex flex-col w-full rounded-2xl bg-[#0f111a] border border-white/10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] overflow-hidden animate-rise">
      {/* Cabecera del reproductor */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#161824]/95 backdrop-blur-md text-white">
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </span>
            <h3 className="text-sm sm:text-base font-bold truncate text-slate-100">{animeTitle}</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400 font-medium">Episodio {episode}{totalEpisodes ? ` de ${totalEpisodes}` : ''}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Badge de subtitulos en espanol */}
          {playbackData && playbackData.hasSpanishSubtitles && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Check size={12} className="text-emerald-400" />
              Sub Español Disponible
            </span>
          )}

          {/* Aviso si el proveedor no tiene subtitulos en espanol */}
          {playbackData && !playbackData.hasSpanishSubtitles && (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertCircle size={13} />
              Subtítulos en español no disponibles
            </span>
          )}

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-all duration-200 active:scale-95 shadow-sm"
            title="Cerrar reproductor"
          >
            <X size={15} />
            <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>
      </div>

      {/* Área del reproductor de video contenida en pantalla */}
      <div className="relative aspect-video max-h-[50vh] w-full bg-black flex items-center justify-center overflow-hidden mx-auto">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 z-10 text-white">
            <Loader2 size={36} className="animate-spin text-brand" />
            <p className="text-sm font-medium">Cargando transmisión y subtítulos…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center z-10 text-white">
            <AlertCircle size={40} className="text-rose-500" />
            <p className="text-sm max-w-md text-slate-300">{error}</p>
            <button
              onClick={() => setEpisode((e) => e)}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-brand text-white shadow-md hover:brightness-110 active:scale-95 transition"
            >
              Reintentar
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          playsInline
          crossOrigin="anonymous"
        >
          {subTracks.map((tr) => (
            <track
              key={tr.lang + tr.src}
              kind="subtitles"
              label={tr.label}
              srcLang={tr.lang}
              src={tr.src}
              default={tr.default}
            />
          ))}
        </video>
      </div>

      {/* Barra de controles, subtítulos y calidades */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-white/10 bg-[#161824]/95 backdrop-blur-md text-sm text-white">
        {/* Navegación anterior / siguiente */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevEp}
            disabled={episode <= 1 || loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <button
            onClick={handleNextEp}
            disabled={(totalEpisodes && episode >= totalEpisodes) || loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Menú de Subtítulos y Calidad */}
        <div className="flex items-center gap-3 relative">
          {/* Selector de Subtítulos */}
          <div className="relative">
            <button
              onClick={() => { setShowSubMenu(!showSubMenu); setShowSettings(false); }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 active:scale-95 ${selectedSub !== 'off' ? 'bg-brand text-white border-brand shadow-[0_0_15px_rgba(109,92,255,0.4)]' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
              title="Seleccionar subtítulos"
            >
              <Subtitles size={15} />
              <span>Subtítulos: {selectedSub === 'off' ? 'Off' : subTracks.find((s) => s.lang === selectedSub)?.label || selectedSub}</span>
            </button>

            {showSubMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 rounded-xl bg-[#1b1f2e] border border-white/10 shadow-2xl p-1.5 z-30 animate-scaleUp">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                  Pistas disponibles
                </div>
                <div className="mt-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedSub('off'); setShowSubMenu(false); }}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all duration-200 active:scale-95 ${selectedSub === 'off' ? 'bg-brand text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    <span>Desactivado (Off)</span>
                    {selectedSub === 'off' && <Check size={14} />}
                  </button>

                  {subTracks.map((tr) => (
                    <button
                      key={tr.lang}
                      onClick={() => { setSelectedSub(tr.lang); setShowSubMenu(false); }}
                      className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all duration-200 active:scale-95 ${selectedSub === tr.lang ? 'bg-brand text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                      <span className="truncate">{tr.label}</span>
                      {selectedSub === tr.lang && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selector de Calidad */}
          {qualities.length > 0 && (
            <div className="relative">
              <button
                onClick={() => { setShowSettings(!showSettings); setShowSubMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition active:scale-95"
                title="Calidad de video"
              >
                <Settings size={15} />
                <span>{currentQuality === -1 ? 'Auto' : qualities.find((q) => q.index === currentQuality)?.label || 'Auto'}</span>
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-[#1b1f2e] border border-white/10 shadow-2xl p-1.5 z-30 animate-scaleUp">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                    Calidad de transmisión
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5">
                    <button
                      onClick={() => changeQuality(-1)}
                      className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${currentQuality === -1 ? 'bg-brand text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                      <span>Automática (Adaptativa)</span>
                      {currentQuality === -1 && <Check size={14} />}
                    </button>

                    {qualities.map((q) => (
                      <button
                        key={q.index}
                        onClick={() => changeQuality(q.index)}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${currentQuality === q.index ? 'bg-brand text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                      >
                        <span>{q.label}</span>
                        {currentQuality === q.index && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
