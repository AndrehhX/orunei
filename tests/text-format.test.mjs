import test from 'node:test'
import assert from 'node:assert/strict'
import { truncateWithEllipsis } from '../src/ui/text.js'

test('keeps hero descriptions bounded and ends clipped text with three dots', () => {
  const description = 'Una historia muy larga que necesita ocupar un espacio estable dentro del hero sin empujar los controles hacia afuera del banner.'
  const result = truncateWithEllipsis(description, 70)

  assert.equal(result.endsWith('...'), true)
  assert.ok(result.length <= 70)
  assert.equal(truncateWithEllipsis('Texto corto.', 70), 'Texto corto.')
  assert.equal(truncateWithEllipsis('<b>Texto</b><br> con formato.', 70), 'Texto con formato.')
})
