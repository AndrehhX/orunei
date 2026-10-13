import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider.jsx'
import { supabase } from '../auth/supabaseClient.js'
import { createSocialRepository } from './socialRepository.js'

const SocialContext = createContext(null)

export function SocialProvider({ children }) {
  const { user, status: authStatus } = useAuth()
  const repository = useMemo(() => user?.id ? createSocialRepository(supabase, user.id) : null, [user?.id])
  const [friendships, setFriendships] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [comments, setComments] = useState([])
  const [commentsProfileId, setCommentsProfileId] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const refreshFriendships = useCallback(async () => {
    if (!repository || !user?.id) {
      setFriendships([])
      return { data: [], error: '' }
    }
    setStatus('loading')
    const result = await repository.getFriendships(user.id)
    if (result.error) setError(result.error)
    else { setFriendships(result.data || []); setError('') }
    setStatus('ready')
    return result
  }, [repository, user?.id])

  useEffect(() => { refreshFriendships() }, [refreshFriendships])

  const search = useCallback(async (query) => {
    if (!repository || !query.trim()) { setSearchResults([]); return { data: [], error: '' } }
    const result = await repository.searchProfiles(query)
    setSearchResults(result.data || [])
    setError(result.error || '')
    return result
  }, [repository])

  const loadComments = useCallback(async (profileId) => {
    if (!repository || !profileId) { setComments([]); setCommentsProfileId(''); return { data: [], error: '' } }
    setCommentsProfileId(profileId)
    setStatus('loading')
    const result = await repository.listComments(profileId)
    setComments(result.data || [])
    setError(result.error || '')
    setStatus('ready')
    return result
  }, [repository])

  const sendFriendRequest = useCallback(async (targetId) => {
    const result = await repository?.sendFriendRequest(targetId) || { data: null, error: 'No hay una sesiÃ³n activa.' }
    if (result.error) setError(result.error)
    else await refreshFriendships()
    return result
  }, [refreshFriendships, repository])

  const respondToFriendRequest = useCallback(async (id, nextStatus) => {
    const result = await repository?.respondToFriendRequest(id, nextStatus) || { data: null, error: 'No hay una sesiÃ³n activa.' }
    if (result.error) setError(result.error)
    else await refreshFriendships()
    return result
  }, [refreshFriendships, repository])

  const cancelFriendRequest = useCallback(async (id) => {
    const result = await repository?.cancelFriendRequest(id) || { data: null, error: 'No hay una sesiÃ³n activa.' }
    if (result.error) setError(result.error)
    else await refreshFriendships()
    return result
  }, [refreshFriendships, repository])

  const createComment = useCallback(async (profileId, body) => {
    const previous = comments
    const result = await repository?.createComment(profileId, body) || { data: null, error: 'No hay una sesiÃ³n activa.' }
    if (result.error) {
      setComments(previous)
      setError(result.error)
    } else if (commentsProfileId === profileId && result.data) setComments((current) => [...current, result.data])
    return result
  }, [comments, commentsProfileId, repository])

  const updateComment = useCallback(async (id, body) => {
    const previous = comments
    const result = await repository?.updateComment(id, body) || { data: null, error: 'No hay una sesiÃ³n activa.' }
    if (result.error) {
      setComments(previous)
      setError(result.error)
    } else if (result.data) setComments((current) => current.map((comment) => comment.id === id ? result.data : comment))
    return result
  }, [comments, repository])

  const deleteComment = useCallback(async (id) => {
    const previous = comments
    setComments((current) => current.filter((comment) => comment.id !== id))
    const result = await repository?.deleteComment(id) || { data: null, error: 'No hay una sesiÃ³n activa.' }
    if (result.error) {
      setComments(previous)
      setError(result.error)
    }
    return result
  }, [comments, repository])

  const friends = friendships.filter((friendship) => friendship.status === 'accepted')
  const incoming = friendships.filter((friendship) => friendship.status === 'pending' && friendship.direction === 'incoming')
  const outgoing = friendships.filter((friendship) => friendship.status === 'pending' && friendship.direction === 'outgoing')
  const value = useMemo(() => ({
    friends, incoming, outgoing, friendships, searchResults, comments, commentsProfileId,
    status: authStatus === 'misconfigured' ? 'misconfigured' : status, error,
    search, loadComments, refreshFriendships,
    actions: { sendFriendRequest, respondToFriendRequest, cancelFriendRequest, createComment, updateComment, deleteComment },
  }), [authStatus, comments, commentsProfileId, error, friends, friendships, incoming, loadComments, outgoing, refreshFriendships, search, searchResults, sendFriendRequest, respondToFriendRequest, cancelFriendRequest, createComment, updateComment, deleteComment, status])

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial() {
  const value = useContext(SocialContext)
  if (!value) throw new Error('useSocial debe usarse dentro de SocialProvider')
  return value
}
