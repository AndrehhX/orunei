import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Search, Sparkles, Sun, Moon } from 'lucide-react'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Hero from './components/Hero'
import RightPanel from './components/RightPanel'
import { Library, Because, News } from './components/Rows'
import { ProfileProvider, useProfile } from './profile/ProfileProvider'
import DevelopmentNotice from './components/DevelopmentNotice'
import CustomCursor from './components/CustomCursor'
import { getPageScrollReset } from './ui/pageNavigation.js'
import { getHomeTabClass } from './ui/homeTabs.js'
import { getDevelopmentNotice } from './developmentNotice'
import { useAuth } from './auth/AuthProvider'
import { createProfileRepository } from './profile/profileRepository'
import { getPublicProfileHash, getPublicProfileUsername } from './profile/navigation'
import { supabase } from './auth/supabaseClient'
import { useRec } from './rec/rec'

const AnimePage = lazy(() => import('./components/AnimePage'))
const LibraryPage = lazy(() => import('./components/LibraryPage'))
const NewsPage = lazy(() => import('./components/NewsPage'))
const ProfilePage = lazy(() => import('./components/ProfilePage'))
const ProfileEditor = lazy(() => import('./components/ProfileEditor'))
const FriendsPage = lazy(() => import('./components/FriendsPage'))
const PublicProfileRoute = lazy(() => import('./components/PublicProfileRoute'))

function PageLoading() {
  return <div className="grid min-h-[18rem] place-items-center text-sm text-slate-500">Cargando…</div>
}

function GlobalTasteSync() {
  const { profile } = useProfile()
  const rec = useRec()
  const profileLibrary = Array.isArray(profile.animeList) ? profile.animeList : []
  const librarySignature = useMemo(() => profileLibrary.map((item) => `${item.id}:${item.status}:${item.favorite ? '1' : '0'}`).join('|'), [profileLibrary])

  useEffect(() => {
    if (rec.ready) {
      rec.syncLibrary(profileLibrary)
    }
  }, [rec.ready, rec.syncLibrary, librarySignature])

  return null
}

const tabs = ['Anime', 'Noticias']

function AppHeader({ query, setQuery, onOpenProfile, dark, setDark }) {
  const { profile } = useProfile()
  return (
    <header className="flex items-center gap-2.5 sm:gap-4 animate-fade">
      <div className="flex lg:hidden items-center gap-1.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-xs font-black text-white shadow-md shadow-brand/30">O</span>
        <span className="text-base font-bold tracking-tight bg-gradient-to-r from-brand to-purple-400 bg-clip-text text-transparent">Orunei</span>
      </div>
      <label className="flex h-10 sm:h-11 flex-1 max-w-[540px] items-center gap-2.5 sm:gap-3 rounded-xl bg-slate-200/60 dark:bg-white/5 px-3 sm:px-4 text-slate-500 transition focus-within:bg-white dark:focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-brand/40">
        <Search size={18} className="shrink-0" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-xs sm:text-sm outline-none" placeholder="Buscar anime, películas, series..." />
      </label>
      {setDark && (
        <button
          type="button"
          onClick={() => setDark(!dark)}
          aria-label={dark ? 'Modo claro' : 'Modo oscuro'}
          className="lg:hidden grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 active:scale-95"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      )}
      <button
        type="button"
        onClick={onOpenProfile}
        aria-label="Ver perfil"
        className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-slate-600 to-slate-900 text-xs sm:text-sm font-bold text-white transition hover:ring-2 hover:ring-brand/50 active:scale-95"
      >
        {profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : profile.displayName.slice(0, 1).toUpperCase()}
      </button>
    </header>
  )
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
    <GlobalTasteSync />
    <Suspense fallback={<PageLoading />}>
      <div className="mx-auto flex min-h-screen max-w-[1536px] animate-fade">
        <CustomCursor />
        <Sidebar dark={dark} setDark={setDark} user={user} onLogout={signOut} page={page} setPage={navigatePage} onDevelopmentFeature={showDevelopmentNotice} />
        <main className="min-w-0 flex-1 space-y-6 px-4 py-4 pb-24 lg:pb-8 lg:px-5">
          <AppHeader
            query={query}
            setQuery={setQuery}
            onOpenProfile={() => navigatePage('profile')}
            dark={dark}
            setDark={setDark}
          />
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
        <MobileNav page={page} setPage={navigatePage} />
        <DevelopmentNotice notice={developmentNotice} onClose={() => setDevelopmentNotice(null)} />
      </div>
    </Suspense>
  </ProfileProvider>
  )
}
