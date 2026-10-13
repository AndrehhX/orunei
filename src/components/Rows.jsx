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
const ok = (t, q) => t.toLowerCase().includes((q || '').toLowerCase())
export function Library({ query, onMore }) {
  const { profile } = useProfile()
  const source = Array.isArray(profile.animeList) ? profile.animeList : []
  const list = source.filter((a) => ok(a.t, query))
  return (
    <section>
      <Title onClick={onMore}>Continuar con tu biblioteca</Title>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {!list.length && <Empty q={query} message={query ? undefined : 'Tu biblioteca está vacía. Agrega obras a tu AnimeList para verlas aquí.'} />}
        {list.map((a) => (
          <article key={a.t} className="group card cursor-pointer overflow-hidden transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 320px' }}>
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

function RecCard({ i, rec }) {
  const [out, setOut] = useState(false)
  const act = (fn) => { setOut(true); setTimeout(() => fn(i.id), 320) } // card shrinks away, then the engine refills the row
  return (
      <article className={`group cursor-pointer transition-all duration-300 ease-smooth hover:-translate-y-1.5 ${out ? 'scale-75 opacity-0' : ''}`} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 260px' }}>
        <Poster img={i.banner || i.img} grad="linear-gradient(135deg,#c9b7e6,#6f8a6b)" title={i.title} className="aspect-[3/2.1] rounded-xl shadow-sm group-hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute right-1.5 top-1.5 flex translate-y-1 gap-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <LikeBtn on={false} onClick={() => act(rec.like)} />
            <button onClick={() => act(rec.dismiss)} aria-label="No me interesa" className="grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:scale-110 hover:bg-red-500/80 active:scale-90"><X size={15} /></button>
          </div>
          <p className="absolute inset-x-0 bottom-0 p-2 text-[10px] font-medium leading-tight text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">{i.reason}</p>
        </Poster>
        <p className="mt-2 truncate text-[13px] font-semibold">{i.title}</p>
        <Stat y={i.year} r={(i.score / 10).toFixed(1)} />
      </article>
  )
}

export function Because({ query }) {
  const rec = useRec()
  const { profile } = useProfile()
  const profileLibrary = Array.isArray(profile.animeList) ? profile.animeList : []
  const librarySignature = profileLibrary.map((item) => `${item.id}:${item.status}:${item.favorite ? '1' : '0'}`).join('|')
  useEffect(() => {
    if (rec.ready) rec.syncLibrary(profileLibrary)
  }, [rec.ready, rec.syncLibrary, librarySignature])
  const live = profileLibrary.length > 0 && rec.ready
  const list = live ? rec.recs.slice(0, 6).filter((a) => ok(a.title || a.t, query)) : []
  const title = profileLibrary.length > 0 ? (rec.anchor ? `Porque te gusta ${rec.anchor}` : 'Recomendado para ti') : 'Recomendaciones para ti'
  const emptyMessage = query
    ? undefined
    : profileLibrary.length === 0
      ? 'Añade obras a tu AnimeList para recibir recomendaciones personalizadas.'
      : rec.ready
        ? 'Todavía no encontramos recomendaciones para tu perfil.'
        : 'Estamos preparando recomendaciones para tu perfil…'
  return (
    <section>
      <div key={title} className="animate-fade"><Title>{title}</Title></div>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {!list.length && <Empty q={query} message={emptyMessage} />}
        {list.map((a) => <RecCard key={a.id} i={a} rec={rec} />)}
      </div>
    </section>
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
