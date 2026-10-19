// src/services/v2/Me/me-service.test.ts
// Execução 071, TASK-071-FE-01 — prova o contrato de transporte de
// `me-service.ts` contra `071-API-contrato-alvo.md` §2/§3/§5: sem foto vai
// por PUT JSON (sem `email`/`remove_photo`/contato); com foto vai por
// POST multipart + `_method=PUT` (upload em PUT nativo não popula $_FILES
// no PHP — DIV-13/C-A14); senha e preferências vão por PUT JSON simples.

import { afterEach, describe, expect, it, vi } from 'vitest';

const ENVELOPE = { success: true, message: null, data: null, errors: null, meta: null };

// Tipadas como `(...args: any[]) => Promise<...>` no genérico do `vi.fn` —
// não no corpo da implementação (que ignora os args, JS aceita) — para o
// wrapper de `vi.mock('@/services/api', ...)` poder repassar `...args` sem
// o TS reclamar de tupla `[]`, e sem parâmetro nomeado-porém-não-usado que
// o `@typescript-eslint/no-unused-vars` deste projeto reprovaria.
const putMock = vi.fn<(...args: any[]) => Promise<{ data: typeof ENVELOPE }>>(async () => ({
  data: ENVELOPE,
}));
const postMock = vi.fn<(...args: any[]) => Promise<{ data: typeof ENVELOPE }>>(async () => ({
  data: ENVELOPE,
}));
const getMock = vi.fn<(...args: any[]) => Promise<{ data: typeof ENVELOPE }>>(async () => ({
  data: ENVELOPE,
}));

vi.mock('@/services/api', () => ({
  default: {
    V2: {
      get: (...args: any[]) => getMock(...args),
      put: (...args: any[]) => putMock(...args),
      post: (...args: any[]) => postMock(...args),
    },
  },
}));

import { changeOwnPassword, updateOwnProfile, updatePreferences } from './me-service';

describe('me-service — contrato de transporte /me/*', () => {
  // Sem isto, o histórico de chamadas de um teste (ex.: `putMock` do
  // FE01-T01) vaza para o próximo (`expect(putMock).not.toHaveBeenCalled()`
  // do FE01-T02 via foto, que não deveria ver NENHUMA chamada anterior).
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('FE01-T01 — updateOwnProfile sem foto: PUT JSON só com name (sem email/remove_photo/contato)', async () => {
    await updateOwnProfile({ name: 'Maria Silva' });

    expect(putMock).toHaveBeenCalledTimes(1);
    expect(postMock).not.toHaveBeenCalled();
    const [endpoint, payload] = putMock.mock.calls[0];
    expect(endpoint).toBe('/me/profile');
    expect(payload).toEqual({ name: 'Maria Silva' });
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('remove_photo');
  });

  it('FE01-T02 — updateOwnProfile com foto: POST multipart com _method=PUT, name e photo (sem remove_photo)', async () => {
    const file = new File(['conteudo'], 'avatar.png', { type: 'image/png' });

    await updateOwnProfile({ name: 'Maria Silva', photo: file });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(putMock).not.toHaveBeenCalled();
    const [endpoint, fd] = postMock.mock.calls[0];
    expect(endpoint).toBe('/me/profile');
    expect(fd).toBeInstanceOf(FormData);
    const formData = fd as FormData;
    expect(formData.get('_method')).toBe('PUT');
    expect(formData.get('name')).toBe('Maria Silva');
    expect(formData.get('photo')).toBe(file);
    expect(formData.has('remove_photo')).toBe(false);
  });

  it('FE01-T03 — changeOwnPassword: PUT /me/password com os 3 campos', async () => {
    await changeOwnPassword({
      current_password: 'atual123',
      password: 'novasenha',
      password_confirmation: 'novasenha',
    });

    expect(putMock).toHaveBeenCalledWith('/me/password', {
      current_password: 'atual123',
      password: 'novasenha',
      password_confirmation: 'novasenha',
    });
  });

  it('FE01-T04 — updatePreferences: PUT /me/preferences com { lang }', async () => {
    await updatePreferences({ lang: 'pt-BR' });

    expect(putMock).toHaveBeenCalledWith('/me/preferences', { lang: 'pt-BR' });
  });
});
