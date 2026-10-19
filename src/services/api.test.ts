// @vitest-environment jsdom
// src/services/api.test.ts
// -----------------------------------------------------------------------------
// Bugfix lote 050 (branch feature/050-relatorios-contas): o interceptor de
// response deslogava em QUALQUER 401, derrubando a sessão também em 401 de
// negócio (ex.: emissor sem certificado). Contrato cross-layer: o backend
// marca APENAS o 401 de autenticação real (token/sessão ausente, expirado ou
// inválido) com `code: "unauthenticated"` no envelope de erro; qualquer outro
// 401 não carrega esse code. Esta suíte trava o comportamento correto:
//   (a) 401 com code "unauthenticated" → desloga (clearAuthStorage + evento
//       `auth-logout`, consumido pelo `forceLogout` do AuthContext);
//   (b) 401 sem esse code (negócio, ou opaco/sem corpo) → NÃO desloga, o erro
//       apenas propaga para o handler local da tela.
// -----------------------------------------------------------------------------

import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clearAuthStorage = vi.fn();

vi.mock('@/services/v2/Auth/auth-service', () => ({
  clearAuthStorage,
  getAccessToken: vi.fn(() => null),
}));

vi.mock('@/config/env', () => ({
  IS_TOKEN_AUTH: false,
  IS_COOKIE_AUTH: true,
}));

vi.mock('@/utils/errorLogEmitter', () => ({
  emitErrorLog: vi.fn(),
}));

function buildError(status: number, data?: unknown): AxiosError {
  return {
    isAxiosError: true,
    response: {
      status,
      data,
      statusText: '',
      headers: {},
      config: {} as any,
    },
    config: { url: '/some/business/endpoint' } as any,
    toJSON: () => ({}),
    name: 'AxiosError',
    message: 'Request failed',
  } as unknown as AxiosError;
}

describe('api.ts — interceptor de response só desloga em 401 de autenticação real', () => {
  let dispatchSpy: any;
  let rejectedHandler: (error: AxiosError) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    clearAuthStorage.mockClear();
    dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { axiosInstanceV2 } = await import('./api-instances');
    await import('./api'); // efeito colateral: registra os interceptors na instância

    const handlers = (axiosInstanceV2.interceptors.response as any).handlers;
    rejectedHandler = handlers[handlers.length - 1].rejected;
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  it('desloga quando o 401 vem com code "unauthenticated" (sessão/token real expirado)', async () => {
    const error = buildError(401, { code: 'unauthenticated', message: 'Unauthenticated.' });

    await expect(rejectedHandler(error)).rejects.toBe(error);

    expect(clearAuthStorage).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-logout' }));
  });

  it('NÃO desloga em 401 de negócio (sem code "unauthenticated") — erro flui para a tela', async () => {
    const error = buildError(401, { message: 'Emissor sem certificado configurado.' });

    await expect(rejectedHandler(error)).rejects.toBe(error);

    expect(clearAuthStorage).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-logout' }));
  });

  it('NÃO desloga em 401 opaco sem corpo (guarda defensiva — proxy/rede)', async () => {
    const error = buildError(401, undefined);

    await expect(rejectedHandler(error)).rejects.toBe(error);

    expect(clearAuthStorage).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-logout' }));
  });

  it('mantém o logout no 401 da rota de login excluído (comportamento preexistente)', async () => {
    const error = buildError(401, { code: 'unauthenticated' });
    (error.config as any).url = '/auth/login';

    await expect(rejectedHandler(error)).rejects.toBe(error);

    expect(clearAuthStorage).not.toHaveBeenCalled();
  });
});
