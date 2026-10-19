// src/contexts/AuthContext/mapUser.test.ts
// Execução 071, TASK-071-FE-02 (FE02-T01) — `photo_url` presente → `photoUrl`;
// ausente → `null`; `uuid`, `email` e `username` inalterados (SRF-071-12).

import { describe, expect, it } from 'vitest';

import { mapUser } from './mapUser';

describe('mapUser — FE02-T01', () => {
  it('photo_url presente → photoUrl', () => {
    const user = mapUser({
      uuid: '9c1e-abc',
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
      photo_url: 'https://api.exemplo.com/storage/users/abc123.jpg',
    });

    expect(user.photoUrl).toBe('https://api.exemplo.com/storage/users/abc123.jpg');
    expect(user.uuid).toBe('9c1e-abc');
    expect(user.email).toBe('maria@exemplo.com');
    expect(user.username).toBe('Maria Silva');
  });

  it('photo_url ausente → null (nunca undefined)', () => {
    const user = mapUser({
      uuid: '9c1e-abc',
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
    });

    expect(user.photoUrl).toBeNull();
  });

  it('perfil vazio/undefined não quebra e ainda produz photoUrl null', () => {
    expect(mapUser(undefined).photoUrl).toBeNull();
    expect(mapUser({}).photoUrl).toBeNull();
  });
});
