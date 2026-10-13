import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { normalizeAuthUser } from './authModel'
import { supabase, supabaseConfig } from './supabaseClient'

const AuthContext = createContext(null)

function stateFromSession(session, error = '') {
  return {
    session,
    user: normalizeAuthUser(session?.user),
    status: error ? 'error' : session ? 'ready' : 'unauthenticated',
    error,
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => supabaseConfig.configured
    ? { session: null, user: null, status: 'loading', error: '' }
    : { session: null, user: null, status: 'misconfigured', error: supabaseConfig.error })

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (active) setState(stateFromSession(data?.session || null, error?.message || ''))
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState(stateFromSession(session))
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) return { data: null, error: supabaseConfig.error }
    const result = await supabase.auth.signInWithPassword({ email, password })
    return { data: result.data, error: result.error?.message || '' }
  }, [])

  const signUp = useCallback(async ({ email, password, name }) => {
    if (!supabase) return { data: null, error: supabaseConfig.error }
    const result = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    return { data: result.data, error: result.error?.message || '' }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return { error: supabaseConfig.error }
    const result = await supabase.auth.signOut()
    return { error: result.error?.message || '' }
  }, [])

  const value = useMemo(() => ({ ...state, signIn, signUp, signOut }), [state, signIn, signUp, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return value
}
