import { Check, MessageCircle, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { canComment } from '../social/model.js'
import { selectVisibleComments } from '../profile/publicProfile.js'
import { useSocial } from '../social/SocialProvider.jsx'

export default function ProfileComments({ profile, viewer = {} }) {
  const { comments, commentsProfileId, status, error, loadComments, actions } = useSocial()
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingBody, setEditingBody] = useState('')
  const isOwner = Boolean(viewer.isOwner || (viewer.id && viewer.profileId && viewer.id === viewer.profileId))
  const visibleComments = selectVisibleComments(profile, viewer, commentsProfileId === profile.id ? comments : [])
  const canWrite = !viewer.preview && canComment(profile, viewer)

  useEffect(() => { loadComments(profile.id) }, [loadComments, profile.id])

  const submit = async (event) => {
    event.preventDefault()
    if (!body.trim()) return
    const result = await actions.createComment(profile.id, body)
    if (!result.error) setBody('')
  }
  const saveEdit = async (comment) => {
    const result = await actions.updateComment(comment.id, editingBody)
    if (!result.error) { setEditingId(''); setEditingBody('') }
  }
  const canDelete = (comment) => comment.canEdit || isOwner

  return <section className="card p-5">
    <div className="mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-brand" /><div><h2 className="text-lg font-bold">Comentarios</h2><p className="text-xs text-slate-500">Conversaciones respetuosas alrededor de este perfil.</p></div></div>
    {status === 'loading' && <p className="mb-3 text-xs text-slate-500">Cargando comentarios…</p>}
    {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p>}
    {visibleComments.length ? <div className="space-y-3">{visibleComments.map((comment) => <article key={comment.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5"><div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">{comment.authorName.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{comment.authorName}</strong><time className="text-[11px] text-slate-500">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('es-GT') : 'Ahora'}</time></div>{editingId === comment.id ? <textarea value={editingBody} onChange={(event) => setEditingBody(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5" /> : <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{comment.body}</p>}</div>{(comment.canEdit || isOwner) && <div className="flex shrink-0 gap-1">{comment.canEdit && (editingId === comment.id ? <button onClick={() => saveEdit(comment)} aria-label="Guardar comentario" className="grid h-8 w-8 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-500/10"><Check size={14} /></button> : <button onClick={() => { setEditingId(comment.id); setEditingBody(comment.body) }} aria-label="Editar comentario" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-brand/10 hover:text-brand"><Pencil size={14} /></button>)}{canDelete(comment) && <button onClick={() => actions.deleteComment(comment.id)} aria-label="Eliminar comentario" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-500"><Trash2 size={14} /></button>}{editingId === comment.id && <button onClick={() => setEditingId('')} aria-label="Cancelar edición" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500"><X size={14} /></button>}</div>}</div></article>)}</div> : <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10">Todavía no hay comentarios.</p>}
    {canWrite ? <form onSubmit={submit} className="mt-4 flex gap-2"><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} rows={2} placeholder="Escribe un comentario…" className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/10" /><button className="self-end rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white">Publicar</button></form> : !isOwner && <p className="mt-4 text-xs text-slate-500">Los comentarios están disponibles en perfiles públicos para cuentas sin bloqueo.</p>}
  </section>
}
