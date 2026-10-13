import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import Login from './components/Login'
import AnimePage from './components/AnimePage'
import LibraryPage from './components/LibraryPage'
import NewsPage from './components/NewsPage'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import RightPanel from './components/RightPanel'
import { Library, Because, News } from './components/Rows'
import { ProfileProvider, useProfile } from './profile/ProfileProvider'
import ProfilePage from './components/ProfilePage'
import ProfileEditor from './components/ProfileEditor'
import FriendsPage from './components/FriendsPage'
import PublicProfileRoute from './components/PublicProfileRoute'
import DevelopmentNotice from './components/DevelopmentNotice'
import CustomCursor from './components/CustomCursor'
import { getPageScrollReset } from './ui/pageNavigation.js'
import { getHomeTabClass } from './ui/homeTabs.js'
import { getDevelopmentNotice } from './developmentNotice'
import { useAuth } from './auth/AuthProvider'
import { createProfileRepository } from './profile/profileRepository'
import { getPublicProfileHash, getPublicProfileUsername } from './profile/navigation'
import { supabase } from './auth/supabaseClient'

const tabs = ['Anime', 'Noticias']

function AppHeader({ query, setQuery }) {
  const { profile } = useProfile()
  return <header className="flex items-center gap-4 animate-fade">
    <label className="flex h-11 flex-1 max-w-[540px] items-center gap-3 rounded-xl bg-slate-200/60 dark:bg-white/5 px-4 text-slate-500 transition focus-within:bg-white dark:focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-brand/40">
      <Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar anime, películas, series..." />
    </label>
    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-slate-600 to-slate-900 text-sm font-bold text-white">{profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : profile.displayName.slice(0, 1).toUpperCase()}</div>
  </header>
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const { user, status: authStatus, error: authError, signIn, signUp, signOut } = useAuth()
  const repository = useMemo(() => user?.id ? createProfileRepository(supabase) : null, [user?.id])
  const initialProfileUsername = getPublicProfileUsername(typeof window === 'undefined' ? '' : window.location.hash)
  const [page, setPage] = useState(initialProfileUsername ? 'public-profile' : 'home')
  const [tab, setTab] = useState('Anime')
  const [query, setQuery] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [selectedUsername, setSelectedUsername] = useState(initialProfileUsername)
  const [selectedAnimeId, setSelectedAnimeId] = useState(null)
  const [developmentNotice, setDevelopmentNotice] = useState(null)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    window.scrollTo(getPageScrollReset())
  }, [page])

  useEffect(() => {
    const syncProfileHash = () => {
      const username = getPublicProfileUsername(window.location.hash)
      if (username) {
        setSelectedUsername(username)
        setPage('public-profile')
      } else if (page === 'public-profile') {
        setPage('friends')
      }
    }
    window.addEventListener('hashchange', syncProfileHash)
    return () => window.removeEventListener('hashchange', syncProfileHash)
  }, [page])

  const navigatePage = (nextPage) => {
    setPage(nextPage)
    if (nextPage !== 'anime') setSelectedAnimeId(null)
    if (nextPage !== 'public-profile') {
      setSelectedUsername('')
      if (typeof window !== 'undefined' && getPublicProfileUsername(window.location.hash)) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
  }
  const openAnime = (media) => {
    const id = typeof media === 'object' ? media?.id : media
    const queryValue = typeof media === 'object' ? media?.q : ''
    setSelectedAnimeId(id ? String(id) : null)
    setQuery(id ? '' : queryValue || '')
    setPage('anime')
  }
  const closeAnime = () => setSelectedAnimeId(null)
  const openPublicProfile = (username) => {
    const hash = getPublicProfileHash(username)
    if (!hash) return
    setSelectedUsername(username)
    setPage('public-profile')
    if (typeof window !== 'undefined' && window.location.hash !== hash) window.location.hash = hash
  }

  const showDevelopmentNotice = (section) => {
    const notice = getDevelopmentNotice(section)
    if (notice) setDevelopmentNotice({ ...notice, id: Date.now() })
  }
  const handleTabChange = (nextTab) => {
    const notice = getDevelopmentNotice(nextTab)
    if (notice) {
      showDevelopmentNotice(nextTab)
      return
    }
    setTab(nextTab)
  }

  if (authStatus === 'loading') return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Cargando tu sesión…</div>
  if (!user) return <Login onSignIn={signIn} onSignUp={signUp} authStatus={authStatus} authError={authError} dark={dark} setDark={setDark} />
  return (
  <ProfileProvider user={user} repository={repository}>
    <div className="mx-auto flex min-h-screen max-w-[1536px] animate-fade">
      <CustomCursor />
      <Sidebar dark={dark} setDark={setDark} user={user} onLogout={signOut} page={page} setPage={navigatePage} onDevelopmentFeature={showDevelopmentNotice} />
      <main className="min-w-0 flex-1 space-y-6 px-4 py-4 lg:px-5">
        <AppHeader query={query} setQuery={setQuery} />
            <div key={page} className="animate-page-enter space-y-7">
        {page === 'anime' ? <AnimePage query={query} initialOpenId={selectedAnimeId} onCloseDetail={closeAnime} /> : page === 'library' ? <LibraryPage query={query} onDiscover={() => navigatePage('anime')} /> : page === 'profile' ? <ProfilePage onEdit={() => setEditingProfile(true)} /> : page === 'friends' ? <FriendsPage onOpenProfile={openPublicProfile} /> : page === 'public-profile' ? <PublicProfileRoute username={selectedUsername} onBack={() => navigatePage('friends')} /> : <>
        <div className="flex flex-wrap items-end justify-between gap-6 animate-rise">
          <div><h1 className="text-4xl font-extrabold tracking-tight">Para ti</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Descubre nuevas historias, mantente al día y explora contenido basado en tus gustos.</p></div>
          <div className="flex rounded-full bg-white/80 p-1 text-sm dark:bg-white/5">
            {tabs.map((t) => <button key={t} onClick={() => handleTabChange(t)} className={getHomeTabClass(t, tab)}>{t}</button>)}
          </div>
        </div>
        {tab === 'Noticias' ? <NewsPage query={query} /> : <><Hero onOpenDetail={openAnime} /><Library query={query} onMore={() => navigatePage('library')} onOpenAnime={openAnime} /><Because query={query} onOpenAnime={openAnime} /><News query={query} onMore={() => setTab('Noticias')} /></>}
        </>}
        </div>
      </main>
      {page === 'home' && <RightPanel onSeeNews={() => setTab('Noticias')} onSeeProfile={() => navigatePage('profile')} onSeeFriends={() => navigatePage('friends')} onOpenProfile={openPublicProfile} onOpenAnime={openAnime} />}
      {page === 'profile' && editingProfile && <ProfileEditor onClose={() => setEditingProfile(false)} />}
      <DevelopmentNotice notice={developmentNotice} onClose={() => setDevelopmentNotice(null)} />
    </div>
  </ProfileProvider>
  )
}
