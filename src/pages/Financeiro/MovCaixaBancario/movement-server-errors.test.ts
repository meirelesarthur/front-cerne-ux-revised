// @vitest-environment node
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { applyServerFieldErrors } from './movement-server-errors';

function axios422(errors: Record<string, string[]> | undefined, status = 422) {
  const err = new AxiosError('x');
  err.response = { status, data: { errors }, statusText: '', headers: {}, config: {} as any };
  return err;
}

describe('applyServerFieldErrors', () => {
  it('mapeia chaves flat de campo (incl. as novas regras UT-796)', () => {
    const setError = vi.fn();
    applyServerFieldErrors(
      axios422({
        type_category: ['m1'],
        client_uuid: ['m2'],
        provider_uuid: ['m3'],
        destination_account_uuid: ['m4'],
        generates_obligation: ['m5'],
        type: ['m6'],
      }),
      setError
    );
    expect(setError).toHaveBeenCalledWith('type_category', { type: 'server', message: 'm1' });
    expect(setError).toHaveBeenCalledWith('client_uuid', { type: 'server', message: 'm2' });
    expect(setError).toHaveBeenCalledWith('provider_uuid', { type: 'server', message: 'm3' });
    expect(setError).toHaveBeenCalledWith('destination_account_uuid', {
      type: 'server',
      message: 'm4',
    });
    expect(setError).toHaveBeenCalledWith('generates_obligation', {
      type: 'server',
      message: 'm5',
    });
    expect(setError).toHaveBeenCalledWith('type', { type: 'server', message: 'm6' });
    expect(setError).toHaveBeenCalledTimes(6);
  });

  it('mapeia allocations.N.campo', () => {
    const setError = vi.fn();
    applyServerFieldErrors(axios422({ 'allocations.2.category_uuid': ['cat'] }), setError);
    expect(setError).toHaveBeenCalledWith('allocations.2.category_uuid', {
      type: 'server',
      message: 'cat',
    });
  });

  it('ignora chave desconhecida e erro de array', () => {
    const setError = vi.fn();
    applyServerFieldErrors(axios422({ allocations: ['min'], foo: ['x'] }), setError);
    expect(setError).not.toHaveBeenCalled();
  });

  it('ignora status != 422, erro não-axios e 422 sem errors', () => {
    const setError = vi.fn();
    applyServerFieldErrors(axios422({ type: ['x'] }, 500), setError);
    applyServerFieldErrors(new Error('boom'), setError);
    applyServerFieldErrors(axios422(undefined), setError);
    expect(setError).not.toHaveBeenCalled();
  });
});
