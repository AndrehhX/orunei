import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(new URL('../supabase/migrations/006_private_profile_identity_rls.sql', import.meta.url), 'utf8')
const sectionsMigration = readFileSync(new URL('../supabase/migrations/007_private_profile_sections_rls.sql', import.meta.url), 'utf8')

test('restricts profile identity reads at the database policy boundary', () => {
  assert.match(migration, /drop policy if exists "eligible viewers can read profile identity"/)
  assert.match(migration, /auth\.uid\(\) = id/)
  assert.match(migration, /profile_visibility = 'public'/)
  assert.doesNotMatch(migration, /public\.are_friends\(auth\.uid\(\), id\)/)
  assert.doesNotMatch(migration, /service_role/i)
})

test('keeps private profile sections behind the profile visibility boundary', () => {
  assert.match(sectionsMigration, /profile_privacy\.profile_id/)
  assert.match(sectionsMigration, /profile_activity\.profile_id/)
  assert.match(sectionsMigration, /profile_anime\.profile_id/)
  assert.match(sectionsMigration, /profile_lists\.profile_id/)
  assert.equal((sectionsMigration.match(/profile_visibility = 'public'/g) || []).length, 4)
  assert.doesNotMatch(sectionsMigration, /service_role/i)
})
