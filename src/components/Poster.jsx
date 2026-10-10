import { useState } from 'react'
// Shows the image if provided; otherwise (or on error) a gradient with the title.
export default function Poster({ img, grad, title, className = '', children }) {
  const [bad, setBad] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${grad} ${className}`}>
      {img && !bad ? (
        <img src={img} alt={title} loading="lazy" onError={() => setBad(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <span className="absolute inset-0 flex items-end p-2 text-[11px] font-bold text-white/80 drop-shadow">{title}</span>
      )}
      {children}
    </div>
  )
}
