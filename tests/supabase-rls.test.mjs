import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(new URL('../supabase/migrations/005_profile_identity_rls.sql', import.meta.url), 'utf8')

test('restricts profile identity reads at the database policy boundary', () => {
  assert.match(migration, /drop policy if exists "authenticated users can read profile identity"/)
  assert.match(migration, /auth\.uid\(\) = id/)
  assert.match(migration, /profile_visibility = 'public'/)
  assert.match(migration, /public\.are_friends\(auth\.uid\(\), id\)/)
  assert.doesNotMatch(migration, /service_role/i)
})
