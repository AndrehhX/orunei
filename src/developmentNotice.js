const notices = {
  Juegos: {
    title: 'Juegos está en desarrollo',
    message: 'Pronto podrás descubrir, guardar y organizar tus juegos favoritos en Orunei.',
  },
  'Películas': {
    title: 'Películas está en desarrollo',
    message: 'Pronto podrás descubrir, guardar y organizar tus películas favoritas en Orunei.',
  },
  Series: {
    title: 'Series está en desarrollo',
    message: 'Pronto podrás descubrir, guardar y organizar tus series favoritas en Orunei.',
  },
}

export function getDevelopmentNotice(section) {
  return notices[section] ? { ...notices[section] } : null
}
