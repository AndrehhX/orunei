import { Search, Plus } from 'lucide-react'
import { useState } from 'react'
import { searchAnime, title } from '../api/anime'
import { useProfile } from '../profile/ProfileProvider'

function toEntry(media) {
  return {
    id: String(media.id),
    q: title(media),
    t: title(media),
    status: 'planned',
    favorite: false,
    img: media.coverImage?.extraLarge || '',
    grad: `linear-gradient(135deg, ${media.coverImage?.color || '#6d5cff'}, #f08ab8)`,
    year: media.seasonYear || null,
  }
}

export default function ProfileAnimeListManager({ visible = true }) {
  const { profile, updateAnimeList } = useProfile()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (!query.trim()) return
    setStatus('loading'); setError('')
    try {
      const result = await searchAnime({ search: query.trim(), genres: [], format: '', status: '', year: '', sort: 'Popular' }, 1)
      setResults(result.items || []); setStatus('ready')
    } catch (searchError) {
      setResults([]); setStatus('error'); setError(searchError instanceof Error ? searchError.message : 'No pudimos buscar ese anime.')
    }
  }
  const add = async (media) => {
    const entry = toEntry(media)
    if (profile.animeList.some((item) => item.id === entry.id)) return
    const result = await updateAnimeList((current) => [...current, entry])
    if (result?.error) setError(result.error)
  }
  if (!visible) return null
  return <section className="card p-4"><div className="mb-3"><h3 className="font-bold">Añadir a tu AnimeList</h3><p className="text-xs text-slate-500">Busca una obra real en AniList y guárdala en tu cuenta.</p></div><form onSubmit={submit} className="flex items-center gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-white/10"><Search size={15} className="shrink-0 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. Frieren, One Piece…" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><button className="rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white">Buscar</button></form>{status === 'loading' && <p className="mt-3 text-xs text-slate-500">Buscando…</p>}{error && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p>}{results.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{results.slice(0, 6).map((media) => { const exists = profile.animeList.some((item) => item.id === String(media.id)); return <div key={media.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-white/5"><img src={media.coverImage?.extraLarge} alt="" className="h-14 w-10 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title(media)}</p><p className="text-[11px] text-slate-500">{media.seasonYear || '—'} · {media.format || 'Anime'}</p></div><button onClick={() => add(media)} disabled={exists} aria-label={exists ? 'Ya está en AnimeList' : `Añadir ${title(media)}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white disabled:bg-slate-300 disabled:text-slate-500"><Plus size={15} /></button></div> })}</div>}{status === 'ready' && !results.length && <p className="mt-3 text-xs text-slate-500">No encontramos esa obra.</p>}</section>
}
