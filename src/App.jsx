import { useEffect, useState } from 'react'
import { Search, Bell } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import RightPanel from './components/RightPanel'
import { Library, Because, News } from './components/Rows'

const tabs = ['Todo', 'Anime', 'Películas', 'Series', 'Noticias']

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [tab, setTab] = useState('Todo')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="mx-auto flex min-h-screen max-w-[1536px]">
      <Sidebar dark={dark} setDark={setDark} />
      <main className="min-w-0 flex-1 space-y-6 px-4 py-4 lg:px-5">
        <header className="flex items-center gap-4 animate-fade">
          <label className="flex h-11 flex-1 max-w-[540px] items-center gap-3 rounded-xl bg-slate-200/60 dark:bg-white/5 px-4 text-slate-500 transition focus-within:bg-white dark:focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-brand/40">
            <Search size={18} /><input className="w-full bg-transparent text-sm outline-none" placeholder="Buscar anime, películas, series..." />
          </label>
          <button className="relative ml-auto grid h-10 w-10 place-items-center rounded-full bg-white dark:bg-white/10 shadow-sm transition hover:scale-105" aria-label="Notificaciones"><Bell size={18} /><i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" /></button>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-900" />
        </header>
        <div className="flex flex-wrap items-end justify-between gap-3 animate-rise">
          <div><h1 className="text-4xl font-extrabold tracking-tight">Para ti</h1>
            <p className="text-sm text-slate-500">Descubre nuevas historias, mantente al día y explora contenido basado en tus gustos.</p></div>
          <div className="flex rounded-full bg-white/80 dark:bg-white/5 p-1 text-sm">
            {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 transition-all duration-300 ${tab === t ? 'bg-brand text-white shadow-md shadow-brand/30' : 'text-slate-600 dark:text-slate-300 hover:text-brand'}`}>{t}</button>)}
          </div>
        </div>
        <Hero /><Library /><Because /><News />
      </main>
      <RightPanel />
    </div>
  )
}
