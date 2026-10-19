import { describe, expect, it, vi } from 'vitest';

const byCategorySpy = vi.fn();
let byCategoryImpl: (uuid: string) => Promise<unknown> = async () => ({ data: [] });
const listCostCentersByCategory = {
  setResolved: (v: unknown) => {
    byCategoryImpl = async () => v;
  },
  setFailing: () => {
    byCategoryImpl = () => Promise.reject(new Error('x'));
  },
};
vi.mock('@/services/v2/CostCenters/cost-center-service', () => ({
  listCostCentersByCategory: (uuid: string, params?: unknown) => {
    byCategorySpy(uuid, params);
    return byCategoryImpl(uuid);
  },
}));

const { buildAllocationCostCenterParams, mapCostCenterRefToOption, resolveCascadeCostCenter } =
  await import('./allocationCostCenter');

describe('allocationCostCenter', () => {
  it('params do catálogo: scope=allocation, sem farm_uuid/only_analytic/is_enabled', () => {
    const build = buildAllocationCostCenterParams();
    expect(build('abc')).toEqual({ search: 'abc', scope: 'allocation' });
    expect(build({ search: 'x' })).toEqual({ search: 'x', scope: 'allocation' });
  });

  it('map para Option "código — descrição"', () => {
    expect(mapCostCenterRefToOption({ uuid: 'u', code: '01', description: 'A' })).toEqual({
      label: '01 — A',
      value: 'u',
    });
  });

  it('resolveCascade devolve o primeiro de by-category', async () => {
    listCostCentersByCategory.setResolved({
      data: [
        { uuid: 'u1', code: '01', description: 'A' },
        { uuid: 'u2', code: '02', description: 'B' },
      ],
    });
    expect(await resolveCascadeCostCenter('cat')).toEqual({ label: '01 — A', value: 'u1' });
    expect(byCategorySpy).toHaveBeenCalledWith('cat', { scope: 'allocation' });
  });

  it('sem centros ou falha de rede => null', async () => {
    listCostCentersByCategory.setResolved({ data: [] });
    expect(await resolveCascadeCostCenter('cat')).toBeNull();
    listCostCentersByCategory.setFailing();
    expect(await resolveCascadeCostCenter('cat')).toBeNull();
  });
});
