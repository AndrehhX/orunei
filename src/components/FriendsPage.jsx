import { Check, UserRound, UserRoundPlus, Users } from 'lucide-react'
import ProfileSearch from './ProfileSearch'
import { useSocial } from '../social/SocialProvider.jsx'

function ProfileCard({ friendship, action, actionLabel, secondaryAction, secondaryLabel, onOpen }) {
  const profile = friendship.profile
  if (!profile) return <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10">Perfil no disponible.</div>
  return <article className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-white/10"><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-pink-400 text-white">{profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound size={19} />}</div><button onClick={() => onOpen(profile.username)} className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm hover:text-brand">{profile.displayName}</strong><span className="block truncate text-xs text-slate-500">@{profile.username}</span></button>{secondaryAction && <button onClick={secondaryAction} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold transition hover:border-red-400 hover:text-red-500 dark:border-white/10">{secondaryLabel}</button>}{action && <button onClick={action} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold transition hover:border-brand hover:text-brand dark:border-white/10">{actionLabel}</button>}</article>
}

export default function FriendsPage({ onOpenProfile }) {
  const { friends, incoming, outgoing, actions, error, status } = useSocial()
  return <div className="space-y-5 pb-10 animate-fade">
    <div><p className="text-sm font-semibold text-brand">Comunidad</p><h1 className="text-4xl font-extrabold tracking-tight">Amigos</h1><p className="mt-1 text-sm text-slate-500">Encuentra personas reales de Orunei y decide con quién compartir tu perfil.</p></div>
    <ProfileSearch onOpenProfile={onOpenProfile} />
    {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}
    {status === 'loading' && <p className="text-sm text-slate-500">Actualizando relaciones…</p>}
    <section className="space-y-3"><div className="flex items-center gap-2"><Users size={18} className="text-brand" /><h2 className="text-xl font-bold">Tus amigos</h2><span className="text-xs text-slate-500">{friends.length}</span></div>{friends.length ? <div className="grid gap-3 md:grid-cols-2">{friends.map((friendship) => <ProfileCard key={friendship.id} friendship={friendship} onOpen={onOpenProfile} actionLabel="Eliminar" action={async () => { await actions.removeFriend(friendship.id) }} />)}</div> : <div className="card border-dashed p-6 text-sm text-slate-500">Todavía no tienes amistades aceptadas. Busca un perfil para empezar.</div>}</section>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="space-y-3"><div className="flex items-center gap-2"><UserRoundPlus size={18} className="text-brand" /><h2 className="text-xl font-bold">Solicitudes recibidas</h2><span className="text-xs text-slate-500">{incoming.length}</span></div>{incoming.length ? incoming.map((friendship) => <ProfileCard key={friendship.id} friendship={friendship} onOpen={onOpenProfile} actionLabel="Aceptar" action={async () => { await actions.respondToFriendRequest(friendship.id, 'accepted') }} secondaryLabel="Rechazar" secondaryAction={async () => { await actions.respondToFriendRequest(friendship.id, 'declined') }} />) : <div className="card border-dashed p-5 text-sm text-slate-500">No tienes solicitudes pendientes.</div>}</section>
      <section className="space-y-3"><div className="flex items-center gap-2"><Check size={18} className="text-brand" /><h2 className="text-xl font-bold">Solicitudes enviadas</h2><span className="text-xs text-slate-500">{outgoing.length}</span></div>{outgoing.length ? outgoing.map((friendship) => <ProfileCard key={friendship.id} friendship={friendship} onOpen={onOpenProfile} actionLabel="Cancelar" action={async () => { await actions.cancelFriendRequest(friendship.id) }} />) : <div className="card border-dashed p-5 text-sm text-slate-500">No has enviado solicitudes pendientes.</div>}</section>
    </div>
  </div>
}
