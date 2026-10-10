import { ArrowRight, UserCheck, Flame } from 'lucide-react'
import Poster from './Poster'
import { similar, trends, featured } from '../data'

const Head = ({ children }) => <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{children}</h3><a href="#" className="flex items-center gap-1 text-[11px] text-brand">Ver todo <ArrowRight size={12} /></a></div>
const Avatar = ({ grad }) => <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${grad}`} />

export default function RightPanel() {
  return (
    <aside className="hidden w-[300px] shrink-0 space-y-4 py-5 pr-5 xl:block animate-fade">
      <div className="card p-3.5">
        <div className="mb-2 flex justify-between"><h3 className="font-bold">Tu perfil</h3><a href="#" className="flex items-center gap-1 text-[11px] text-brand">Ver perfil <ArrowRight size={12} /></a></div>
        <div className="h-16 rounded-lg bg-gradient-to-r from-[#3a2a6a] via-[#c06a9a] to-[#f4a6c1]" />
        <div className="-mt-7 flex items-end gap-2 px-2"><div className="h-[68px] w-[68px] rounded-full border-4 border-white dark:border-[#171723] bg-gradient-to-br from-slate-600 to-slate-900" />
          <div className="pb-1 leading-tight"><p className="font-bold text-sm">Dereck</p><p className="text-xs text-slate-500">@dereck</p></div></div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/10 text-center">
          {[['128', 'Obras'], ['42', 'Seguidores'], ['36', 'Siguiendo']].map(([a, b]) => <div key={b}><p className="font-bold">{a}</p><p className="text-[11px] text-slate-500">{b}</p></div>)}
        </div>
      </div>
      <div className="card p-3.5">
        <Head>Perfiles con gustos similares</Head>
        {similar.map((s) => (
          <div key={s.n} className="flex items-center gap-2.5 py-2"><Avatar grad={s.grad} />
            <div className="leading-tight"><p className="text-sm font-semibold">{s.n}</p><p className="text-[11px] text-slate-500"><b>{s.p}%</b> afinidad · {s.c} obras en común</p></div>
            <button className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-white/10 transition hover:bg-brand hover:text-white"><UserCheck size={15} /></button></div>
        ))}
      </div>
      <div className="card p-3.5">
        <Head>Tendencias hoy</Head>
        {trends.map((t, i) => (
          <div key={t.t} className="group flex cursor-pointer items-center gap-3 py-1.5">
            <span className="w-3 text-sm font-bold">{i + 1}</span>
            <Poster {...t} title="" className="h-[46px] w-[46px] shrink-0 rounded-lg" />
            <div className="min-w-0 leading-tight"><p className="truncate text-sm font-semibold">{t.t}</p><p className="text-[11px] text-slate-500">Anime · {t.y}</p></div>
            <span className="ml-auto flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><Flame size={14} className="text-orange-500" />{t.v}</span>
          </div>
        ))}
      </div>
      <div className="card p-3.5">
        <Head>Noticias destacadas</Head>
        {featured.map((f) => (
          <div key={f.t} className="group flex cursor-pointer gap-3 py-2"><Poster {...f} wide title="" className="h-[62px] w-[98px] shrink-0 rounded-lg" />
            <div className="leading-snug"><p className="text-[13px] font-bold">{f.t}</p><p className="text-[11px] text-slate-500">{f.s} · {f.h}</p></div></div>
        ))}
      </div>
    </aside>
  )
}
