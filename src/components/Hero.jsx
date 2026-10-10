import { Sparkles, Star, Plus, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react'
import Poster from './Poster'
import { hero, trending } from '../data'

export default function Hero() {
  return (
    <section className="grid gap-4 md:grid-cols-[1fr_260px] xl:grid-cols-[1fr_260px] animate-rise">
      <Poster {...hero} wide title={hero.title} className="group h-[247px] rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
        <div className="absolute right-4 top-4 flex gap-2">
          {[ChevronLeft, ChevronRight].map((I, i) => <button key={i} className="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 hover:scale-110"><I size={18} /></button>)}
        </div>
        <div className="relative flex h-full max-w-[420px] flex-col justify-center gap-2 p-7 text-white">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur"><Sparkles size={13} className="text-yellow-300" />Recomendación para ti</span>
          <h2 className="text-4xl font-extrabold tracking-tight">{hero.title}</h2>
          <p className="text-xs text-white/80">{hero.meta}</p>
          <p className="text-sm leading-relaxed text-white/85">{hero.desc}</p>
          <div className="mt-2 flex gap-2">
            <button className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold transition hover:brightness-110 hover:-translate-y-0.5"><Plus size={16} />Agregar a mi biblioteca</button>
            <button className="rounded-lg border border-white/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/15">+ Ver detalles</button>
            <button className="grid w-10 place-items-center rounded-lg border border-white/40 transition hover:bg-white/15"><Bookmark size={16} /></button>
          </div>
        </div>
      </Poster>
      <Poster {...trending} className="group hidden h-[247px] rounded-2xl md:block">
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur"><Sparkles size={13} className="text-yellow-300" />Tendencia en Anime</span>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="text-xl font-bold">{trending.title}</h3>
          <p className="text-[11px] text-white/80">{trending.meta}</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><Star size={14} className="fill-yellow-400 text-yellow-400" />{trending.rating}</p>
        </div>
        <button className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white text-black transition hover:scale-110 hover:rotate-90"><Plus size={18} /></button>
      </Poster>
    </section>
  )
}
