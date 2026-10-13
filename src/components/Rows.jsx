import { useEffect, useState } from 'react'
import { ChevronRight, Star, MoreHorizontal, X } from 'lucide-react'
import LikeBtn from './LikeBtn'
import { useRec } from '../rec/rec'
import Poster from './Poster'
import { useNews, NewsLink } from '../news'
import { useProfile } from '../profile/ProfileProvider'

export const Title = ({ children, onClick }) => (
  <div className="mb-3 flex items-center justify-between"><h3 onClick={onClick} className={`flex items-center gap-1 text-[17px] font-bold transition-colors ${onClick ? 'cursor-pointer hover:text-brand' : ''}`}>{children}<ChevronRight size={17} /></h3><ChevronRight size={15} className="text-slate-400" /></div>
)
const Dots = ({ onClick }) => <button onClick={(event) => { event.stopPropagation(); onClick?.() }} aria-label="Abrir biblioteca" className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white opacity-80 transition hover:opacity-100"><MoreHorizontal size={14} /></button>

const Empty = ({ q, message }) => <div className="col-span-full rounded-2xl border border-dashed border-slate-300/80 px-5 py-7 text-center text-sm leading-6 text-slate-500 dark:border-white/10">{message || `Sin resultados para “${q}”`}</div>
const ok = (t = '', q) => String(t).toLowerCase().includes((q || '').toLowerCase())
export function Library({ query, onMore, onOpenAnime }) {
  const { profile } = useProfile()
  const source = Array.isArray(profile.animeList) ? profile.animeList : []
  const list = source.filter((a) => ok(a.t, query))
  return (
    <section>
      <Title onClick={onMore}>Continuar con tu biblioteca</Title>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {!list.length && <Empty q={query} message={query ? undefined : 'Tu biblioteca está vacía. Agrega obras a tu AnimeList para verlas aquí.'} />}
        {list.map((a) => (
          <article key={a.t} onClick={() => onOpenAnime?.(a)} className="group card cursor-pointer overflow-hidden transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 320px' }}>
            <Poster {...a} title={a.t} className="aspect-[3/3.6]"><Dots onClick={onMore} /></Poster>
            <div className="px-2.5 py-2"><p className="truncate text-[13px] font-semibold">{a.t}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><i className={`h-2 w-2 rounded-full ${a.dot}`} />{a.s}</p></div>
          </article>
        ))}
      </div>
    </section>
  )
}
const Stat = ({ y, r }) => <div className="flex justify-between text-[11px] text-slate-500"><span>{y}</span><span className="flex items-center gap-0.5 font-semibold text-slate-700 dark:text-slate-200"><Star size={11} className="fill-yellow-400 text-yellow-400" />{r}</span></div>

function RecCard({ i, rec, onOpenAnime }) {
  const [out, setOut] = useState(false)
  const act = (fn) => { setOut(true); setTimeout(() => fn(i.id), 320) } // card shrinks away, then the engine refills the row
  return (
      <article onClick={() => onOpenAnime?.(i)} className={`group cursor-pointer transition-all duration-300 ease-smooth hover:-translate-y-1.5 ${out ? 'scale-75 opacity-0' : ''}`} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 260px' }}>
        <Poster img={i.banner || i.img} grad="linear-gradient(135deg,#c9b7e6,#6f8a6b)" title={i.title} className="aspect-[3/2.1] rounded-xl shadow-sm group-hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute right-1.5 top-1.5 flex translate-y-1 gap-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <LikeBtn on={rec.isLiked(i.id)} onClick={() => act(rec.like)} />
            <button onClick={(event) => { event.stopPropagation(); act(rec.dismiss) }} aria-label="No me interesa" className="grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:scale-110 hover:bg-red-500/80 active:scale-90"><X size={15} /></button>
          </div>
          <p className="absolute inset-x-0 bottom-0 p-2 text-[10px] font-medium leading-tight text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">{i.reason}</p>
        </Poster>
        <p className="mt-2 truncate text-[13px] font-semibold">{i.title}</p>
        <Stat y={i.year} r={(i.score / 10).toFixed(1)} />
      </article>
  )
}

