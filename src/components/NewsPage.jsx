import { useState } from 'react'
import { RefreshCw, ExternalLink, WifiOff } from 'lucide-react'
import Poster from './Poster'
import Reveal from './Reveal'
import { useNews, NewsLink } from '../news'
import LikeBtn from './LikeBtn'
import { useRec } from '../rec/rec'

export default function NewsPage({ query }) {
  const { items, status, reload } = useNews()
  const rec = useRec()
  const [src, setSrc] = useState('Todas')
  const sources = ['Todas', ...new Set(items.map((n) => n.s))]
  const list = items.filter((n) => (src === 'Todas' || n.s === src) && n.t.toLowerCase().includes(query.toLowerCase()))
  const [top, ...rest] = list
  const loading = status === 'loading'

  return (
    <section className="space-y-5 pb-10 animate-fade">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight">Últimas noticias</h2>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'error' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
          <i className={`h-1.5 w-1.5 rounded-full ${status === 'error' ? 'bg-amber-500' : 'animate-pulse bg-emerald-500'}`} />{status === 'error' ? 'Datos de ejemplo' : 'En vivo'}</span>
        <button onClick={reload} aria-label="Actualizar" className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm transition hover:scale-110 active:scale-90 dark:bg-white/10"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400"><WifiOff size={17} />
          No se pudieron cargar las noticias en vivo. Mostrando ejemplos. <button onClick={reload} className="ml-auto font-semibold underline">Reintentar</button></div>
      )}

      <div className="flex flex-wrap gap-2">
        {sources.map((s) => <button key={s} onClick={() => setSrc(s)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 active:scale-95 ${src === s ? 'bg-brand text-white shadow-md shadow-brand/30' : 'bg-white text-slate-600 hover:text-brand dark:bg-white/5 dark:text-slate-300'}`}>{s}</button>)}
      </div>

      {loading && !items.length && <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((k) => <div key={k} className="card h-56 animate-pulse" />)}</div>}
      {!loading && !list.length && <p className="py-10 text-center text-sm text-slate-500">Sin resultados.</p>}

      {top && (
        <Reveal key={src + query}>
          <NewsLink n={top} className="group relative block h-[300px] cursor-pointer overflow-hidden rounded-2xl shadow-lg">
            <Poster img={top.img} q={top.q} grad={top.grad} wide title="" className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 max-w-2xl space-y-2 p-6 text-white">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] backdrop-blur">{top.s} · {top.h}</span>
              <h3 className="text-2xl font-extrabold leading-tight">{top.t}</h3>
              <p className="line-clamp-2 text-sm text-white/80">{top.d}</p>
            </div>
            {top.link && <ExternalLink size={18} className="absolute right-4 top-16 text-white/80 transition group-hover:scale-125" />}
            <LikeBtn on={rec.isNewsLiked(top.id)} onClick={() => rec.likeNews(top)} className="absolute right-3 top-3 !h-10 !w-10" />
          </NewsLink>
        </Reveal>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((n, i) => (
          <Reveal key={n.id + src} delay={(i % 6) * 70}>
            <NewsLink n={n} className="group card flex h-full cursor-pointer flex-col overflow-hidden transition duration-500 ease-spring hover:-translate-y-1.5 hover:shadow-xl">
              <Poster img={n.img} q={n.q} grad={n.grad} wide title="" className="h-36"><LikeBtn on={rec.isNewsLiked(n.id)} onClick={() => rec.likeNews(n)} className="absolute right-2 top-2" /></Poster>
              <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                <p className="text-[11px] font-semibold text-brand">{n.s} · <span className="font-normal text-slate-500">{n.h}</span></p>
                <h4 className="line-clamp-2 text-sm font-bold leading-snug">{n.t}</h4>
                <p className="line-clamp-3 text-xs text-slate-500">{n.d}</p>
              </div>
            </NewsLink>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
