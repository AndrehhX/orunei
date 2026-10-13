import test from 'node:test'
import assert from 'node:assert/strict'
import { cursorState, isFinePointer } from '../src/ui/cursor.js'

test('enables the custom cursor only for fine pointers with motion enabled', () => {
  assert.equal(isFinePointer({ pointer: 'fine', reducedMotion: false }), true)
  assert.equal(cursorState({ pointer: 'fine', reducedMotion: false }).enabled, true)
  assert.equal(cursorState({ pointer: 'coarse', reducedMotion: false }).enabled, false)
  assert.equal(cursorState({ pointer: 'fine', reducedMotion: true }).enabled, false)
})

test('returns smooth interaction states without changing the cursor contract', () => {
  assert.deepEqual(cursorState({ pointer: 'fine', reducedMotion: false, interactive: true, pressed: true }), {
    enabled: true,
    interactive: true,
    pressed: true,
  })
})
