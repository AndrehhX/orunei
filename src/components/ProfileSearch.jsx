import { Search, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useSocial } from '../social/SocialProvider.jsx'

export default function ProfileSearch({ onOpenProfile }) {
  const { search, searchResults, status, error } = useSocial()
  const [query, setQuery] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    await search(query)
  }

  return <section className="card p-4">
    <form onSubmit={submit} className="flex items-center gap-2">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-white/10"><Search size={16} className="shrink-0 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca por usuario o nombre" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      <button className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">Buscar</button>
    </form>
    {status === 'loading' && <p className="mt-3 text-xs text-slate-500">Buscando perfiles…</p>}
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p>}
    {query.trim() && status !== 'loading' && !searchResults.length && !error && <p className="mt-4 text-sm text-slate-500">No encontramos perfiles públicos con esa búsqueda.</p>}
    {!!searchResults.length && <div className="mt-3 divide-y divide-slate-200 dark:divide-white/10">{searchResults.map((profile) => <button key={profile.id} onClick={() => onOpenProfile(profile.username)} className="flex w-full items-center gap-3 py-3 text-left transition hover:text-brand"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-pink-400 text-white">{profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound size={18} />}</div><span className="min-w-0"><strong className="block truncate text-sm">{profile.displayName}</strong><small className="block truncate text-xs text-slate-500">@{profile.username}</small></span></button>)}</div>}
  </section>
}
