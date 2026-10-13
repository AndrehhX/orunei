import { useEffect, useMemo, useState } from 'react'
import PublicProfilePage from './PublicProfilePage'
import { createProfileRepository } from '../profile/profileRepository.js'
import { supabase } from '../auth/supabaseClient.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { useSocial } from '../social/SocialProvider.jsx'
import { getRelationship } from '../social/model.js'

export default function PublicProfileRoute({ username, onBack }) {
  const { user } = useAuth()
  const { friendships, actions } = useSocial()
  const repository = useMemo(() => createProfileRepository(supabase), [])
  const [state, setState] = useState({ status: 'loading', profile: null, error: '' })
  useEffect(() => {
    let active = true
    setState({ status: 'loading', profile: null, error: '' })
    repository.getPublicProfile(username, user?.id).then((result) => {
      if (!active) return
      setState({ status: result.error ? 'error' : result.data ? 'ready' : 'not-found', profile: result.data, error: result.error || '' })
    })
    return () => { active = false }
  }, [repository, user?.id, username])

  if (state.status === 'loading') return <div className="card p-8 text-center text-sm text-slate-500">Cargando perfil…</div>
  if (state.status === 'error') return <div className="card p-8 text-center"><p className="font-semibold">No pudimos cargar este perfil</p><p className="mt-1 text-sm text-slate-500">{state.error}</p><button onClick={onBack} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10">Volver</button></div>
  if (state.status === 'not-found') return <div className="card p-8 text-center"><p className="font-semibold">Perfil no encontrado</p><p className="mt-1 text-sm text-slate-500">Puede que el usuario haya cambiado su nombre o no sea público.</p><button onClick={onBack} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10">Volver</button></div>

  const relationship = getRelationship(friendships, user?.id, state.profile.id).status
  return <PublicProfilePage profile={state.profile} viewer={{ id: user?.id, profileId: state.profile.id, relationship }} onBack={onBack} onFriendRequest={() => actions.sendFriendRequest(state.profile.id)} />
}
