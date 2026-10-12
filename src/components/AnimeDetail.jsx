import { useEffect, useState } from 'react'
import { X, Star, Play, ExternalLink, Heart, ChevronDown, MessageSquare, ThumbsUp, Clock } from 'lucide-react'
import { getAnime, ratingJobs, commentJobs, title, crunchy, clean, T, ago } from '../api/anime'
import { AnimeCard } from './AnimePage'
import { useRec } from '../rec/rec'

const TABS = ['Resumen', 'Episodios', 'Comunidad']
const SRC = { 'AniList': 'bg-sky-500', 'Foro AniList': 'bg-indigo-500', 'MyAnimeList': 'bg-blue-700', 'Reddit': 'bg-orange-500' }
const RATE = { anilist: ['AniList', 'bg-sky-500'], mal: ['MyAnimeList', 'bg-blue-700'], kitsu: ['Kitsu', 'bg-orange-500'], imdb: ['IMDb', 'bg-yellow-500'] }

function Ratings({ m }) {
  const [r, setR] = useState({})
  useEffect(() => {
    setR({})
    Object.entries(ratingJobs(m)).forEach(([k, job]) => job().then((v) => setR((x) => ({ ...x, [k]: v || { none: true } }))).catch(() => setR((x) => ({ ...x, [k]: { none: true } }))))
  }, [m.id])
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Object.entries(RATE).map(([k, [name, color]]) => { const v = r[k]; return (
        <div key={k} className="card p-3.5">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><i className={`h-2 w-2 rounded-full ${color}`} />{name}{v?.extra && <span className="ml-auto text-slate-400">{v.extra}</span>}</div>
          {!v ? <div className="h-8 animate-pulse rounded bg-slate-200/70 dark:bg-white/10" />
            : v.off ? <p className="text-[11px] leading-snug text-slate-400">Añade <code>VITE_OMDB_KEY</code> en <code>.env</code> para ver IMDb</p>
            : v.none ? <p className="text-sm text-slate-400">Sin datos</p> : (<>
              <p className="flex items-baseline gap-1 text-2xl font-extrabold"><Star size={16} className="self-center fill-yellow-400 text-yellow-400" />{v.v.toFixed(1)}<span className="text-xs font-medium text-slate-400">/10</span></p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10"><div className={`h-full rounded-full ${color} transition-all duration-1000 ease-smooth`} style={{ width: v.v * 10 + '%' }} /></div>
              <p className="mt-1 text-[10px] text-slate-400">{v.n?.toLocaleString('es')} {v.label}</p></>)}
        </div>) })}
    </div>
  )
}

