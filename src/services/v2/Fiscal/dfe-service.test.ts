// UT-000752 (T-752-FE-01/03) — wire de `listDfes` (booleanos '1'/'0') e do
// adaptador de `listDfeReturnCandidates` (`meta` → paginação + `context`).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
vi.mock('@/services/api', () => ({
  default: { V2: { get: (...args: unknown[]) => getMock(...args) } },
}));

import { listDfeReturnCandidates, listDfes } from './dfe-service';

describe('dfe-service', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("listDfes envia launched='0', is_personal='1' e status=0; não envia chaves vazias", async () => {
    getMock.mockResolvedValue({
      data: { success: true, message: 'ok', data: [], errors: null, meta: null },
    });

    await listDfes({
      page: 1,
      per_page: 10,
      issue_uuid: 'abc',
      launched: '0',
      is_personal: '1',
      status: 0,
      search: '',
    });

    const [url, params] = getMock.mock.calls[0];
    expect(url).toBe('/dfes');
    expect(params.launched).toBe('0');
    expect(params.is_personal).toBe('1');
    expect(params.status).toBe(0);
    expect(params.issue_uuid).toBe('abc');
    expect(params.search).toBeUndefined();
    expect(params.is_shipment).toBeUndefined();
    expect(params.start_date).toBeUndefined();
  });

  it('listDfeReturnCandidates monta paginação a partir de meta e expõe context', async () => {
    const dfe = { uuid: 'd', chave: 'k', cpf_cnpj: '1', razao_social: 'R', valor: 10 };
    const candidate = {
      uuid: 'c1',
      code: 'V-1',
      dt_sale: '2026-01-02',
      total: 5,
      nfe_number: null,
      client_name: 'Cli',
      type_label: 'Venda Animal',
    };
    getMock.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: { dfe, suggestions: [candidate], items: [candidate] },
        meta: { current_page: 2, last_page: 4, per_page: 10, total: 33, from: 11, to: 20 },
      },
    });

    const result = await listDfeReturnCandidates('d', {
      page: 2,
      per_page: 10,
      date: '2026-01-02',
      search: '',
      // @ts-expect-error — campos extras do hook de grid NÃO devem ir na query
      orderBy: { name: 'x', ascOrDesc: 'asc' },
    });

    expect(getMock.mock.calls[0][0]).toBe('/dfes/d/return-candidates');
    expect(getMock.mock.calls[0][1]).toEqual({
      page: 2,
      per_page: 10,
      date: '2026-01-02',
      search: undefined,
    });
    expect(result.data.items).toEqual([candidate]);
    expect(result.data.pagination).toEqual({
      total: 33,
      count: 1,
      per_page: 10,
      current_page: 2,
      total_pages: 4,
    });
    expect(result.context.dfe).toEqual(dfe);
    expect(result.context.suggestions).toEqual([candidate]);
  });
});
