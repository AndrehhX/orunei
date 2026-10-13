import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Star, Plus, Check, ChevronLeft, ChevronRight, Bookmark, Info } from 'lucide-react'
import Poster from './Poster'
import { slides, trending } from '../data'
import { useRec } from '../rec/rec'
import { useProfile } from '../profile/ProfileProvider'
import { createLibraryEntry } from '../profile/model.js'
import { formatHeroTitle, truncateWithEllipsis } from '../ui/text.js'

export default function Hero({ onOpenDetail }) {
  const rec = useRec()
  const { profile, updateAnimeList, recordActivity } = useProfile()
  const latest = rec.latest || []
  const currentSlides = useMemo(() => latest.length >= 3 ? latest.map((item) => ({
    id: item.id,
    title: item.title,
    q: item.title,
    img: item.img,
    banner: item.banner,
    meta: `${item.year || '—'} · Anime${item.genres?.length ? ` · ${item.genres.slice(0, 2).join(' · ')}` : ''}`,
    desc: truncateWithEllipsis(item.description || 'Descubre una nueva historia que acaba de llegar a Orunei.'),
    grad: 'linear-gradient(135deg,#1b1f4d,#c0627a)',
  })) : slides.map((slide) => ({ ...slide, desc: truncateWithEllipsis(slide.desc) })), [latest])
  const currentTrending = useMemo(() => latest[0] ? {
    id: latest[0].id,
    title: latest[0].title,
    q: latest[0].title,
    img: latest[0].img,
    banner: latest[0].banner,
    meta: `${latest[0].year || '—'} · Anime${latest[0].genres?.length ? ` · ${latest[0].genres.slice(0, 2).join(' · ')}` : ''}`,
    rating: latest[0].score ? (latest[0].score / 10).toFixed(1) : '—',
    grad: 'linear-gradient(135deg,#2a0f3a,#1f6b5a)',
  } : trending, [latest])
  const [i, setI] = useState(0)
  const [pause, setPause] = useState(false)
  const [saved, setSaved] = useState({})
  const heroLabel = rec.personalized && latest.length >= 3 ? 'Recomendación para ti' : 'Descubre ahora'
  const go = (d) => setI((v) => (v + d + currentSlides.length) % currentSlides.length)
  const inLibrary = (slide) => profile.animeList.some((item) => item.q === slide.q || item.t === slide.title)
  const toggleLibrary = async (slide) => {
    const exists = inLibrary(slide)
    const result = await updateAnimeList((items) => exists ? items.filter((item) => item.q !== slide.q && item.t !== slide.title) : [...items, createLibraryEntry(slide)])
    if (!result?.ok) return
    rec.addByQuery(slide.q, !exists)
    recordActivity('library', `${exists ? 'Quitó' : 'Añadió'} “${slide.title}” ${exists ? 'de' : 'a'} su biblioteca`)
  }
  useEffect(() => {
    if (pause) return
    const id = setInterval(() => go(1), 7000)
    return () => clearInterval(id)
  }, [pause, currentSlides.length])
  useEffect(() => setI((value) => currentSlides.length ? value % currentSlides.length : 0), [currentSlides.length])

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px] animate-rise">
      <div className="relative h-[360px] overflow-hidden rounded-2xl shadow-sm md:h-[340px] xl:h-[320px]" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
        {currentSlides.map((s, n) => {
          const on = n === i
          return (
            <Poster key={s.title} {...s} wide title={s.title}
              className={`absolute inset-0 transition-all duration-[900ms] ease-out ${on ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-[1.04]'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
              <div className={`relative flex h-full max-w-[430px] flex-col justify-start gap-2 px-6 pb-12 pt-6 text-white transition-all duration-700 delay-150 ${on ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
                <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur"><Sparkles size={13} className="text-yellow-300" />{heroLabel}</span>
                <h2 className="line-clamp-2 h-[80px] shrink-0 overflow-hidden text-4xl font-extrabold leading-[1.05] tracking-tight">{formatHeroTitle(s.title)}</h2>
                <p className="text-xs text-white/80">{s.meta}</p>
                <p className="line-clamp-2 h-12 shrink-0 overflow-hidden text-sm leading-6 text-white/85">{s.desc}</p>
                <div className="mt-auto flex gap-2">
                  <button onClick={() => toggleLibrary(s)}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${inLibrary(s) ? 'bg-emerald-500' : 'bg-brand hover:brightness-110'}`}>
                    {inLibrary(s) ? <Check size={16} /> : <Plus size={16} />}{inLibrary(s) ? 'En tu biblioteca' : 'Agregar a mi biblioteca'}</button>
                  <button onClick={() => onOpenDetail?.(s)} className="flex items-center gap-1.5 rounded-lg border border-white/40 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/15 active:scale-95"><Info size={15} />Ver detalles</button>
                  <button onClick={() => setSaved((a) => ({ ...a, [n]: !a[n] }))} aria-label="Guardar" className="grid w-10 place-items-center rounded-lg border border-white/40 transition hover:bg-white/15 active:scale-90"><Bookmark size={16} className={`transition-all ${saved[n] ? 'fill-white' : ''}`} /></button>
                </div>
              </div>
            </Poster>
          )
        })}
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {[[ChevronLeft, -1], [ChevronRight, 1]].map(([I, d]) => (
            <button key={d} onClick={() => go(d)} aria-label={d < 0 ? 'Anterior' : 'Siguiente'} className="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:scale-110 hover:bg-black/60 active:scale-90"><I size={18} /></button>
          ))}
        </div>
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {currentSlides.map((_, n) => <i key={n} className={`h-1.5 rounded-full bg-white transition-all duration-500 ${n === i ? 'w-5 opacity-100' : 'w-1.5 opacity-40'}`} />)}
        </div>
      </div>
      <Poster {...currentTrending} onClick={() => onOpenDetail?.(currentTrending)} className="group hidden h-[360px] cursor-pointer rounded-2xl shadow-sm md:h-[340px] xl:h-[320px] md:block">
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur"><Sparkles size={13} className="text-yellow-300" />Tendencia en Anime</span>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="line-clamp-2 h-[48px] overflow-hidden text-lg font-bold leading-6">{formatHeroTitle(currentTrending.title, 34)}</h3>
          <p className="text-[11px] text-white/80">{currentTrending.meta}</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold"><Star size={14} className="fill-yellow-400 text-yellow-400" />{currentTrending.rating}</p>
        </div>
        <button onClick={(event) => { event.stopPropagation(); toggleLibrary(currentTrending) }} aria-label="Agregar" className={`absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full transition-all duration-300 hover:scale-110 active:scale-90 ${inLibrary(currentTrending) ? 'rotate-[360deg] bg-emerald-400 text-white' : 'bg-white text-black'}`}>{inLibrary(currentTrending) ? <Check size={18} /> : <Plus size={18} />}</button>
      </Poster>
    </section>
  )
}
