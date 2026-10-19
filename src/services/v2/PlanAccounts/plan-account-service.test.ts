// 088 D3-FE-T1 — `listPlanAccountOptions` repassa `conditions[]` e `category_uuid`
// (cascata IG-06) sem alterar os consumidores atuais (que só enviam `condition`).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn<(...args: any[]) => Promise<{ data: unknown }>>();

vi.mock('@/services/api', () => ({
  default: { V2: { get: (...args: any[]) => getMock(...args) } },
}));

import { listPlanAccountOptions } from './plan-account-service';

const ENVELOPE = {
  success: true,
  message: null,
  errors: null,
  meta: null,
  data: [
    { uuid: 'u1', code: '3.1.01', description: 'Conta 1' },
    { uuid: 'u2', code: '3.1.02', description: 'Conta 2' },
  ],
};

describe('listPlanAccountOptions — 088 D3-T1', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({ data: ENVELOPE });
  });

  it('envia conditions[] e category_uuid junto com is_enabled/class', async () => {
    await listPlanAccountOptions({
      is_enabled: 'true',
      class: 2,
      conditions: [1, 3],
      category_uuid: 'cat-uuid',
      search: 'abc',
    });
    expect(getMock).toHaveBeenCalledTimes(1);
    const [url, params] = getMock.mock.calls[0];
    expect(url).toBe('/plan-accounts/options');
    expect(params).toMatchObject({
      is_enabled: 'true',
      class: 2,
      conditions: [1, 3],
      category_uuid: 'cat-uuid',
      search: 'abc',
    });
  });

  it('consumidores atuais (só `condition`) seguem sem conditions/category_uuid', async () => {
    await listPlanAccountOptions({ is_enabled: 'true', class: 2, condition: '1' });
    const params = getMock.mock.calls[0][1];
    expect(params.condition).toBe('1');
    expect(params.conditions).toBeUndefined();
    expect(params.category_uuid).toBeUndefined();
  });

  it('conditions vazio e category_uuid vazio não são enviados', async () => {
    await listPlanAccountOptions({ conditions: [], category_uuid: '' });
    const params = getMock.mock.calls[0][1];
    expect(params.conditions).toBeUndefined();
    expect(params.category_uuid).toBeUndefined();
  });

  it('o 1º item (ordenado por code pela API) é preservado na ordem e paginado no cliente', async () => {
    const res = await listPlanAccountOptions({ category_uuid: 'cat-uuid', page: 1, per_page: 1 });
    expect(res.data.items.map((i) => i.uuid)).toEqual(['u1']);
    expect(res.data.pagination.total).toBe(2);
  });
});
