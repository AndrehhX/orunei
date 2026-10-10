import { useState } from 'react'
import { useImages } from '../images'
// Image priority: manual `img` > AniList (banner if `wide`, else cover) > gradient fallback.
export default function Poster({ img, q, wide, grad, title, className = '', children }) {
  const [bad, setBad] = useState(false)
  const found = useImages()[q]
  const src = img || (wide ? found?.banner || found?.cover : found?.cover)
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundImage: grad }}>
      {src && !bad ? (
        <img src={src} alt={title} loading="lazy" onError={() => setBad(true)}
          className="absolute inset-0 h-full w-full animate-fade object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        title && <span className="absolute inset-0 flex items-end p-2 text-[11px] font-bold text-white/80 drop-shadow">{title}</span>
      )}
      {children}
    </div>
  )
}
