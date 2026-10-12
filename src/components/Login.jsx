import { useState } from 'react'
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Check, Sun, Moon } from 'lucide-react'
import Mascots from './Mascots'

function Field({ icon: I, label, children, ...p }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <span className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/70 px-3.5 transition-all duration-300 focus-within:border-brand focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(109,92,255,.15)] dark:border-white/10 dark:bg-white/5 dark:focus-within:bg-white/10">
        <I size={17} className="text-slate-400 transition-colors group-focus-within:text-brand" />
        <input {...p} className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        {children}
      </span>
    </label>
  )
}

export default function Login({ onLogin, dark, setDark }) {
  const [reg, setReg] = useState(false)
  const [f, setF] = useState({ name: '', email: '', pass: '' })
  const [focus, setFocus] = useState(null)
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(0)
  const [state, setState] = useState('idle')
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr('') }
  const mode = focus === 'pass' ? (show ? 'peek' : 'pass') : focus === 'email' ? 'email' : 'idle'

  const submit = (e) => {
    e.preventDefault()
    if (reg && f.name.trim().length < 2) return fail('Dime tu nombre de usuario')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return fail('Ese correo no parece válido')
    if (f.pass.length < 4) return fail('La contraseña necesita al menos 4 caracteres')
    setState('loading')
    setTimeout(() => setState('done'), 900)
    setTimeout(() => onLogin({ name: f.name.trim() || f.email.split('@')[0], email: f.email }), 1600)
  }
  const fail = (m) => { setErr(m); setShake((s) => s + 1) }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 animate-fade">
      <div className="absolute -left-24 -top-24 h-96 w-96 animate-floaty rounded-full bg-brand/25 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-[26rem] w-[26rem] animate-floaty rounded-full bg-pink-300/30 blur-3xl [animation-delay:-5s]" />
      <header className="absolute inset-x-0 top-0 flex items-center justify-between p-6">
        <div className="flex items-center gap-2 text-2xl font-extrabold"><Sparkles className="text-brand" size={26} />Orunei</div>
        <button onClick={() => setDark(!dark)} aria-label="Cambiar tema" className="grid h-10 w-10 place-items-center rounded-full bg-white/80 shadow-sm transition hover:rotate-12 hover:scale-110 dark:bg-white/10">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      </header>

      <div className="relative w-full max-w-[400px]">
        <Mascots mode={mode} emailLen={f.email.length} />
        <form key={shake} onSubmit={submit} noValidate className={`card -mt-3 space-y-4 p-7 shadow-xl shadow-brand/10 backdrop-blur ${shake ? 'animate-shake' : 'animate-rise'}`}>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{reg ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}</h1>
            <p className="text-sm text-slate-500">{reg ? 'Empieza tu biblioteca de anime.' : 'Tu próxima historia favorita te espera.'}</p>
          </div>
          <div className={`grid transition-all duration-500 ease-smooth ${reg ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden"><div className="pb-1"><Field icon={User} label="Usuario" value={f.name} onChange={set('name')} onFocus={() => setFocus('name')} onBlur={() => setFocus(null)} placeholder="dereck" tabIndex={reg ? 0 : -1} /></div></div>
          </div>
          <Field icon={Mail} label="Correo" type="email" value={f.email} onChange={set('email')} onFocus={() => setFocus('email')} onBlur={() => setFocus(null)} placeholder="tu@correo.com" autoComplete="email" />
          <Field icon={Lock} label="Contraseña" type={show ? 'text' : 'password'} value={f.pass} onChange={set('pass')} onFocus={() => setFocus('pass')} onBlur={() => setFocus(null)} placeholder="••••••••" autoComplete="current-password">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShow(!show)} aria-label="Mostrar contraseña" className="text-slate-400 transition hover:text-brand">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </Field>
          <p className={`text-xs text-red-500 transition-all duration-300 ${err ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0'}`}>{err}</p>
          <button disabled={state !== 'idle'} className={`relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white transition-all duration-500 ease-spring active:scale-95 ${state === 'done' ? 'bg-emerald-500' : 'bg-brand shadow-lg shadow-brand/30 hover:-translate-y-0.5 hover:brightness-110'}`}>
            {state === 'idle' && (reg ? 'Crear cuenta' : 'Iniciar sesión')}
            {state === 'loading' && <i className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {state === 'done' && <Check size={20} className="animate-drop" />}
          </button>
          <p className="text-center text-sm text-slate-500">{reg ? '¿Ya tienes cuenta?' : '¿Eres nuevo?'}{' '}
            <button type="button" onClick={() => { setReg(!reg); setErr('') }} className="font-semibold text-brand hover:underline">{reg ? 'Inicia sesión' : 'Crea una cuenta'}</button></p>
        </form>
      </div>
    </div>
  )
}
