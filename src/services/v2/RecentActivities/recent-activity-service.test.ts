// UT-000690 / TASK-092-FE-01 — T-FE-01.01/02: adaptador do envelope paginado e
// serialização de `types[]` (AD-FE-05).

import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn<(...args: any[]) => Promise<{ data: any }>>();

vi.mock('@/services/api', () => ({
  default: { V2: { get: (...args: any[]) => getMock(...args) } },
}));

import { listRecentActivities, listRecentActivityTypes } from './recent-activity-service';

const item = {
  type: 'death_animal',
  type_label: 'Mortes',
  uuid: 'u-1',
  created_at: '2026-10-05T13:42:10.000000Z',
  farm: { uuid: 'f-1', name: 'Fazenda Boa Vista' },
  api_path: '/api/v1/death-animals/u-1',
  spa_path: '/operacional/mortes/u-1/detalhe',
};

describe('recent-activity-service', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('T-FE-01.01 — adapta o envelope para items + pagination a partir do meta', async () => {
    getMock.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [item],
        errors: null,
        meta: { current_page: 2, last_page: 4, per_page: 15, total: 52 },
      },
    });

    const result = await listRecentActivities({ page: 2, per_page: 15 });

    expect(getMock).toHaveBeenCalledWith('/recent-activities', expect.any(Object));
    expect(result.data.items).toEqual([item]);
    expect(result.data.pagination).toEqual({
      total: 52,
      count: 1,
      per_page: 15,
      current_page: 2,
      total_pages: 4,
    });
  });

  it('T-FE-01.02 — envia types só quando não vazio, omite chaves vazias e nunca farm_uuids', async () => {
    getMock.mockResolvedValue({
      data: { success: true, message: '', data: [], errors: null, meta: null },
    });

    await listRecentActivities({
      page: 1,
      per_page: 10,
      types: ['death_animal', 'weighing'],
      start_date: '',
      end_date: '2026-10-05',
    });
    const withTypes = getMock.mock.calls[0][1];
    expect(withTypes.types).toEqual(['death_animal', 'weighing']);
    expect(withTypes.start_date).toBeUndefined();
    expect(withTypes).not.toHaveProperty('farm_uuids');

    const uri = axios.getUri({ url: '/recent-activities', params: withTypes });
    // axios mantém os colchetes literais (`types[]=`), formato aceito pelo Laravel.
    expect(uri).toContain('types[]=death_animal&types[]=weighing');
    expect(uri).toContain('end_date=2026-10-05');
    expect(uri).not.toContain('start_date');

    getMock.mockClear();
    await listRecentActivities({ page: 1, per_page: 10, types: [] });
    const withoutTypes = getMock.mock.calls[0][1];
    expect(withoutTypes.types).toBeUndefined();
    expect(axios.getUri({ url: '/recent-activities', params: withoutTypes })).not.toContain(
      'types'
    );
  });

  it('listRecentActivityTypes desempacota data', async () => {
    getMock.mockResolvedValue({
      data: {
        success: true,
        message: '',
        data: [{ value: 'death_animal', label: 'Mortes' }],
        errors: null,
        meta: null,
      },
    });

    await expect(listRecentActivityTypes()).resolves.toEqual([
      { value: 'death_animal', label: 'Mortes' },
    ]);
    expect(getMock).toHaveBeenCalledWith('/recent-activities/types');
  });
});
