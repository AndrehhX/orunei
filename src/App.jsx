import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Search, Bell } from 'lucide-react'
import Login from './components/Login'
import AnimePage from './components/AnimePage'
import NewsPage from './components/NewsPage'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import RightPanel from './components/RightPanel'
import { Library, Because, News } from './components/Rows'
import { ProfileProvider } from './profile/ProfileProvider'
import ProfilePage from './components/ProfilePage'
import ProfileEditor from './components/ProfileEditor'

const tabs = ['Todo', 'Anime', 'Películas', 'Series', 'Noticias']

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('orunei-user')) } catch { return null } })
  const login = (u) => { localStorage.setItem('orunei-user', JSON.stringify(u)); setUser(u) }
  const logout = () => { localStorage.removeItem('orunei-user'); setUser(null) }
  const [page, setPage] = useState('home')
  const [tab, setTab] = useState('Todo')
  const [query, setQuery] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const refs = useRef({})
  const [ind, setInd] = useState({ l: 0, w: 0 })
  useLayoutEffect(() => { const el = refs.current[tab]; if (el) setInd({ l: el.offsetLeft, w: el.offsetWidth }) }, [tab])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  if (!user) return <Login onLogin={login} dark={dark} setDark={setDark} />
  return (
  <ProfileProvider user={user}>
    <div className="mx-auto flex animate-fade min-h-screen max-w-[1536px]">
      <Sidebar dark={dark} setDark={setDark} user={user} onLogout={logout} page={page} setPage={setPage} />
      <main className="min-w-0 flex-1 space-y-6 px-4 py-4 lg:px-5">
        <header className="flex items-center gap-4 animate-fade">
          <label className="flex h-11 flex-1 max-w-[540px] items-center gap-3 rounded-xl bg-slate-200/60 dark:bg-white/5 px-4 text-slate-500 transition focus-within:bg-white dark:focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-brand/40">
            <Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar anime, películas, series..." />
          </label>
          <button className="relative ml-auto grid h-10 w-10 place-items-center rounded-full bg-white dark:bg-white/10 shadow-sm transition hover:scale-105" aria-label="Notificaciones"><Bell size={18} /><i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" /></button>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-900" />
        </header>
        {page === 'anime' ? <AnimePage query={query} /> : page === 'profile' ? <ProfilePage onEdit={() => setEditingProfile(true)} /> : <>
        <div className="flex flex-wrap items-end justify-between gap-3 animate-rise">
          <div><h1 className="text-4xl font-extrabold tracking-tight">Para ti</h1>
            <p className="text-sm text-slate-500">Descubre nuevas historias, mantente al día y explora contenido basado en tus gustos.</p></div>
          <div className="relative flex rounded-full bg-white/80 dark:bg-white/5 p-1 text-sm">
            <span className="absolute bottom-1 top-1 rounded-full bg-brand shadow-md shadow-brand/30 transition-all duration-300 ease-out" style={{ left: ind.l, width: ind.w }} />
            {tabs.map((t) => <button key={t} ref={(el) => (refs.current[t] = el)} onClick={() => setTab(t)} className={`relative rounded-full px-4 py-1.5 transition-colors duration-300 ${tab === t ? 'text-white' : 'text-slate-600 dark:text-slate-300 hover:text-brand'}`}>{t}</button>)}
          </div>
        </div>
        {tab === 'Noticias' ? <NewsPage query={query} /> : <><Hero /><Library query={query} /><Because query={query} /><News query={query} onMore={() => setTab('Noticias')} /></>}
        </>}
      </main>
      {page === 'home' && <RightPanel onSeeNews={() => setTab('Noticias')} onSeeProfile={() => setPage('profile')} />}
      {page === 'profile' && editingProfile && <ProfileEditor onClose={() => setEditingProfile(false)} />}
    </div>
  </ProfileProvider>
  )
}