function RecommendationSection({ title, items, query, rec, onOpenAnime, used, emptyMessage, reasonFallback }) {
  const list = []
  for (const item of items || []) {
    const id = String(item.id)
    if (used.has(id) || !ok(item.title || item.t, query)) continue
    used.add(id)
    list.push({ ...item, reason: item.reason || reasonFallback })
    if (list.length === 6) break
  }
  if (!list.length && !emptyMessage) return null
  return <section className="animate-fade">
    <Title>{title}</Title>
    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
      {!list.length && <Empty q={query} message={emptyMessage} />}
      {list.map((item) => <RecCard key={`${title}-${item.id}`} i={item} rec={rec} onOpenAnime={onOpenAnime} />)}
    </div>
  </section>
}

export function Because({ query, onOpenAnime }) {
  const rec = useRec()
  const { profile } = useProfile()
  const profileLibrary = Array.isArray(profile.animeList) ? profile.animeList : []
  const librarySignature = profileLibrary.map((item) => `${item.id}:${item.status}:${item.favorite ? '1' : '0'}`).join('|')
  useEffect(() => {
    if (rec.ready) rec.syncLibrary(profileLibrary)
  }, [rec.ready, rec.syncLibrary, librarySignature])
  const used = new Set()
  const libraryIds = new Set(profileLibrary.map((item) => String(item.id)))
  const coldStart = rec.coldStart || !rec.personalized
  const emptyMessage = query ? undefined : profileLibrary.length === 0 ? 'Añade obras a tu AnimeList para recibir recomendaciones personalizadas.' : rec.ready ? 'Todavía no encontramos recomendaciones para tu perfil.' : 'Estamos preparando recomendaciones para tu perfil…'
  const latest = (rec.latest || []).filter((item) => !libraryIds.has(String(item.id))).map((item) => ({ ...item, reason: coldStart ? 'Una obra reciente para descubrir' : 'Una obra reciente para ampliar tu biblioteca' }))
  return (
    <div className="space-y-7">
      <RecommendationSection title={!coldStart ? (rec.anchor ? `Porque te gusta ${rec.anchor}` : 'Recomendado para ti') : 'Tendencias para descubrir'} items={rec.recs} query={query} rec={rec} onOpenAnime={onOpenAnime} used={used} emptyMessage={emptyMessage} reasonFallback={!coldStart ? 'Seleccionado según tu actividad' : 'Popular y en tendencia ahora'} />
      <RecommendationSection title="Cerca de tus gustos" items={rec.affinityRecs} query={query} rec={rec} onOpenAnime={onOpenAnime} used={used} reasonFallback="Coincide con tus gustos" />
      <RecommendationSection title={rec.personalized ? 'Tendencias compatibles' : 'Tendencias de hoy'} items={rec.trendingRecs} query={query} rec={rec} onOpenAnime={onOpenAnime} used={used} reasonFallback="Está en tendencia ahora" />
      <RecommendationSection title="Descubre algo nuevo" items={rec.exploreRecs} query={query} rec={rec} onOpenAnime={onOpenAnime} used={used} reasonFallback="Algo nuevo que podría gustarte" />
      <RecommendationSection title="Recién llegados" items={latest} query={query} rec={rec} onOpenAnime={onOpenAnime} used={used} reasonFallback="Una obra reciente para descubrir" />
    </div>
  )
}
export function News({ query, onMore }) {
  const { items, status } = useNews()
  const rec = useRec()
  const list = items.filter((a) => ok(a.t, query)).slice(0, 2)
  return (
    <section className="pb-8">
      <Title onClick={onMore}>Noticias para ti</Title>
      <div className="grid gap-3 md:grid-cols-2">
        {status === 'loading' && !items.length && [0, 1].map((k) => <div key={k} className="card h-[122px] animate-pulse" />)}
        {status !== 'loading' && !list.length && <Empty q={query} />}
        {list.map((n) => (
            <NewsLink key={n.id} n={n} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 130px' }} className="group card flex cursor-pointer gap-3 p-2.5 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">
              <Poster img={n.img} q={n.q} grad={n.grad} wide title="" className="h-[102px] w-[206px] shrink-0 rounded-xl"><LikeBtn on={rec.isNewsLiked(n.id)} onClick={() => rec.likeNews(n)} className="absolute right-1.5 top-1.5" /></Poster>
              <div className="flex min-w-0 flex-col justify-center"><h4 className="line-clamp-2 text-sm font-bold leading-snug">{n.t}</h4>
                <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{n.d}</p>
                <p className="mt-2 text-[11px] text-slate-500">{n.s} · {n.h}</p></div>
            </NewsLink>
        ))}
      </div>
    </section>
  )
}
