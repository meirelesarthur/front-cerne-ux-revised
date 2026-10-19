// UT-000715 / T-FE-715-02(a) — prova o transporte de `getModuleWeighingNfeEligibility`:
// chama `GET /module-weighings/{uuid}/nfe` e devolve o envelope tipado sem reescrevê-lo.

import { afterEach, describe, expect, it, vi } from 'vitest';

const ENVELOPE = {
  success: true,
  message: null,
  data: {
    module_weighing_uuid: 'mw-uuid-1',
    gross_weight: '45000.00',
    net_weight: '30000.00',
    items: [
      { product_uuid: 'prod-uuid-1', quantity: '30000.0000', amount: '0', warehouse_uuid: null },
    ],
  },
  errors: null,
  meta: null,
};

const getMock = vi.fn<(...args: any[]) => Promise<{ data: typeof ENVELOPE }>>(async () => ({
  data: ENVELOPE,
}));

vi.mock('@/services/api', () => ({
  default: {
    V2: {
      get: (...args: any[]) => getMock(...args),
    },
  },
}));

import { getModuleWeighingNfeEligibility } from './module-weighing-service';

afterEach(() => {
  getMock.mockClear();
});

describe('module-weighing-service — elegibilidade NF-e (UT-000715)', () => {
  it('getModuleWeighingNfeEligibility chama module-weighings/{uuid}/nfe e devolve o envelope tipado', async () => {
    const result = await getModuleWeighingNfeEligibility('mw-uuid-1');

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock.mock.calls[0][0]).toBe('/module-weighings/mw-uuid-1/nfe');
    expect(result).toEqual(ENVELOPE);
    expect(result.data.gross_weight).toBe('45000.00');
    expect(result.data.net_weight).toBe('30000.00');
    expect(result.data.items[0].product_uuid).toBe('prod-uuid-1');
  });

  it('propaga o erro de elegibilidade (4xx) sem engolir', async () => {
    const failure = { success: false, message: 'Pesagem inelegível', errors: null };
    getMock.mockRejectedValueOnce(failure);

    await expect(getModuleWeighingNfeEligibility('mw-uuid-2')).rejects.toBe(failure);
  });
});
