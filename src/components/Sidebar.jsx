import { Sparkles, Home, Search, Library, User, Heart, Tv, Film, MonitorPlay, Gamepad2, Sun, Moon, MoreVertical } from 'lucide-react'

const main = [['Para ti', Home], ['Descubrir', Search], ['Biblioteca', Library], ['Perfil', User], ['Compatibilidad', Heart]]
const explore = [['Anime', Sparkles], ['Películas', Film], ['Series', MonitorPlay]]

export default function Sidebar({ dark, setDark }) {
  return (
    <aside className="hidden lg:flex w-[216px] shrink-0 flex-col px-3 py-6 sticky top-0 h-screen">
      <div className="flex items-center gap-2 px-3 mb-8 text-2xl font-extrabold"><Sparkles className="text-brand" size={26} />Orunei</div>
      <nav className="space-y-1">
        {main.map(([n, I], i) => (
          <a key={n} href="#" className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200 hover:translate-x-0.5 ${i === 0 ? 'bg-brand-soft text-brand dark:bg-brand/20' : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/5'}`}>
            {i === 0 && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-brand" />}
            <I size={20} />{n}
          </a>
        ))}
      </nav>
      <hr className="my-6 mx-4 border-slate-200 dark:border-white/10" />
      <p className="px-4 mb-2 text-[15px] text-slate-500">Explorar</p>
      <nav className="space-y-1 text-slate-600 dark:text-slate-300">
        {explore.map(([n, I]) => (
          <a key={n} href="#" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition hover:bg-white/70 dark:hover:bg-white/5"><I size={19} />{n}</a>
        ))}
        <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm"><Gamepad2 size={19} />Juegos
          <span className="rounded-full bg-slate-200/80 dark:bg-white/10 px-2 py-0.5 text-[10px]">Próximamente</span></a>
      </nav>
      <div className="mt-auto space-y-4">
        <div className="relative inline-flex rounded-full bg-slate-200/70 dark:bg-white/10 p-1">
          <span className={`absolute left-1 top-1 h-9 w-9 rounded-full bg-white shadow transition-transform duration-300 ease-out dark:bg-[#2a2a3c] ${dark ? 'translate-x-9' : ''}`} />
          {[[false, Sun], [true, Moon]].map(([v, I]) => (
            <button key={String(v)} onClick={() => setDark(v)} aria-label={v ? 'Modo oscuro' : 'Modo claro'}
              className="relative grid h-9 w-9 place-items-center rounded-full"><I size={17} /></button>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-slate-200 dark:border-white/10 pt-4">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-slate-600 to-slate-900" />
          <div className="leading-tight"><p className="font-bold text-sm">Dereck</p><p className="text-xs text-slate-500">@dereck</p></div>
          <MoreVertical size={18} className="ml-auto text-slate-500" />
        </div>
      </div>
    </aside>
  )
}
