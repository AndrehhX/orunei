import test from 'node:test'
import assert from 'node:assert/strict'
import { getProfileLayoutClasses, getPublicProfileAvatarClass } from '../src/ui/profileLayout.js'

test('keeps the private profile header inside its available width', () => {
  assert.deepEqual(getProfileLayoutClasses(), {
    shell: 'min-w-0 w-full max-w-full',
    avatar: 'relative z-20',
    identity: 'min-w-0 flex-1 pb-1',
    actions: 'flex w-full flex-wrap gap-2 sm:w-auto',
    stats: 'mt-5 grid min-w-0 grid-cols-2 divide-x divide-y divide-slate-200 rounded-2xl border border-slate-200/80 bg-slate-50/70 sm:grid-cols-3 sm:divide-y-0',
  })
})

test('keeps the public profile avatar above the banner layer', () => {
  assert.equal(getPublicProfileAvatarClass(), 'relative z-20')
})
