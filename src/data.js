// Images load automatically from AniList using `q`. You can also force one with `img: 'https://...'`.
const g = (a, b) => `linear-gradient(135deg, ${a}, ${b})`
export const hero = {
  title: 'Kimi no Na wa.', meta: '2016 · Anime · Romance · Fantasía', img: '',
  desc: 'Dos adolescentes descubren que pueden intercambiar sus cuerpos, conectando sus vidas de maneras inesperadas.',
  grad: g('#1b1f4d', '#c0627a'), q: 'Kimi no Na wa',
}
export const trending = {
  title: 'Dandadan', meta: '2024 · Anime · Acción · Sobrenatural', rating: 8.6, img: '',
  grad: g('#2a0f3a', '#1f6b5a'), q: 'Dandadan',
}
export const library = [
  { q: 'Sousou no Frieren', t: 'Frieren', s: 'Viendo · Ep. 8 de 28', dot: 'bg-green-400', img: '', grad: g('#c9b7e6', '#6f8a6b') },
  { q: 'Monster', t: 'Monster', s: 'Planeo ver', dot: 'bg-blue-500', img: '', grad: g('#3a3a42', '#0e0e12') },
  { q: 'Vinland Saga', t: 'Vinland Saga', s: 'En pausa', dot: 'bg-yellow-400', img: '', grad: g('#8a7a5a', '#2d2a22') },
  { q: 'Koe no Katachi', t: 'A Silent Voice', s: 'Terminado', dot: 'bg-green-400', img: '', grad: g('#f4a6c1', '#7fb6e6') },
  { q: 'Sen to Chihiro no Kamikakushi', t: 'Spirited Away', s: 'Terminado', dot: 'bg-green-400', img: '', grad: g('#d98a5a', '#4a3a2a') },
  { q: 'Kimi no Na wa', t: 'Your Name.', s: 'Favorito', dot: 'bg-pink-500', img: '', grad: g('#4a8be0', '#e8a0b8') },
]
export const because = [
  { q: 'Josee to Tora to Sakana-tachi', t: 'Josee to Tora to…', y: 2018, r: 8.5, img: '', grad: g('#f7b6cf', '#7fb6e6') },
  { q: 'Violet Evergarden', t: 'Violet Evergarden', y: 2018, r: 8.7, img: '', grad: g('#e8d9b8', '#6a7aa8') },
  { q: 'Nakitai Watashi wa Neko wo Kaburu', t: 'A Whisker Away', y: 2020, r: 7.1, img: '', grad: g('#6aa0d8', '#f0c8d8') },
  { q: 'Kimi no Suizou wo Tabetai', t: 'I Want to Eat Your…', y: 2018, r: 8.4, img: '', grad: g('#f4a6c1', '#d9708f') },
  { q: 'Tenki no Ko', t: 'Weathering With You', y: 2019, r: 8.6, img: '', grad: g('#4a9be8', '#bfe0f5') },
  { q: 'Suzume no Tojimari', t: 'Suzume', y: 2022, r: 8.4, img: '', grad: g('#7a4ad8', '#f08ac0') },
]
export const similar = [
  { n: 'mika', p: 87, c: 14, grad: g('#f4a6c1', '#7a4ad8') },
  { n: 'ren', p: 82, c: 10, grad: g('#555', '#222') },
  { n: 'val', p: 78, c: 9, grad: g('#3a3a42', '#111') },
]
export const trends = [
  { q: 'Dandadan', t: 'Dandadan', y: 2024, v: '18.4K', grad: g('#d9405a', '#2a0f3a') },
  { q: 'Ore dake Level Up na Ken', t: 'Solo Leveling', y: 2024, v: '16.2K', grad: g('#3a4ad8', '#10102a') },
  { q: 'Sousou no Frieren', t: 'Frieren', y: 2023, v: '14.1K', grad: g('#9ad08a', '#c9b7e6') },
  { q: 'Chainsaw Man', t: 'Chainsaw Man', y: 2022, v: '12.8K', grad: g('#4a3a3a', '#111') },
  { q: 'Kusuriya no Hitorigoto', t: 'The Apothecary Diaries', y: 2023, v: '11.6K', grad: g('#8a6a4a', '#2a2a22') },
]
export const featured = [
  { q: 'Re:Zero kara Hajimeru Isekai Seikatsu', t: 'Se anuncia la tercera temporada de Re:Zero', s: 'Anime News Network', h: 'hace 2 h', grad: g('#7fb6e6', '#4a3a8a') },
  { q: 'Chainsaw Man', t: 'Nuevo tráiler de la película de Chainsaw Man: Reze Arc', s: 'Crunchyroll', h: 'hace 5 h', grad: g('#4a2a6a', '#111') },
]
export const news = [
  { q: 'Dandadan', t: 'Dandadan revela nuevo ending en su más reciente tráiler', d: 'El anime confirma más detalles sobre su segunda temporada, que se estrenará en 2025.', s: 'Crunchyroll', h: 'hace 4 h', grad: g('#d9405a', '#1a0f1f') },
  { q: 'Haikyuu!! Final', t: 'Se revela visual oficial de la nueva película de Haikyuu!!', d: 'La esperada película adaptará el arco final del manga y se estrenará en 2025.', s: 'Anime News Network', h: 'hace 6 h', grad: g('#f08a3a', '#3a2a22') },
]

export const slides = [
  hero,
  { title: 'A Silent Voice', meta: '2016 · Anime · Drama · Romance', q: 'Koe no Katachi', grad: g('#2a3a6a', '#f4a6c1'),
    desc: 'Un joven busca redimirse con la chica sorda a la que acosó en su infancia.' },
  { title: 'Weathering With You', meta: '2019 · Anime · Romance · Fantasía', q: 'Tenki no Ko', grad: g('#1b3a6a', '#7fb6e6'),
    desc: 'Un chico fugitivo conoce a una joven capaz de controlar el clima en Tokio.' },
]
