import { ArrowRight, Flame, Users, UserRound } from 'lucide-react'
import Poster from './Poster'
import { trends } from '../data'
import { useNews, NewsLink } from '../news'
import { useRec } from '../rec/rec'
import { useProfile } from '../profile/ProfileProvider'
import { useSocial } from '../social/SocialProvider.jsx'

const Head = ({ children, onAll }) => <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">{children}</h3>{onAll && <a href="#amigos" onClick={(e) => { e.preventDefault(); onAll?.() }} className="flex items-center gap-1 text-[11px] text-brand">Ver todo <ArrowRight size={12} /></a>}</div>
const Avatar = ({ profile }) => <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-pink-400 text-white">{profile?.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound size={15} />}</div>

export default function RightPanel({ onSeeNews, onSeeProfile, onSeeFriends, onOpenProfile }) {
  const { items } = useNews()
  const rec = useRec()
  const { profile } = useProfile()
  const { friends } = useSocial()
  return (
    <aside className="scroll-hide sticky top-0 hidden h-screen w-[300px] shrink-0 space-y-4 self-start overflow-y-auto py-5 pr-5 xl:block animate-fade">
      <div className="card p-3.5">
        <div className="mb-2 flex justify-between"><h3 className="font-bold">Tu perfil</h3><a href="#perfil" onClick={(e) => { e.preventDefault(); onSeeProfile?.() }} className="flex items-center gap-1 text-[11px] text-brand">Ver perfil <ArrowRight size={12} /></a></div>
        <div className="relative h-16 overflow-hidden rounded-lg bg-gradient-to-r from-[#3a2a6a] via-[#c06a9a] to-[#f4a6c1]">{profile.banner && <img src={profile.banner} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} className="absolute inset-0 h-full w-full object-cover" />}</div>
        <div className="-mt-7 flex items-end gap-2 px-2"><div className="h-[68px] w-[68px] overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-slate-600 to-slate-900 dark:border-[#171723]">{profile.avatar && <img src={profile.avatar} alt="" className="h-full w-full object-cover" />}</div>
          <div className="pb-1 leading-tight"><p className="font-bold text-sm">{profile.displayName}</p><p className="text-xs text-slate-500">@{profile.username}</p></div></div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/10 text-center">
          {[[String(profile.animeList?.length || 0), 'Obras'], [String(profile.customLists.length), 'Listas'], [String(rec.count), 'Gustos']].map(([a, b]) => <div key={b}><p className="font-bold">{a}</p><p className="text-[11px] text-slate-500">{b}</p></div>)}
        </div>
      </div>
      <div className="card p-3.5">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Tus gustos</h3><span className="text-[11px] text-slate-500">{rec.count} obras</span></div>
        {rec.topGenres.length ? rec.topGenres.map((g) => (
          <div key={g.name} className="mb-2 last:mb-0"><div className="mb-1 flex justify-between text-[11px]"><span className="font-medium">{g.name}</span><span className="text-slate-500">{g.pct}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand to-pink-400 transition-all duration-700 ease-smooth" style={{ width: g.pct + '%' }} /></div></div>
        )) : <p className="text-xs text-slate-500">Dale like a lo que te guste y aprenderemos tus gustos.</p>}
      </div>
      <div className="card p-3.5">
        <Head onAll={onSeeFriends}><span className="inline-flex items-center gap-2"><Users size={16} className="text-brand" />Amigos</span></Head>
        {friends.length ? friends.slice(0, 4).map((friendship) => <button key={friendship.id} onClick={() => friendship.profile?.username && onOpenProfile?.(friendship.profile.username)} className="flex w-full items-center gap-2.5 py-2 text-left"><Avatar profile={friendship.profile} /><div className="min-w-0 leading-tight"><p className="truncate text-sm font-semibold">{friendship.profile?.displayName || 'Perfil de Orunei'}</p><p className="truncate text-[11px] text-slate-500">@{friendship.profile?.username || 'usuario'}</p></div></button>) : <p className="py-2 text-xs text-slate-500">Busca perfiles y conecta con personas reales.</p>}
      </div>
      <div className="card p-3.5">
        <Head>Tendencias hoy</Head>
        {trends.map((t, i) => (
          <div key={t.t} className="group flex cursor-pointer items-center gap-3 rounded-lg py-1.5 transition-transform duration-300 hover:translate-x-1">
            <span className="w-3 text-sm font-bold">{i + 1}</span><Poster {...t} title="" className="h-[46px] w-[46px] shrink-0 rounded-lg" /><div className="min-w-0 leading-tight"><p className="truncate text-sm font-semibold">{t.t}</p><p className="text-[11px] text-slate-500">Anime · {t.y}</p></div><span className="ml-auto flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><Flame size={14} className="text-orange-500" />{t.v}</span>
          </div>
        ))}
      </div>
      <div className="card p-3.5">
        <Head onAll={onSeeNews}>Noticias destacadas</Head>
        {(items.length ? items.slice(2, 5) : [0, 1]).map((f, i) => f === i ? <div key={i} className="my-2 h-[62px] animate-pulse rounded-lg bg-slate-200/60 dark:bg-white/5" /> : <NewsLink key={f.id} n={f} className="group flex cursor-pointer gap-3 rounded-lg py-2 transition-transform duration-300 hover:translate-x-1"><Poster img={f.img} q={f.q} grad={f.grad} wide title="" className="h-[62px] w-[98px] shrink-0 rounded-lg" /><div className="min-w-0 leading-snug"><p className="line-clamp-2 text-[13px] font-bold">{f.t}</p><p className="text-[11px] text-slate-500">{f.s} · {f.h}</p></div></NewsLink>)}
      </div>
    </aside>
  )
}
