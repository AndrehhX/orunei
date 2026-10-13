import test from 'node:test'
import assert from 'node:assert/strict'
import { getPageScrollReset } from '../src/ui/pageNavigation.js'

test('resets the scroll position when entering a new application page', () => {
  assert.deepEqual(getPageScrollReset(), { left: 0, top: 0, behavior: 'auto' })
})
