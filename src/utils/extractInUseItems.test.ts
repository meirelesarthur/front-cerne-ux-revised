// src/utils/extractInUseItems.test.ts
// -----------------------------------------------------------------------------
// Teste unitário puro de `extractInUseItems` (FRONT-03-InUseBlockedDialog.md,
// cenários smoke 1-5). Mesmo helper de mock (`mockAxiosError`) de
// `extractApiErrorMessage.test.ts` — reproduzido aqui para manter o teste
// autocontido/legível sem acoplar os dois arquivos de teste.
// -----------------------------------------------------------------------------

import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { extractInUseItems } from './extractApiErrorMessage';

function mockAxiosError(status: number, data: any): AxiosError {
  return {
    isAxiosError: true,
    response: { status, data, statusText: '', headers: {}, config: {} as any },
    toJSON: () => ({}),
    name: 'AxiosError',
    message: `Request failed with status code ${status}`,
  } as unknown as AxiosError;
}

describe('extractInUseItems', () => {
  it('shape ARRAY (Addressing/AccountingGrouper/...) — normaliza e IGNORA `resource`', () => {
    const error = mockAxiosError(422, {
      errors: {
        in_use: [
          { resource: 'produtos', table: 'products', count: 2 },
          { resource: 'agrupadores-filhos', table: 'accounting_groupers', count: 1 },
        ],
      },
    });

    const result = extractInUseItems(error);

    expect(result).toEqual([
      { table: 'products', count: 2 },
      { table: 'accounting_groupers', count: 1 },
    ]);
    expect(JSON.stringify(result)).not.toContain('resource');
  });

  it('shape MAPA (Fodder/Grazing/ParameterWeight/...) — normaliza para o mesmo formato', () => {
    const error = mockAxiosError(422, {
      errors: { in_use: { grazings: 3 } },
    });

    const result = extractInUseItems(error);

    expect(result).toEqual([{ table: 'grazings', count: 3 }]);
  });

  it('422 sem `errors.in_use` (outro erro de validação por campo) — null', () => {
    const error = mockAxiosError(422, { errors: { name: ['Este campo é obrigatório.'] } });

    expect(extractInUseItems(error)).toBeNull();
  });

  it('`errors.in_use` array vazio — null (cai no fallback de toast genérico)', () => {
    const error = mockAxiosError(422, { errors: { in_use: [] } });

    expect(extractInUseItems(error)).toBeNull();
  });

  it('`errors.in_use` mapa vazio — null (cai no fallback de toast genérico)', () => {
    const error = mockAxiosError(422, { errors: { in_use: {} } });

    expect(extractInUseItems(error)).toBeNull();
  });

  it('erro não-Axios (`Error` genérico) — null', () => {
    expect(extractInUseItems(new Error('boom'))).toBeNull();
  });

  it('AxiosError com status != 422 (ex.: 500) — null', () => {
    const error = mockAxiosError(500, {
      errors: { in_use: [{ resource: 'x', table: 'x', count: 1 }] },
    });

    expect(extractInUseItems(error)).toBeNull();
  });

  it('AxiosError 422 sem `response` (network error) — null', () => {
    const error = { isAxiosError: true, message: 'Network Error' } as unknown as AxiosError;

    expect(extractInUseItems(error)).toBeNull();
  });
});
