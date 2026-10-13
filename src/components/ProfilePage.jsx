import { useMemo, useState } from 'react'
import { Activity, ArrowDown, ArrowUp, BookOpen, Check, ChevronRight, Heart, List, LockKeyhole, Pencil, PlayCircle, Plus, Sparkles, Trash2, X } from 'lucide-react'
import Poster from './Poster'
import { library } from '../data'
import { useRec } from '../rec/rec'
import { useProfile } from '../profile/ProfileProvider'
import { selectAnimeSections, selectProfileStats, selectRecentActivity } from '../profile/profileData'
import { addAnimeToList, createCustomList, deleteCustomList, moveCustomList, removeAnimeFromList, updateCustomList } from '../profile/profileLists'

const tabs = [
  ['overview', 'Resumen', Sparkles],
  ['animelist', 'AnimeList', BookOpen],
  ['favorites', 'Favoritos', Heart],
  ['lists', 'Listas', List],
  ['activity', 'Actividad', Activity],
]
const groups = [
  ['watching', 'Viendo ahora', PlayCircle, 'text-emerald-500'],
  ['planned', 'Planeo ver', BookOpen, 'text-blue-500'],
  ['paused', 'En pausa', PlayCircle, 'text-amber-500'],
  ['completed', 'Terminados', Check, 'text-emerald-500'],
  ['favorites', 'Favoritos', Heart, 'text-pink-500'],
]

function Avatar({ profile, large = false }) {
  return <div className={`${large ? 'h-24 w-24 md:h-28 md:w-28' : 'h-10 w-10'} overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-slate-600 to-slate-900 shadow-lg dark:border-[#171723]`}>
    {profile.avatar ? <img src={profile.avatar} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-2xl font-bold text-white">{profile.displayName.slice(0, 1).toUpperCase()}</span>}
  </div>
}

function Banner({ src, className = '' }) {
  return <div className={`relative overflow-hidden bg-gradient-to-r from-[#3a2a6a] via-brand to-[#f08ab8] ${className}`}>{src && <img src={src} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} className="absolute inset-0 h-full w-full object-cover" />}</div>
}

function AnimeCard({ item }) {
  return <article className="group min-w-0">
    <Poster {...item} title={item.t} className="aspect-[3/3.7] rounded-2xl shadow-sm transition duration-500 ease-spring group-hover:-translate-y-1 group-hover:shadow-xl" />
    <p className="mt-2 truncate text-sm font-bold">{item.t}</p>
    <p className="truncate text-[11px] text-slate-500">{item.s}</p>
  </article>
}

function EmptyState({ title, detail, action }) {
  return <div className="card col-span-full grid min-h-40 place-items-center border-dashed p-6 text-center">
    <div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-slate-500">{detail}</p>{action}</div>
  </div>
}

