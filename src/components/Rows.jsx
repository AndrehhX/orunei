import { ChevronRight, Star, MoreHorizontal } from 'lucide-react'
import Poster from './Poster'
import Reveal from './Reveal'
import { library, because } from '../data'
import { useNews, NewsLink } from '../news'

export const Title = ({ children, onClick }) => (
  <div className="mb-3 flex items-center justify-between"><h3 onClick={onClick} className={`flex items-center gap-1 text-[17px] font-bold transition-colors ${onClick ? 'cursor-pointer hover:text-brand' : ''}`}>{children}<ChevronRight size={17} /></h3><ChevronRight size={15} className="text-slate-400" /></div>
)
const Dots = () => <button className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-white opacity-80 transition hover:opacity-100"><MoreHorizontal size={14} /></button>

const Empty = ({ q }) => <p className="col-span-full py-6 text-center text-sm text-slate-500">Sin resultados para “{q}”</p>
const ok = (t, q) => t.toLowerCase().includes((q || '').toLowerCase())
const stag = (i, b = 0) => b + i * 70

export function Library({ query }) {
  const list = library.filter((a) => ok(a.t, query))
  return (
    <section>
      <Title>Continuar con tu biblioteca</Title>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {!list.length && <Empty q={query} />}
        {list.map((a, i) => (
          <Reveal key={a.t} delay={stag(i, 150)}><article className="group card cursor-pointer overflow-hidden transition duration-500 ease-spring hover:-translate-y-1.5 hover:shadow-xl">
            <Poster {...a} title={a.t} className="aspect-[3/3.6]"><Dots /></Poster>
            <div className="px-2.5 py-2"><p className="truncate text-[13px] font-semibold">{a.t}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><i className={`h-2 w-2 rounded-full ${a.dot}`} />{a.s}</p></div>
          </article></Reveal>
        ))}
      </div>
    </section>
  )
}
export function Because({ query }) {
  const list = because.filter((a) => ok(a.t, query))
  return (
    <section>
      <Title>Porque te gusta A Silent Voice</Title>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {!list.length && <Empty q={query} />}
        {list.map((a, i) => (
          <Reveal key={a.t} delay={stag(i, 250)}><article className="group cursor-pointer transition duration-500 hover:-translate-y-1.5">
            <Poster {...a} title={a.t} className="aspect-[3/2.1] rounded-xl shadow-sm group-hover:shadow-xl"><Dots /></Poster>
            <p className="mt-2 truncate text-[13px] font-semibold">{a.t}</p>
            <div className="flex justify-between text-[11px] text-slate-500"><span>{a.y}</span><span className="flex items-center gap-0.5 font-semibold text-slate-700 dark:text-slate-200"><Star size={11} className="fill-yellow-400 text-yellow-400" />{a.r}</span></div>
          </article></Reveal>
        ))}
      </div>
    </section>
  )
}
export function News({ query, onMore }) {
  const { items, status } = useNews()
  const list = items.filter((a) => ok(a.t, query)).slice(0, 2)
  return (
    <section className="pb-8">
      <Title onClick={onMore}>Noticias para ti</Title>
      <div className="grid gap-3 md:grid-cols-2">
        {status === 'loading' && !items.length && [0, 1].map((k) => <div key={k} className="card h-[122px] animate-pulse" />)}
        {status !== 'loading' && !list.length && <Empty q={query} />}
        {list.map((n, i) => (
          <Reveal key={n.id} delay={stag(i, 350)}>
            <NewsLink n={n} className="group card flex cursor-pointer gap-3 p-2.5 transition duration-500 ease-spring hover:-translate-y-1 hover:shadow-xl">
              <Poster img={n.img} q={n.q} grad={n.grad} wide title="" className="h-[102px] w-[206px] shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-col justify-center"><h4 className="line-clamp-2 text-sm font-bold leading-snug">{n.t}</h4>
                <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{n.d}</p>
                <p className="mt-2 text-[11px] text-slate-500">{n.s} · {n.h}</p></div>
            </NewsLink>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
