import { useState } from 'react'
import { useImages } from '../images'
// Image priority: manual `img` > AniList (banner if `wide`, else cover) > gradient fallback.
export default function Poster({ img, q, wide, grad, title, className = '', children, onClick }) {
  const [bad, setBad] = useState(false)
  const [ok, setOk] = useState(false)
  const found = useImages()[q]
  const src = img || (wide ? found?.banner || found?.cover : found?.cover)
  const pos = /\babsolute\b/.test(className) ? '' : 'relative'
  return (
    <div onClick={onClick} className={`${pos} overflow-hidden ${className}`} style={{ backgroundImage: grad }}>
      {src && !bad ? (
        <>
          {!ok && <div className="absolute inset-0 animate-pulse bg-white/20" />}
          <img src={src} alt={title} loading="lazy" decoding="async" onLoad={() => setOk(true)} onError={() => setBad(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${ok ? 'opacity-100' : 'opacity-0 scale-105'}`} />
        </>
      ) : (
        title && <span className="absolute inset-0 flex items-end p-2 text-[11px] font-bold text-white/80 drop-shadow">{title}</span>
      )}
      {children}
    </div>
  )
}
