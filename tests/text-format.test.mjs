import test from 'node:test'
import assert from 'node:assert/strict'
import * as text from '../src/ui/text.js'
const { truncateWithEllipsis } = text

test('keeps hero descriptions bounded and ends clipped text with three dots', () => {
  const description = 'Una historia muy larga que necesita ocupar un espacio estable dentro del hero sin empujar los controles hacia afuera del banner.'
  const result = truncateWithEllipsis(description, 70)

  assert.equal(result.endsWith('...'), true)
  assert.ok(result.length <= 70)
  assert.equal(truncateWithEllipsis('Texto corto.', 70), 'Texto corto.')
  assert.equal(truncateWithEllipsis('<b>Texto</b><br> con formato.', 70), 'Texto con formato.')
})

test('keeps long hero titles bounded without changing short titles', () => {
  assert.equal(typeof text.formatHeroTitle, 'function')

  const result = text.formatHeroTitle("So What's Wrong with Getting Reborn as a Divine Genius?", 44)

  assert.equal(result.endsWith('...'), true)
  assert.ok(result.length <= 44)
  assert.equal(text.formatHeroTitle('Dandadan', 44), 'Dandadan')
})
