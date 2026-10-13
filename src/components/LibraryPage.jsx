import { useState } from 'react'
import { BookOpen, Check, Clock3, Heart, Pause, Plus, Trash2 } from 'lucide-react'
import Poster from './Poster'
import { useProfile } from '../profile/ProfileProvider'

const filters = [
  ['all', 'Todo'],
  ['watching', 'Viendo'],
  ['planned', 'Planeo ver'],
  ['paused', 'En pausa'],
  ['completed', 'Terminados'],
  ['favorites', 'Favoritos'],
]

const statusLabel = { watching: 'Viendo', planned: 'Planeo ver', paused: 'En pausa', completed: 'Terminado' }
const statusIcon = { watching: Clock3, planned: BookOpen, paused: Pause, completed: Check }

function LibraryCard({ item, onStatusChange, onToggleFavorite, onRemove }) {
  const StatusIcon = statusIcon[item.status] || BookOpen
  return <article className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white/80 p-2.5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5">
    <Poster {...item} title={item.t} className="aspect-[3/4] rounded-xl" />
    <div className="px-0.5 pt-2">
      <p className="truncate text-sm font-bold" title={item.t}>{item.t}</p>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><StatusIcon size={12} />{statusLabel[item.status] || item.s}{item.year ? ` · ${item.year}` : ''}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <select value={item.status || 'planned'} onChange={(event) => onStatusChange(item.id, event.target.value)} aria-label={`Estado de ${item.t}`} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-1.5 py-1 text-[10px] text-slate-500 outline-none dark:border-white/10">
          <option value="watching">Viendo</option><option value="planned">Planeo ver</option><option value="paused">En pausa</option><option value="completed">Terminado</option>
        </select>
        <button onClick={() => onToggleFavorite(item.id)} aria-label={item.favorite ? `Quitar ${item.t} de favoritos` : `Marcar ${item.t} como favorito`} className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${item.favorite ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-white/10'}`}><Heart size={13} className={item.favorite ? 'fill-white' : ''} /></button>
        <button onClick={() => onRemove(item.id)} aria-label={`Quitar ${item.t} de la biblioteca`} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-500"><Trash2 size={13} /></button>
      </div>
    </div>
  </article>
}

export default function LibraryPage({ query = '', onDiscover }) {
  const { profile, profileStatus, updateAnimeList } = useProfile()
  const [filter, setFilter] = useState('all')
  const library = Array.isArray(profile.animeList) ? profile.animeList : []
  const normalizedQuery = query.trim().toLowerCase()
  const visible = library.filter((item) => {
    const matchesFilter = filter === 'all' || (filter === 'favorites' ? item.favorite : item.status === filter)
    const matchesQuery = !normalizedQuery || `${item.t} ${item.q}`.toLowerCase().includes(normalizedQuery)
    return matchesFilter && matchesQuery
  })

  const update = (id, patch) => updateAnimeList((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item))
  const remove = (id) => updateAnimeList((items) => items.filter((item) => item.id !== id))

  if (profileStatus === 'loading') return <div className="card grid min-h-64 place-items-center p-8 text-sm text-slate-500">Cargando tu biblioteca…</div>

  return <section className="space-y-5 pb-10 animate-fade">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-4xl font-extrabold tracking-tight">Biblioteca</h1><p className="text-sm text-slate-500">Todo lo que has agregado para volver cuando quieras.</p></div>
      <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">{library.length} {library.length === 1 ? 'obra' : 'obras'}</span>
    </div>
    <div className="scroll-hide flex gap-2 overflow-x-auto pb-1">
      {filters.map(([id, label]) => <button key={id} onClick={() => setFilter(id)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${filter === id ? 'bg-brand text-white shadow-md shadow-brand/25' : 'bg-white text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>{label}{id === 'favorites' && <Heart size={12} className="ml-1 inline" />}</button>)}
    </div>
    {!library.length ? <div className="card grid min-h-72 place-items-center p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand"><BookOpen size={25} /></span><h2 className="mt-4 text-xl font-bold">Tu biblioteca está vacía</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Agrega anime desde el catálogo o desde las recomendaciones de Para ti y aparecerá aquí.</p>{onDiscover && <button onClick={onDiscover} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:-translate-y-0.5"><Plus size={15} />Explorar anime</button>}</div></div>
      : visible.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visible.map((item) => <LibraryCard key={item.id} item={item} onStatusChange={(id, status) => update(id, { status })} onToggleFavorite={(id) => update(id, { favorite: !library.find((entry) => entry.id === id)?.favorite })} onRemove={remove} />)}</div>
      : <div className="card p-8 text-center"><p className="font-semibold">No hay obras en este filtro</p><p className="mt-1 text-sm text-slate-500">Prueba con otra categoría o agrega más títulos.</p></div>}
  </section>
}
