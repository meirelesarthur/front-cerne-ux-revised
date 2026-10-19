// -----------------------------------------------------------------------------
// 095 / TASK-095-FE-01 — `extractBlockedUuids` e a exclusão de chaves não-campo
// (`blocked_uuids*`) em `extractApiFieldErrorMessage`.
// -----------------------------------------------------------------------------

import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { extractApiErrorMessage, extractBlockedUuids } from './extractApiErrorMessage';

function mockAxiosError(status: number, data: any): AxiosError {
  return {
    isAxiosError: true,
    response: { status, data, statusText: '', headers: {}, config: {} as any },
    toJSON: () => ({}),
    name: 'AxiosError',
    message: `Request failed with status code ${status}`,
  } as unknown as AxiosError;
}

describe('extractBlockedUuids', () => {
  it('422 com lista devolve uuids e truncated=false', () => {
    const error = mockAxiosError(422, {
      message: 'bloqueado',
      errors: { blocked_uuids: ['a', 'b'], blocked_uuids_truncated: false },
    });
    expect(extractBlockedUuids(error)).toEqual({ uuids: ['a', 'b'], truncated: false });
  });

  it('422 truncado devolve truncated=true', () => {
    const error = mockAxiosError(422, {
      errors: { blocked_uuids: ['a'], blocked_uuids_truncated: true },
    });
    expect(extractBlockedUuids(error)).toEqual({ uuids: ['a'], truncated: true });
  });

  it('422 com lista vazia devolve null', () => {
    const error = mockAxiosError(422, {
      errors: { blocked_uuids: [], blocked_uuids_truncated: false },
    });
    expect(extractBlockedUuids(error)).toBeNull();
  });

  it('422 sem errors devolve null', () => {
    expect(extractBlockedUuids(mockAxiosError(422, { message: 'x', errors: null }))).toBeNull();
  });

  it('não-422 devolve null', () => {
    const error = mockAxiosError(500, { errors: { blocked_uuids: ['a'] } });
    expect(extractBlockedUuids(error)).toBeNull();
  });

  it('erro que não é do axios devolve null', () => {
    expect(extractBlockedUuids(new Error('x'))).toBeNull();
  });
});

describe('extractApiErrorMessage com blocked_uuids', () => {
  it('nunca devolve um uuid: cai na message do envelope', () => {
    const error = mockAxiosError(422, {
      message: 'Não foi possível excluir.',
      errors: { blocked_uuids: ['uuid-1'], blocked_uuids_truncated: false },
    });
    expect(extractApiErrorMessage(error)).toBe('Não foi possível excluir.');
  });
});
