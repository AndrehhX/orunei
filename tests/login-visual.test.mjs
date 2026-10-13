import test from 'node:test'
import assert from 'node:assert/strict'
import { getLoginPointerOffset, shouldEnableLoginParallax } from '../src/ui/loginVisual.js'

test('limits login parallax to a subtle normalized range', () => {
  assert.deepEqual(getLoginPointerOffset({ clientX: 0, clientY: 0 }, { left: 100, top: 50, width: 400, height: 300 }), { x: -1, y: -1 })
  assert.deepEqual(getLoginPointerOffset({ clientX: 300, clientY: 200 }, { left: 100, top: 50, width: 400, height: 300 }), { x: 0, y: 0 })
  assert.deepEqual(getLoginPointerOffset({ clientX: 900, clientY: 900 }, { left: 100, top: 50, width: 400, height: 300 }), { x: 1, y: 1 })
})

test('only enables the login parallax for a fine pointer with motion allowed', () => {
  assert.equal(shouldEnableLoginParallax({ pointer: 'fine', reducedMotion: false }), true)
  assert.equal(shouldEnableLoginParallax({ pointer: 'coarse', reducedMotion: false }), false)
  assert.equal(shouldEnableLoginParallax({ pointer: 'fine', reducedMotion: true }), false)
})
