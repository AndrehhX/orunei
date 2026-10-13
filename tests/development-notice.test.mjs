import test from 'node:test'
import assert from 'node:assert/strict'
import { getDevelopmentNotice } from '../src/developmentNotice.js'

test('builds a branded development notice for unsupported sections', () => {
  assert.deepEqual(getDevelopmentNotice('Películas'), {
    title: 'Películas está en desarrollo',
    message: 'Pronto podrás descubrir, guardar y organizar tus películas favoritas en Orunei.',
  })
  assert.deepEqual(getDevelopmentNotice('Juegos'), {
    title: 'Juegos está en desarrollo',
    message: 'Pronto podrás descubrir, guardar y organizar tus juegos favoritos en Orunei.',
  })
})

test('returns the matching notice for Series and ignores supported sections', () => {
  assert.deepEqual(getDevelopmentNotice('Series'), {
    title: 'Series está en desarrollo',
    message: 'Pronto podrás descubrir, guardar y organizar tus series favoritas en Orunei.',
  })
  assert.equal(getDevelopmentNotice('Anime'), null)
  assert.equal(getDevelopmentNotice('Noticias'), null)
})
