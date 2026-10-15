import { Home, Sparkles, BookOpen, Users, User } from 'lucide-react'
import { useProfile } from '../profile/ProfileProvider'

export default function MobileNav({ page, setPage }) {
  const { profile } = useProfile()

  const items = [
    { id: 'home', label: 'Para ti', icon: Home },
    { id: 'anime', label: 'Catálogo', icon: Sparkles },
    { id: 'library', label: 'Biblioteca', icon: BookOpen },
    { id: 'friends', label: 'Amigos', icon: Users },
    { id: 'profile', label: 'Perfil', icon: User, avatar: profile?.avatar },
  ]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex lg:hidden items-center justify-around border-t border-slate-200/80 bg-white/95 px-2 py-1.5 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#0f111a]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Navegación móvil"
    >
      {items.map((item) => {
        const active = page === item.id
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setPage(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
              active
                ? 'text-brand font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {active && (
              <span className="absolute -top-1.5 h-1 w-6 rounded-full bg-brand shadow-[0_0_8px_rgba(109,92,255,0.7)]" />
            )}
            {item.avatar && item.id === 'profile' ? (
              <div
                className={`h-5 w-5 rounded-full overflow-hidden mb-0.5 border-2 ${
                  active ? 'border-brand' : 'border-transparent'
                }`}
              >
                <img src={item.avatar} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <Icon size={19} className={`mb-0.5 transition-transform ${active ? 'scale-110 text-brand' : ''}`} />
            )}
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
