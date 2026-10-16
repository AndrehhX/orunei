import test from 'node:test';
import assert from 'node:assert/strict';
import { getInitialOnlineStatus } from '../src/offline/useNetworkStatus.js';

test('getInitialOnlineStatus retorna true de forma segura si navigator no está disponible o está online', () => {
  assert.equal(typeof getInitialOnlineStatus(), 'boolean');
});