function ActivityList({ activity }) {
  if (!activity.length) return <EmptyState title="Todavía no hay actividad" detail="Tus cambios de perfil y listas aparecerán aquí." />
  return <div className="space-y-2">{activity.map((item) => <div key={item.id} className="flex items-start gap-3 rounded-xl bg-white/60 p-3 dark:bg-white/5"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><Activity size={15} /></span><div className="min-w-0"><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 text-[11px] text-slate-500">{new Date(item.at).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}</p></div></div>)}</div>
}

export default function ProfilePage({ onEdit }) {
  const { profile, updateCustomLists, recordActivity } = useProfile()
  const rec = useRec()
  const [active, setActive] = useState(profile.landingSection || 'overview')
  const [newListTitle, setNewListTitle] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [listAnimeDraft, setListAnimeDraft] = useState({})
  const [deletePending, setDeletePending] = useState(null)
  const sections = useMemo(() => selectAnimeSections(library), [])
  const stats = selectProfileStats(library, rec.count, profile)
  const activity = selectRecentActivity(profile, library)
  const featured = library.find((item) => item.q === profile.featuredAnimeId) || library.find((item) => item.s.startsWith('Favorito')) || library[0]
  const createList = () => {
    const list = createCustomList(newListTitle, newListDescription)
    if (!list.title) return
    updateCustomLists((lists) => [...lists, list])
    recordActivity('list', `Creó la lista “${list.title}”`)
    setNewListTitle(''); setNewListDescription('')
  }
  const editList = (id, patch) => updateCustomLists((lists) => updateCustomList(lists, id, patch))
  const removeList = (list) => { updateCustomLists((lists) => deleteCustomList(lists, list.id)); recordActivity('list', `Eliminó la lista “${list.title}”`) }
  const moveList = (list, direction) => updateCustomLists((lists) => moveCustomList(lists, list.id, direction))
  const addToList = (list) => {
    const animeId = listAnimeDraft[list.id]
    if (!animeId) return
    updateCustomLists((lists) => addAnimeToList(lists, list.id, animeId))
    recordActivity('list', `Añadió una obra a “${list.title}”`)
    setListAnimeDraft((current) => ({ ...current, [list.id]: '' }))
  }
  const removeFromList = (list, animeId) => { updateCustomLists((lists) => removeAnimeFromList(lists, list.id, animeId)); recordActivity('list', `Quitó una obra de “${list.title}”`) }

  return <div className="space-y-5 pb-10 animate-fade">
    <section className="overflow-hidden rounded-[26px] border border-white/80 bg-white/90 shadow-sm dark:border-white/5 dark:bg-[#171723]">
      <Banner src={profile.banner} className="h-36 bg-cover bg-center md:h-48" />
      <div className="px-5 pb-5 md:px-8">
        <div className="-mt-12 flex flex-wrap items-end gap-4 md:-mt-14">
          <Avatar profile={profile} large />
          <div className="min-w-[180px] flex-1 pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{profile.displayName}</h1><span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600"><LockKeyhole size={11} /> Solo tú</span></div><p className="text-sm text-slate-500">@{profile.username}</p></div>
          {onEdit && <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand dark:bg-white dark:text-slate-900"><Pencil size={15} /> Editar perfil</button>}
        </div>
        <div className="mt-4 max-w-2xl"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{profile.bio || 'Añade una bio para contar qué historias te acompañan.'}</p>{profile.status && <p className="mt-2 text-xs font-medium text-brand">{profile.status}</p>}</div>
        <div className="mt-5 grid grid-cols-2 divide-x divide-y divide-slate-200 rounded-2xl border border-slate-200/80 bg-slate-50/70 sm:grid-cols-4 sm:divide-y-0 dark:divide-white/10 dark:bg-white/5">
          {[[stats.works, 'Obras'], [stats.favorites, 'Favoritos'], [stats.lists, 'Listas'], [stats.tastes, 'Gustos']].map(([value, label]) => <div key={label} className="px-4 py-3 text-center"><p className="text-xl font-extrabold">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div>)}
        </div>
      </div>
    </section>

    <nav className="scroll-hide flex gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1.5 shadow-sm dark:bg-white/5" aria-label="Secciones del perfil">
      {[...tabs].sort(([a], [b]) => (profile.pinnedSections.includes(a) ? 0 : 1) - (profile.pinnedSections.includes(b) ? 0 : 1)).map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} aria-pressed={active === id} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${active === id ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-slate-500 hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10'}`}><Icon size={15} />{label}</button>)}
    </nav>

    {active === 'overview' && <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Tu espacio</h2><p className="text-xs text-slate-500">Una vista privada de lo que estás viendo.</p></div><button onClick={() => setActive('animelist')} className="text-xs font-semibold text-brand">Ver AnimeList <ChevronRight className="inline" size={14} /></button></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{groups.map(([id, label, Icon, color]) => <button key={id} onClick={() => setActive('animelist')} className="rounded-2xl border border-slate-200/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-brand/40 dark:border-white/10"><Icon size={17} className={color} /><p className="mt-4 text-2xl font-extrabold">{sections[id].length}</p><p className="text-xs text-slate-500">{label}</p></button>)}</div></section>
      <section className="card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Destacado</h2><p className="text-xs text-slate-500">Tu historia elegida.</p></div><Heart size={17} className="text-pink-500" /></div><div className="flex items-center gap-3"><Poster {...featured} title={featured.t} className="h-28 w-20 shrink-0 rounded-xl" /><div className="min-w-0"><p className="truncate font-bold">{featured.t}</p><p className="mt-1 text-xs text-slate-500">{featured.s}</p><p className="mt-3 text-xs leading-5 text-slate-500">Puedes cambiar este destacado desde Editar perfil.</p></div></div></section>
      <section className="card p-5"><div className="mb-4"><h2 className="text-lg font-bold">Tus gustos</h2><p className="text-xs text-slate-500">Según tus interacciones con Orunei.</p></div>{rec.topGenres.length ? <div className="space-y-2.5">{rec.topGenres.slice(0, 5).map((genre) => <div key={genre.name}><div className="mb-1 flex justify-between text-xs"><span className="font-medium">{genre.name}</span><span className="text-slate-500">{genre.pct}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand to-pink-400" style={{ width: `${genre.pct}%` }} /></div></div>)}</div> : <p className="text-sm text-slate-500">Aún estamos aprendiendo tus gustos.</p>}</section>
      <section className="card p-5 xl:col-span-2"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Actividad reciente</h2><button onClick={() => setActive('activity')} className="text-xs font-semibold text-brand">Ver todo <ChevronRight className="inline" size={14} /></button></div><ActivityList activity={activity.slice(0, 3)} /></section>
    </div>}

    {active === 'animelist' && <section className="space-y-5"><div><h2 className="text-2xl font-extrabold">AnimeList</h2><p className="text-sm text-slate-500">Tu biblioteca organizada por estado.</p></div>{groups.map(([id, label, Icon, color]) => <section key={id}><div className="mb-3 flex items-center gap-2"><Icon size={17} className={color} /><h3 className="font-bold">{label}</h3><span className="text-xs text-slate-500">{sections[id].length}</span></div>{sections[id].length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">{sections[id].map((item) => <AnimeCard key={item.q} item={item} />)}</div> : <EmptyState title={`No tienes títulos en “${label}”`} detail="Cuando actualices tu biblioteca aparecerán aquí." />}</section>)}</section>}

    {active === 'favorites' && <section><div className="mb-5"><h2 className="text-2xl font-extrabold">Favoritos</h2><p className="text-sm text-slate-500">Las historias que quieres tener siempre a mano.</p></div>{sections.favorites.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">{sections.favorites.map((item) => <AnimeCard key={item.q} item={item} />)}</div> : <div className="card p-8"><EmptyState title="Aún no tienes favoritos" detail="Marca un anime como favorito desde tu biblioteca." /></div>}</section>}

    {active === 'lists' && <section><div className="mb-5"><h2 className="text-2xl font-extrabold">Listas personalizadas</h2><p className="text-sm text-slate-500">Colecciones privadas para organizar tus historias.</p></div><div className="card mb-5 p-4"><div className="flex flex-col gap-2 sm:flex-row"><input value={newListTitle} onChange={(event) => setNewListTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && createList()} placeholder="Nombre de la nueva lista" className="h-10 flex-1 rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-brand dark:border-white/10" /><input value={newListDescription} onChange={(event) => setNewListDescription(event.target.value)} placeholder="Descripción opcional" className="h-10 flex-1 rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-brand dark:border-white/10" /><button onClick={createList} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-3.5 text-sm font-semibold text-white shadow-md shadow-brand/20"><Plus size={15} /> Crear lista</button></div><p className="mt-2 text-[11px] text-slate-500">Las listas son privadas y se guardan en este navegador.</p></div>{profile.customLists.length ? <div className="grid gap-4 md:grid-cols-2">{profile.customLists.map((list, index) => <article key={list.id} className="card p-5" style={{ borderColor: `${list.accent}55` }}><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><input value={list.title} onChange={(event) => editList(list.id, { title: event.target.value })} aria-label={`Nombre de ${list.title}`} className="w-full bg-transparent font-bold outline-none focus:text-brand" /><input value={list.description} onChange={(event) => editList(list.id, { description: event.target.value })} placeholder="Añade una descripción" aria-label={`Descripción de ${list.title}`} className="mt-1 w-full bg-transparent text-xs text-slate-500 outline-none" /></div><input type="color" value={list.accent || '#6d5cff'} onChange={(event) => editList(list.id, { accent: event.target.value })} aria-label={`Color de ${list.title}`} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" /><div className="flex items-center gap-1"><button onClick={() => moveList(list, -1)} disabled={index === 0} aria-label={`Subir ${list.title}`} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/10"><ArrowUp size={14} /></button><button onClick={() => moveList(list, 1)} disabled={index === profile.customLists.length - 1} aria-label={`Bajar ${list.title}`} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/10"><ArrowDown size={14} /></button></div>{deletePending === list.id ? <div className="flex items-center gap-1"><button onClick={() => { removeList(list); setDeletePending(null) }} className="rounded-lg bg-red-500 px-2 py-1 text-[10px] font-bold text-white">Confirmar</button><button onClick={() => setDeletePending(null)} aria-label="Cancelar eliminación" className="grid h-7 w-7 place-items-center rounded-full text-slate-400"><X size={14} /></button></div> : <button onClick={() => setDeletePending(list.id)} aria-label={`Eliminar ${list.title}`} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-500"><Trash2 size={14} /></button>}</div><div className="mt-4 flex gap-2"><select value={listAnimeDraft[list.id] || ''} onChange={(event) => setListAnimeDraft((current) => ({ ...current, [list.id]: event.target.value }))} aria-label={`Añadir anime a ${list.title}`} className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-2 text-xs outline-none dark:border-white/10"><option value="">Añadir anime…</option>{library.filter((item) => !list.animeIds.includes(item.q)).map((item) => <option key={item.q} value={item.q}>{item.t}</option>)}</select><button onClick={() => addToList(list)} className="rounded-lg border border-brand px-3 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white">Añadir</button></div><div className="mt-3 flex flex-wrap gap-2">{list.animeIds.length ? list.animeIds.map((animeId) => { const item = library.find((entry) => entry.q === animeId); return <span key={animeId} className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] dark:bg-white/10">{item?.t || animeId}<button onClick={() => removeFromList(list, animeId)} aria-label={`Quitar ${item?.t || animeId}`} className="text-slate-400 hover:text-red-500"><X size={12} /></button></span> }) : <span className="text-xs text-slate-500">Lista vacía. Añade una obra arriba.</span>}</div></article>)}</div> : <EmptyState title="Crea tu primera lista" detail="Agrupa tus anime por tema, mood o cualquier criterio personal." />}</section>}

    {active === 'activity' && <section><div className="mb-5"><h2 className="text-2xl font-extrabold">Actividad</h2><p className="text-sm text-slate-500">Un historial privado de tus cambios en Orunei.</p></div><ActivityList activity={activity} /></section>}
  </div>
}
