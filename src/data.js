// Paste Google/Pinterest image URLs into any `img` field. Empty = gradient fallback.
export const hero = {
  title: 'Kimi no Na wa.', meta: '2016 · Anime · Romance · Fantasía', img: '',
  desc: 'Dos adolescentes descubren que pueden intercambiar sus cuerpos, conectando sus vidas de maneras inesperadas.',
  grad: 'from-[#1b1f4d] via-[#3b2f7a] to-[#c0627a]',
}
export const trending = {
  title: 'Dandadan', meta: '2024 · Anime · Acción · Sobrenatural', rating: 8.6, img: '',
  grad: 'from-[#2a0f3a] via-[#7a1f4f] to-[#1f6b5a]',
}
const g = (a, b) => `from-[${a}] to-[${b}]`
export const library = [
  { t: 'Frieren', s: 'Viendo · Ep. 8 de 28', dot: 'bg-green-400', img: '', grad: g('#c9b7e6', '#6f8a6b') },
  { t: 'Monster', s: 'Planeo ver', dot: 'bg-blue-500', img: '', grad: g('#3a3a42', '#0e0e12') },
  { t: 'Vinland Saga', s: 'En pausa', dot: 'bg-yellow-400', img: '', grad: g('#8a7a5a', '#2d2a22') },
  { t: 'A Silent Voice', s: 'Terminado', dot: 'bg-green-400', img: '', grad: g('#f4a6c1', '#7fb6e6') },
  { t: 'Spirited Away', s: 'Terminado', dot: 'bg-green-400', img: '', grad: g('#d98a5a', '#4a3a2a') },
  { t: 'Your Name.', s: 'Favorito', dot: 'bg-pink-500', img: '', grad: g('#4a8be0', '#e8a0b8') },
]
export const because = [
  { t: 'Josee to Tora to…', y: 2018, r: 8.5, img: '', grad: g('#f7b6cf', '#7fb6e6') },
  { t: 'Violet Evergarden', y: 2018, r: 8.7, img: '', grad: g('#e8d9b8', '#6a7aa8') },
  { t: 'A Whisker Away', y: 2020, r: 7.1, img: '', grad: g('#6aa0d8', '#f0c8d8') },
  { t: 'I Want to Eat Your…', y: 2018, r: 8.4, img: '', grad: g('#f4a6c1', '#d9708f') },
  { t: 'Weathering With You', y: 2019, r: 8.6, img: '', grad: g('#4a9be8', '#bfe0f5') },
  { t: 'Suzume', y: 2022, r: 8.4, img: '', grad: g('#7a4ad8', '#f08ac0') },
]
export const similar = [
  { n: 'mika', p: 87, c: 14, grad: g('#f4a6c1', '#7a4ad8') },
  { n: 'ren', p: 82, c: 10, grad: g('#555', '#222') },
  { n: 'val', p: 78, c: 9, grad: g('#3a3a42', '#111') },
]
export const trends = [
  { t: 'Dandadan', y: 2024, v: '18.4K', grad: g('#d9405a', '#2a0f3a') },
  { t: 'Solo Leveling', y: 2024, v: '16.2K', grad: g('#3a4ad8', '#10102a') },
  { t: 'Frieren', y: 2023, v: '14.1K', grad: g('#9ad08a', '#c9b7e6') },
  { t: 'Chainsaw Man', y: 2022, v: '12.8K', grad: g('#4a3a3a', '#111') },
  { t: 'The Apothecary Diaries', y: 2023, v: '11.6K', grad: g('#8a6a4a', '#2a2a22') },
]
export const featured = [
  { t: 'Se anuncia la tercera temporada de Re:Zero', s: 'Anime News Network', h: 'hace 2 h', grad: g('#7fb6e6', '#4a3a8a') },
  { t: 'Nuevo tráiler de la película de Chainsaw Man: Reze Arc', s: 'Crunchyroll', h: 'hace 5 h', grad: g('#4a2a6a', '#111') },
]
export const news = [
  { t: 'Dandadan revela nuevo ending en su más reciente tráiler', d: 'El anime confirma más detalles sobre su segunda temporada, que se estrenará en 2025.', s: 'Crunchyroll', h: 'hace 4 h', grad: g('#d9405a', '#1a0f1f') },
  { t: 'Se revela visual oficial de la nueva película de Haikyuu!!', d: 'La esperada película adaptará el arco final del manga y se estrenará en 2025.', s: 'Anime News Network', h: 'hace 6 h', grad: g('#f08a3a', '#3a2a22') },
]
