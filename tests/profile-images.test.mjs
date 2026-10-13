import test from 'node:test'
import assert from 'node:assert/strict'
import { getImageConstraints, validateImageFile } from '../src/profile/model.js'

test('exposes safe local image constraints for avatar and banner uploads', () => {
  assert.deepEqual(getImageConstraints('avatar'), { maxWidth: 512, maxHeight: 512, crop: 'square' })
  assert.deepEqual(getImageConstraints('banner'), { maxWidth: 1600, maxHeight: 900, crop: 'cover' })
  assert.equal(getImageConstraints('unknown'), null)
})

test('rejects oversized and unsupported profile images before browser processing', () => {
  assert.equal(validateImageFile({ type: 'image/webp', size: 5000 }, 'avatar').ok, true)
  assert.equal(validateImageFile({ type: 'image/svg+xml', size: 5000 }, 'banner').ok, false)
  assert.equal(validateImageFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }, 'avatar').ok, false)
})
