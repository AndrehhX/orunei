import { useMemo, useState } from 'react'
import { Activity, BookOpen, Check, ChevronRight, Heart, List, LockKeyhole, Pencil, PlayCircle, Plus, Sparkles } from 'lucide-react'
import Poster from './Poster'
import { library } from '../data'
import { useRec } from '../rec/rec'
import { useProfile } from '../profile/ProfileProvider'
import { selectAnimeSections, selectProfileStats, selectRecentActivity } from '../profile/profileData'

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
]

function Avatar({ profile, large = false }) {
  return <div className={`${large ? 'h-24 w-24 md:h-28 md:w-28' : 'h-10 w-10'} overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-slate-600 to-slate-900 shadow-lg dark:border-[#171723]`}>
    {profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-2xl font-bold text-white">{profile.displayName.slice(0, 1).toUpperCase()}</span>}
  </div>
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
  const { profile } = useProfile()
  const rec = useRec()
  const [active, setActive] = useState(profile.landingSection || 'overview')
  const sections = useMemo(() => selectAnimeSections(library), [])
  const stats = selectProfileStats(library, rec.count, profile)
  const activity = selectRecentActivity(profile, library)
  const featured = library.find((item) => item.q === profile.featuredAnimeId) || library.find((item) => item.s.startsWith('Favorito')) || library[0]

  return <div className="space-y-5 pb-10 animate-fade">
    <section className="overflow-hidden rounded-[26px] border border-white/80 bg-white/90 shadow-sm dark:border-white/5 dark:bg-[#171723]">
      <div className="h-36 bg-gradient-to-r from-[#3a2a6a] via-brand to-[#f08ab8] bg-cover bg-center md:h-48" style={profile.banner ? { backgroundImage: `url(${profile.banner})` } : undefined} />
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
      {tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} aria-pressed={active === id} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${active === id ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-slate-500 hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10'}`}><Icon size={15} />{label}</button>)}
    </nav>

    {active === 'overview' && <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Tu espacio</h2><p className="text-xs text-slate-500">Una vista privada de lo que estás viendo.</p></div><button onClick={() => setActive('animelist')} className="text-xs font-semibold text-brand">Ver AnimeList <ChevronRight className="inline" size={14} /></button></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{groups.map(([id, label, Icon, color]) => <button key={id} onClick={() => setActive('animelist')} className="rounded-2xl border border-slate-200/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-brand/40 dark:border-white/10"><Icon size={17} className={color} /><p className="mt-4 text-2xl font-extrabold">{sections[id].length}</p><p className="text-xs text-slate-500">{label}</p></button>)}</div></section>
      <section className="card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Destacado</h2><p className="text-xs text-slate-500">Tu historia elegida.</p></div><Heart size={17} className="text-pink-500" /></div><div className="flex items-center gap-3"><Poster {...featured} title={featured.t} className="h-28 w-20 shrink-0 rounded-xl" /><div className="min-w-0"><p className="truncate font-bold">{featured.t}</p><p className="mt-1 text-xs text-slate-500">{featured.s}</p><p className="mt-3 text-xs leading-5 text-slate-500">Puedes cambiar este destacado desde Editar perfil.</p></div></div></section>
      <section className="card p-5 xl:col-span-2"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Actividad reciente</h2><button onClick={() => setActive('activity')} className="text-xs font-semibold text-brand">Ver todo <ChevronRight className="inline" size={14} /></button></div><ActivityList activity={activity.slice(0, 3)} /></section>
    </div>}

    {active === 'animelist' && <section className="space-y-5"><div><h2 className="text-2xl font-extrabold">AnimeList</h2><p className="text-sm text-slate-500">Tu biblioteca organizada por estado.</p></div>{groups.map(([id, label, Icon, color]) => <section key={id}><div className="mb-3 flex items-center gap-2"><Icon size={17} className={color} /><h3 className="font-bold">{label}</h3><span className="text-xs text-slate-500">{sections[id].length}</span></div>{sections[id].length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">{sections[id].map((item) => <AnimeCard key={item.q} item={item} />)}</div> : <EmptyState title={`No tienes títulos en “${label}”`} detail="Cuando actualices tu biblioteca aparecerán aquí." />}</section>)}</section>}

    {active === 'favorites' && <section><div className="mb-5"><h2 className="text-2xl font-extrabold">Favoritos</h2><p className="text-sm text-slate-500">Las historias que quieres tener siempre a mano.</p></div>{sections.favorites.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">{sections.favorites.map((item) => <AnimeCard key={item.q} item={item} />)}</div> : <div className="card p-8"><EmptyState title="Aún no tienes favoritos" detail="Marca un anime como favorito desde tu biblioteca." /></div>}</section>}

    {active === 'lists' && <section><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-extrabold">Listas personalizadas</h2><p className="text-sm text-slate-500">Colecciones privadas para organizar tus historias.</p></div><button className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20"><Plus size={15} /> Nueva lista</button></div>{profile.customLists.length ? <div className="grid gap-4 md:grid-cols-2">{profile.customLists.map((list) => <article key={list.id} className="card p-5"><div className="flex items-start justify-between"><div><h3 className="font-bold">{list.title}</h3><p className="mt-1 text-xs text-slate-500">{list.description || 'Sin descripción'}</p></div><span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-semibold text-brand">{list.animeIds.length} obras</span></div></article>)}</div> : <EmptyState title="Crea tu primera lista" detail="Agrupa tus anime por tema, mood o cualquier criterio personal." action={<button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white"><Plus size={15} /> Crear lista</button>} />}</section>}

    {active === 'activity' && <section><div className="mb-5"><h2 className="text-2xl font-extrabold">Actividad</h2><p className="text-sm text-slate-500">Un historial privado de tus cambios en Orunei.</p></div><ActivityList activity={activity} /></section>}
  </div>
}