function Comment({ c }) {
  const [more, setMore] = useState(false)
  const [hide, setHide] = useState(!!c.spoiler)
  return (
    <article className="card p-4 transition-shadow hover:shadow-lg">
      <div className="mb-2 flex items-center gap-2.5">
        {c.avatar ? <img src={c.avatar} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover" /> : <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-pink-400 text-sm font-bold text-white">{c.user[0]?.toUpperCase()}</div>}
        <div className="min-w-0 leading-tight"><p className="truncate text-sm font-bold">{c.user}</p><p className="flex items-center gap-1 text-[11px] text-slate-500"><Clock size={10} />{ago(c.ts)}</p></div>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${SRC[c.src]}`}>{c.src}</span>
      </div>
      <p onClick={() => setHide(false)} className={`whitespace-pre-line text-sm leading-relaxed text-slate-700 transition-all duration-500 dark:text-slate-300 ${more ? '' : 'line-clamp-5'} ${hide ? 'cursor-pointer select-none blur-sm' : ''}`}>{c.text}</p>
      {hide && <p className="mt-1 text-[11px] font-semibold text-amber-600">Spoiler · toca para ver</p>}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
        {c.score != null && <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200"><Star size={11} className="fill-yellow-400 text-yellow-400" />{c.score}</span>}
        {c.likes != null && <span className="flex items-center gap-1"><ThumbsUp size={11} />{c.likes}</span>}
        {c.replies != null && <span className="flex items-center gap-1"><MessageSquare size={11} />{c.replies}</span>}
        {c.text.length > 220 && <button onClick={() => setMore(!more)} className="flex items-center gap-0.5 font-semibold text-brand">{more ? 'Menos' : 'Leer más'}<ChevronDown size={12} className={`transition-transform ${more ? 'rotate-180' : ''}`} /></button>}
        <a href={c.link} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 font-semibold text-brand hover:underline">Ver original<ExternalLink size={11} /></a>
      </div>
    </article>
  )
}

function Community({ m }) {
  const [list, setList] = useState([])
  const [status, setStatus] = useState({})
  const [src, setSrc] = useState('Todos')
  useEffect(() => {
    setList([]); setStatus({})
    Object.entries(commentJobs(m)).forEach(([k, job]) => job()
      .then((r) => { setList((x) => [...x, ...r].sort((a, b) => (b.likes || 0) - (a.likes || 0))); setStatus((s) => ({ ...s, [k]: r.length ? 'ok' : 'empty' })) })
      .catch(() => setStatus((s) => ({ ...s, [k]: 'fail' }))))
  }, [m.id])
  const loading = Object.keys(commentJobs(m)).some((k) => !status[k])
  const shown = list.filter((c) => src === 'Todos' || c.src === src)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['Todos', ...Object.keys(SRC)].map((s) => <button key={s} onClick={() => setSrc(s)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 active:scale-95 ${src === s ? 'bg-brand text-white shadow-md shadow-brand/30' : 'bg-white text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>
          {s !== 'Todos' && <i className={`h-1.5 w-1.5 rounded-full ${status[s] === 'fail' ? 'bg-slate-400' : SRC[s]}`} />}{s}{s !== 'Todos' && status[s] === 'ok' && <span className="opacity-60">{list.filter((c) => c.src === s).length}</span>}</button>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((c, i) => <div key={c.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}><Comment c={c} /></div>)}
        {loading && [0, 1].map((k) => <div key={k} className="card h-32 animate-pulse" />)}
      </div>
      {!loading && !shown.length && <p className="py-8 text-center text-sm text-slate-500">Aún no hay comentarios{src !== 'Todos' ? ` de ${src}` : ''}.</p>}
      {Object.entries(status).some(([, v]) => v === 'fail') && <p className="text-[11px] text-slate-400">No disponible ahora: {Object.entries(status).filter(([, v]) => v === 'fail').map(([k]) => k).join(', ')}.</p>}
    </div>
  )
}

function Episodes({ m }) {
  const eps = m.streamingEpisodes?.length ? m.streamingEpisodes : null
  const url = crunchy(m)
  if (eps) return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {eps.map((e, i) => (
        <a key={e.url + i} href={e.url} target="_blank" rel="noopener noreferrer" className="group card animate-rise overflow-hidden transition-all duration-500 ease-spring hover:-translate-y-1 hover:shadow-xl" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
          <div className="relative aspect-video overflow-hidden bg-slate-300 dark:bg-slate-800">{e.thumbnail && <img src={e.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />}
            <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100"><Play size={30} className="fill-white text-white" /></span></div>
          <p className="line-clamp-2 p-2.5 text-xs font-semibold">{e.title}</p>
          <p className="px-2.5 pb-2.5 text-[10px] text-slate-500">Ver en {e.site} ↗</p>
        </a>))}
    </div>
  )
  const n = Math.min(m.episodes || 12, 60)
  return (
    <div className="space-y-3"><p className="text-sm text-slate-500">Elige un episodio para continuar en Crunchyroll.</p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {Array.from({ length: n }, (_, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="animate-rise grid h-11 place-items-center rounded-xl bg-white text-sm font-bold shadow-sm transition-all duration-300 ease-spring hover:-translate-y-1 hover:bg-brand hover:text-white dark:bg-white/5" style={{ animationDelay: `${Math.min(i, 30) * 15}ms` }}>{i + 1}</a>)}</div></div>
  )
}

export default function AnimeDetail({ id, onClose, onOpen }) {
  const [m, setM] = useState(null)
  const [err, setErr] = useState(false)
  const [tab, setTab] = useState(0)
  const [spoil, setSpoil] = useState(false)
  const [closing, setClosing] = useState(false)
  const rec = useRec()
  const close = () => { setClosing(true); setTimeout(onClose, 260) }

  useEffect(() => { setM(null); setErr(false); setTab(0); getAnime(id).then(setM).catch(() => setErr(true)) }, [id])
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && close()
    document.body.style.overflow = 'hidden'; window.addEventListener('keydown', k)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k) }
  }, [])

  const accent = m?.coverImage.color || '#6d5cff'
  const next = m?.nextAiringEpisode
  const liked = m && rec.isLiked(m.id)
  const tags = m ? m.tags.filter((t) => !t.isGeneralSpoiler && (spoil || !t.isMediaSpoiler)).slice(0, 14) : []
  const info = m && [['Formato', T[m.format] || m.format], ['Episodios', m.episodes ? `${m.episodes}${m.duration ? ` × ${m.duration} min` : ''}` : '—'], ['Estado', T[m.status] || m.status],
    ['Temporada', m.season ? `${T[m.season]} ${m.seasonYear}` : m.seasonYear || '—'], ['Estudio', m.studios.nodes[0]?.name || '—'], ['Favoritos', m.favourites?.toLocaleString('es')]]

  return (
    <div className={`fixed inset-0 z-40 flex justify-center bg-black/55 p-0 backdrop-blur-sm transition-opacity duration-300 sm:p-5 ${closing ? 'opacity-0' : 'animate-fade'}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className={`scroll-hide relative w-full max-w-5xl overflow-y-auto bg-[#f4f4fb] shadow-2xl transition-all duration-300 ease-smooth dark:bg-[#0e0e17] sm:rounded-3xl ${closing ? 'translate-y-6 scale-95 opacity-0' : 'animate-rise'}`}>
        <button onClick={close} aria-label="Cerrar" className="sticky left-full top-3 z-30 float-right mr-3 mt-3 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:rotate-90 hover:scale-110"><X size={18} /></button>
        {err && <p className="p-16 text-center text-slate-500">No pudimos cargar esta ficha. <button onClick={close} className="font-semibold text-brand underline">Volver</button></p>}
        {!m && !err && <div className="space-y-4 p-6"><div className="h-64 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/5" /><div className="h-8 w-1/2 animate-pulse rounded bg-slate-200/70 dark:bg-white/5" /></div>}
        {m && (<>
          <header className="relative -mt-[52px] h-[320px] overflow-hidden" style={{ background: accent }}>
            {(m.bannerImage || m.coverImage.extraLarge) && <img src={m.bannerImage || m.coverImage.extraLarge} alt="" className={`h-full w-full object-cover animate-fade ${m.bannerImage ? '' : 'scale-125 blur-xl'}`} />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#f4f4fb] via-[#f4f4fb]/30 to-black/30 dark:from-[#0e0e17] dark:via-[#0e0e17]/40" />
          </header>
          <div className="relative -mt-28 px-5 pb-8 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row">
              <img src={m.coverImage.extraLarge} alt={title(m)} className="h-[260px] w-[175px] shrink-0 rounded-2xl object-cover shadow-2xl ring-4 ring-[#f4f4fb] animate-rise dark:ring-[#0e0e17]" />
              <div className="flex min-w-0 flex-col justify-end gap-2 animate-rise" style={{ animationDelay: '.1s' }}>
                <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title(m)}</h2>
                <p className="text-sm text-slate-500">{m.title.native}{m.title.native && m.title.romaji ? ' · ' : ''}{m.title.romaji !== title(m) ? m.title.romaji : ''}</p>
                <div className="flex flex-wrap gap-1.5">{m.genres.map((g) => <span key={g} className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: accent }}>{g}</span>)}</div>
                {next && <p className="text-xs font-semibold text-emerald-600">Ep. {next.episode} · en {Math.max(1, Math.round((next.airingAt * 1000 - Date.now()) / 864e5))} días</p>}
                <div className="mt-1 flex flex-wrap gap-2">
                  <a href={crunchy(m)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-[#f47521] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-95"><Play size={15} className="fill-white" />Ver en Crunchyroll</a>
                  {m.trailer?.site === 'youtube' && <a href={`https://youtu.be/${m.trailer.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 active:scale-95 dark:bg-white/10">Tráiler<ExternalLink size={13} /></a>}
                  <button onClick={() => rec.likeMedia(m)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-spring active:scale-90 ${liked ? 'bg-pink-500 text-white' : 'bg-white shadow-sm dark:bg-white/10'}`}><Heart size={15} className={liked ? 'fill-white' : ''} />{liked ? 'Te gusta' : 'Me gusta'}</button>
                </div>
              </div>
            </div>

            <div className="mt-6"><Ratings m={m} /></div>

            <div className="relative mt-7 grid grid-cols-3 border-b border-slate-200 dark:border-white/10">
              {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} className={`py-3 text-sm font-semibold transition-colors ${tab === i ? 'text-brand' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>{t}</button>)}
              <span className="absolute bottom-0 h-0.5 w-1/3 rounded bg-brand transition-transform duration-300 ease-smooth" style={{ transform: `translateX(${tab * 100}%)` }} />
            </div>

            <div key={tab} className="mt-5 animate-fade">
              {tab === 0 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                  <div className="space-y-6">
                    <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{clean(m.description) || 'Sin sinopsis disponible.'}</p>
                    <div><div className="mb-2 flex items-center justify-between"><h3 className="font-bold">Etiquetas</h3><button onClick={() => setSpoil(!spoil)} className="text-[11px] font-semibold text-brand">{spoil ? 'Ocultar spoilers' : 'Mostrar spoilers'}</button></div>
                      <div className="flex flex-wrap gap-2">{tags.map((t, i) => <span key={t.name} className="animate-rise rounded-lg bg-white px-2.5 py-1 text-xs shadow-sm dark:bg-white/5" style={{ animationDelay: `${i * 30}ms` }}>{t.name} <b className="text-brand">{t.rank}%</b></span>)}</div></div>
                    {m.recommendations.nodes.length > 0 && <div><h3 className="mb-3 font-bold">Si te gustó, prueba</h3>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{m.recommendations.nodes.filter((n) => n.mediaRecommendation).map(({ mediaRecommendation: r }, i) => <AnimeCard key={r.id} m={r} i={i} onOpen={onOpen} />)}</div></div>}
                  </div>
                  <dl className="card h-fit divide-y divide-slate-200/70 p-1 text-sm dark:divide-white/10">{info.map(([k, v]) => <div key={k} className="flex justify-between gap-3 px-3 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}</dl>
                </div>)}
              {tab === 1 && <Episodes m={m} />}
              {tab === 2 && <Community m={m} />}
            </div>
          </div>
        </>)}
      </div>
    </div>
  )
}
