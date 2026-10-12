import { Heart } from 'lucide-react'
export default function LikeBtn({ on, onClick, className = '' }) {
  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }} aria-label="Me gusta"
      className={`grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-all duration-300 ease-spring hover:scale-110 active:scale-90 ${className}`}>
      <Heart size={15} className={`transition-all duration-300 ${on ? 'scale-110 fill-pink-500 text-pink-500' : ''}`} />
    </button>
  )
}
