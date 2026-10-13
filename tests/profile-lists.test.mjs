import test from 'node:test'
import assert from 'node:assert/strict'
import { addAnimeToList, createCustomList, deleteCustomList, removeAnimeFromList, updateCustomList } from '../src/profile/profileLists.js'

test('supports private custom list CRUD without duplicate anime', () => {
  const list = createCustomList('  Noches de anime  ', 'Para ver con calma', '2026-10-12T12:00:00.000Z')
  assert.deepEqual(list, { id: 'list-2026-10-12T12:00:00.000Z', title: 'Noches de anime', description: 'Para ver con calma', animeIds: [], createdAt: '2026-10-12T12:00:00.000Z', updatedAt: '2026-10-12T12:00:00.000Z' })

  let lists = addAnimeToList([list], list.id, 'anime-1')
  lists = addAnimeToList(lists, list.id, 'anime-1')
  lists = updateCustomList(lists, list.id, { title: 'Favoritos nocturnos' }, '2026-10-13T12:00:00.000Z')
  assert.equal(lists[0].title, 'Favoritos nocturnos')
  assert.deepEqual(lists[0].animeIds, ['anime-1'])
  lists = removeAnimeFromList(lists, list.id, 'anime-1')
  assert.deepEqual(lists[0].animeIds, [])
  assert.deepEqual(deleteCustomList(lists, list.id), [])
})
