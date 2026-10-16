import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, ChevronLeft, ChevronRight, Settings, Subtitles, AlertCircle, Check, Loader2, Server, WifiOff } from 'lucide-react';
import { getEpisodePlayback } from '../api/streamAdapter';
import { getOfflineVideoBlob } from '../offline/downloadEngine';

export default function AnimePlayer({
  animeId,
  animeTitle,
  miruroId,
  initialEpisode = 1,
  totalEpisodes = 1,
  onClose,
  onEpisodeChange,
  onComplete,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [episode, setEpisode] = useState(initialEpisode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);

  // Servidores múltiples
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferNotice, setBufferNotice] = useState(false);

  // Calidad
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showSettings, setShowSettings] = useState(false);

  // Subtítulos
  const [subTracks, setSubTracks] = useState([]);
  const [selectedSub, setSelectedSub] = useState('off');
  const [retryCount, setRetryCount] = useState(0);
  const [showSubMenu, setShowSubMenu] = useState(false);

  // Sincronizar número de episodio si cambia desde afuera
  useEffect(() => {
    if (initialEpisode && initialEpisode !== episode) {
      setEpisode(initialEpisode);
    }
  }, [initialEpisode]);

  // Lista de servidores disponibles
  const servers = playbackData?.servers?.length
    ? playbackData.servers
    : (playbackData?.proxiedStreamUrl
      ? [{ id: 'srv-1', name: 'Servidor Principal', proxiedStreamUrl: playbackData.proxiedStreamUrl }]
      : []);

  const activeServer = servers[selectedServerIndex] || servers[0];
  const activeStreamUrl = activeServer?.proxiedStreamUrl || playbackData?.proxiedStreamUrl;

  // Cargar episodio al cambiar número de episodio, miruroId o reintento
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setQualities([]);
    setCurrentQuality(-1);
    setSubTracks([]);
    setSelectedSub('off');
    setSelectedServerIndex(0);
    setIsBuffering(false);
    setBufferNotice(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let offlineBlobUrl = null;

    // Verificar si el episodio se encuentra descargado localmente
    getOfflineVideoBlob(animeId || miruroId, episode).then((offlineBlob) => {
      if (isCancelled) return;
      if (offlineBlob) {
        offlineBlobUrl = URL.createObjectURL(offlineBlob);
        setPlaybackData({
          proxiedStreamUrl: offlineBlobUrl,
          isOffline: true,
          servers: [{ id: 'offline-local', name: '💾 Descarga Offline (Local)', proxiedStreamUrl: offlineBlobUrl }],
        });
        setLoading(false);
        return;
      }

      if (miruroId === undefined || miruroId === null) {
        const timer = setTimeout(() => {
          if (!isCancelled && !miruroId) {
            setError('Este título aún no cuenta con fuentes disponibles en el catálogo de transmisión.');
            setLoading(false);
          }
        }, 7000);
        return () => {
          isCancelled = true;
          clearTimeout(timer);
        };
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

          // Configurar subtítulos disponibles con IDs únicos
          const rawTracks = data.subtitles?.tracks || [];
          const tracks = rawTracks.map((t, idx) => ({
            ...t,
            id: t.id || `sub-${t.lang || 'es'}-${idx}`
          }));
          setSubTracks(tracks);

          // Seleccionar automáticamente español si existe
          const defaultSub = tracks.find((t) => t.lang?.startsWith('es')) || tracks[0];
          if (defaultSub) {
            setSelectedSub(defaultSub.id);
          } else {
            setSelectedSub('off');
          }
        })
        .catch((err) => {
          if (isCancelled) return;
          const msg = err.message || '';
          if (msg.includes('502') || msg.includes('504') || msg.includes('Bad Gateway')) {
            setError('Los servidores de fuentes están procesando este episodio (502 Bad Gateway). Esto suele ocurrir en episodios de reciente emisión mientras se generan los flujos. Pulsa "Reintentar" para reconectar.');
          } else {
            setError(msg || 'Error al obtener el flujo de reproducción.');
          }
          setLoading(false);
        });
    });

    return () => {
      isCancelled = true;
      if (offlineBlobUrl) {
        URL.revokeObjectURL(offlineBlobUrl);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [animeId, miruroId, episode, retryCount]);

  // Monitoreo de buffering prolongado (aviso al usuario para cambiar de servidor)
  useEffect(() => {
    let stallTimer = null;
    if (isBuffering && servers.length > 1) {
      stallTimer = setTimeout(() => {
        setBufferNotice(true);
      }, 6000);
    } else {
      setBufferNotice(false);
    }
    return () => clearTimeout(stallTimer);
  }, [isBuffering, servers.length]);

  const switchToNextServer = () => {
    if (servers.length <= 1) return;
    const nextIdx = (selectedServerIndex + 1) % servers.length;
    setSelectedServerIndex(nextIdx);
    setBufferNotice(false);
    setIsBuffering(false);
  };

  // Inicializar Hls.js una vez cargada la fuente o cambiado el servidor
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isMp4 = activeStreamUrl.includes('.mp4') || (!activeStreamUrl.includes('.m3u8') && !activeStreamUrl.includes('proxy?'));

    if (Hls.isSupported() && !isMp4) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        enableWebVTT: false, // Desactivar WebVTT nativo en Hls.js para evitar subtítulos duplicados
        renderTextTracksNatively: false, // Prevenir creación automática de TextTracks duplicados por Hls
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        maxBufferSize: 60 * 1000 * 1000,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 4,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 3
      });
      hlsRef.current = hls;

      // Mantener canal de subtítulos de Hls.js desactivado para no colisionar con los tracks de la app
      try {
        hls.subtitleTrack = -1;
      } catch (_) {}

      hls.loadSource(activeStreamUrl);
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
              // Si el servidor falla, conmutar automáticamente al siguiente servidor disponible
              if (servers.length > 1 && selectedServerIndex < servers.length - 1) {
                console.warn('[AnimePlayer] Fallo de red en el servidor actual, conmutando al siguiente...');
                setSelectedServerIndex((prev) => prev + 1);
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (servers.length > 1 && selectedServerIndex < servers.length - 1) {
                console.warn('[AnimePlayer] Error fatal en decodificación, cambiando de servidor...');
                setSelectedServerIndex((prev) => prev + 1);
              } else {
                hls.destroy();
                setError('Ocurrió un error al decodificar la transmisión de video.');
              }
              break;
          }
        }
      });
    } else {
      video.src = activeStreamUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl]);

  // Actualizar y forzar el modo de pistas de subtítulos nativas de manera estrictamente unívoca
  const syncSubtitles = () => {
    const video = videoRef.current;
    if (!video) return;

    // Asegurar que Hls.js nunca active un subtítulo interno
    if (hlsRef.current) {
      try {
        hlsRef.current.subtitleTrack = -1;
      } catch (_) {}
    }

    // Modo desactivado (Off): apagar absolutamente todas las pistas del DOM y textTracks
    if (selectedSub === 'off') {
      const domTracks = video.querySelectorAll('track');
      domTracks.forEach((el) => {
        if (el.track) el.track.mode = 'disabled';
      });
      if (video.textTracks) {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = 'disabled';
        }
      }
      return;
    }

    // Buscar la pista seleccionada por su ID único o por idioma
    const targetTrack = subTracks.find((s) => (s.id && s.id === selectedSub) || s.lang === selectedSub);
    if (!targetTrack) return;

    let domShowing = false;

    // 1. Sincronizar elementos <track> del DOM: exactamente uno activo, los demás en disabled
    const domTracks = video.querySelectorAll('track');
    domTracks.forEach((el) => {
      if (el.track) {
        const isMatch = !domShowing && (
          (el.dataset?.subId && targetTrack.id && el.dataset.subId === targetTrack.id) ||
          el.src === targetTrack.src ||
          (el.label === targetTrack.label && el.srclang === targetTrack.lang)
        );
        if (isMatch) {
          el.track.mode = 'showing';
          domShowing = true;
        } else {
          el.track.mode = 'disabled';
        }
      }
    });

    // 2. Sincronizar textTracks de la API HTML5
    // Asegurar que solo la pista correspondiente quede en 'showing' y ninguna otra
    if (video.textTracks && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const t = video.textTracks[i];
        if (domShowing) {
          // Si el DOM ya activó la pista deseada, mantenerla activa si coincide la etiqueta, y apagar cualquier otra
          if (t.label === targetTrack.label && t.mode === 'showing') {
            // Mantener showing
          } else {
            t.mode = 'disabled';
          }
        } else {
          const isMatch = (t.label === targetTrack.label) || (t.language === targetTrack.lang);
          if (isMatch) {
            t.mode = 'showing';
            domShowing = true;
          } else {
            t.mode = 'disabled';
          }
        }
      }
    }
  };

  useEffect(() => {
    syncSubtitles();
    // Safety check para navegadores donde el textTrack tarda unos ms en enlazarse
    const timer = setTimeout(syncSubtitles, 500);
    return () => clearTimeout(timer);
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

  const handleEnded = () => {
    if (totalEpisodes && episode >= totalEpisodes) {
      onComplete?.(episode);
    } else if (onEpisodeChange) {
      const nextEp = episode + 1;
      setEpisode(nextEp);
      onEpisodeChange(nextEp);
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
          {/* Badge de subtítulos en español */}
          {playbackData && playbackData.hasSpanishSubtitles && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Check size={12} className="text-emerald-400" />
              Sub Español Disponible
            </span>
          )}

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
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-brand text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                Reintentar
              </button>
              {servers.length > 1 && (
                <button
                  onClick={switchToNextServer}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 active:scale-95 transition"
                >
                  Probar otro servidor
                </button>
              )}
            </div>
          </div>
        )}

        {/* Aviso flotante de carga lenta con opción de cambio inmediato de servidor */}
        {bufferNotice && servers.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex max-w-[92%] sm:max-w-none items-center justify-between gap-2.5 px-3 sm:px-4 py-2 rounded-xl bg-black/90 backdrop-blur-md border border-amber-500/40 text-amber-200 text-xs shadow-2xl animate-rise">
            <span className="truncate">¿Carga lenta o pausada?</span>
            <button
              onClick={switchToNextServer}
              className="shrink-0 px-3 py-1 rounded-lg bg-brand hover:brightness-110 font-bold text-white transition active:scale-95 shadow-md shadow-brand/30"
            >
              Cambiar servidor ▸
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          playsInline
          crossOrigin="anonymous"
          onLoadedMetadata={syncSubtitles}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => { setIsBuffering(false); setBufferNotice(false); }}
          onCanPlay={() => setIsBuffering(false)}
          onEnded={handleEnded}
        >
          {subTracks.map((tr) => (
            <track
              key={tr.id || (tr.lang + tr.src)}
              data-sub-id={tr.id}
              kind="subtitles"
              label={tr.label}
              srcLang={tr.lang}
              src={tr.src}
            />
          ))}
        </video>
      </div>

      {/* Barra de controles, servidores, subtítulos y calidades */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3 sm:px-6 py-2.5 sm:py-3 border-t border-white/10 bg-[#161824]/95 backdrop-blur-md text-sm text-white">
        {/* Navegación anterior / siguiente */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <button
            onClick={handlePrevEp}
            disabled={episode <= 1 || loading}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <button
            onClick={handleNextEp}
            disabled={(totalEpisodes && episode >= totalEpisodes) || loading}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 active:scale-95"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Menús de Servidor, Subtítulos y Calidad */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 relative flex-wrap sm:flex-nowrap">
          {/* Selector de Servidor (cuando hay múltiples disponibles) */}
          {servers.length > 1 && (
            <div className="relative">
              <button
                onClick={() => { setShowServerMenu(!showServerMenu); setShowSubMenu(false); setShowSettings(false); }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-slate-200 transition active:scale-95 shadow-sm"
                title="Cambiar servidor de transmisión"
              >
                <Server size={14} className="text-brand shrink-0" />
                <span className="truncate max-w-[85px] sm:max-w-[130px]">{activeServer?.name || 'Servidor'}</span>
              </button>

              {showServerMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-56 max-w-[calc(100vw-32px)] rounded-xl bg-[#1b1f2e] border border-white/10 shadow-2xl p-1.5 z-30 animate-scaleUp">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                    Servidores disponibles ({servers.length})
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                    {servers.map((srv, idx) => (
                      <button
                        key={srv.id || idx}
                        onClick={() => { setSelectedServerIndex(idx); setShowServerMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all ${selectedServerIndex === idx ? 'bg-brand text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                      >
                        <span className="truncate">{srv.name}</span>
                        {selectedServerIndex === idx && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selector de Subtítulos */}
          <div className="relative">
            <button
              onClick={() => { setShowSubMenu(!showSubMenu); setShowServerMenu(false); setShowSettings(false); }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 active:scale-95 ${selectedSub !== 'off' ? 'bg-brand text-white border-brand shadow-[0_0_15px_rgba(109,92,255,0.4)]' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
              title="Seleccionar subtítulos"
            >
              <Subtitles size={15} className="shrink-0" />
              <span className="hidden sm:inline">Subtítulos: </span>
              <span className="truncate max-w-[80px] sm:max-w-none">{selectedSub === 'off' ? 'Off' : (subTracks.find((s) => s.id === selectedSub || s.lang === selectedSub)?.label || 'Español')}</span>
            </button>

            {showSubMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 max-w-[calc(100vw-32px)] rounded-xl bg-[#1b1f2e] border border-white/10 shadow-2xl p-1.5 z-30 animate-scaleUp">
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
                      key={tr.id || tr.lang}
                      onClick={() => { setSelectedSub(tr.id || tr.lang); setShowSubMenu(false); }}
                      className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all duration-200 active:scale-95 ${(selectedSub === tr.id || selectedSub === tr.lang) ? 'bg-brand text-white font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                      <span className="truncate">{tr.label}</span>
                      {(selectedSub === tr.id || selectedSub === tr.lang) && <Check size={14} />}
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
                onClick={() => { setShowSettings(!showSettings); setShowServerMenu(false); setShowSubMenu(false); }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition active:scale-95"
                title="Calidad de video"
              >
                <Settings size={15} className="shrink-0" />
                <span className="truncate max-w-[50px] sm:max-w-none">{currentQuality === -1 ? 'Auto' : qualities.find((q) => q.index === currentQuality)?.label || 'Auto'}</span>
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-44 max-w-[calc(100vw-32px)] rounded-xl bg-[#1b1f2e] border border-white/10 shadow-2xl p-1.5 z-30 animate-scaleUp">
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
