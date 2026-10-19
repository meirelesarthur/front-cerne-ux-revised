// UT-000795 — serviços de options da Apropriação Direta: parâmetros novos são
// OPT-IN (sem eles a requisição é idêntica à anterior) e endpoints corretos.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();

vi.mock('@/services/api', () => ({
  default: { V2: { get: (...args: unknown[]) => getMock(...args) } },
}));

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import {
  listAreaOptions,
  listAreaOptionsForExpense,
} from '@/services/v2/BaseRegistrations/areas-service';
import { listGrazingOptions } from '@/services/v2/BaseRegistrations/grazings-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';

import {
  listExpenseActivityOptions,
  listExpenseAppropriationTypeOptions,
  listExpenseOperationOptions,
} from './expense-service';

const flat = (data: unknown[] = []) => ({
  data: { success: true, message: 'ok', data, errors: null, meta: null },
});

beforeEach(() => {
  getMock.mockReset().mockResolvedValue(flat());
});

describe('tipos de apropriação e operação/atividade de Contas a Pagar', () => {
  it('GET /expenses/appropriation-types/options devolve o envelope', async () => {
    getMock.mockResolvedValue(flat([{ value: 3, label: 'Área' }]));
    const response = await listExpenseAppropriationTypeOptions();
    expect(getMock).toHaveBeenCalledWith('/expenses/appropriation-types/options');
    expect(response.data).toEqual([{ value: 3, label: 'Área' }]);
  });

  it('operações: GET /operations/options sem `category`', async () => {
    await listExpenseOperationOptions({ page: 1, per_page: 10, search: 'vac' });
    expect(getMock).toHaveBeenCalledWith('/operations/options', {
      page: 1,
      per_page: 10,
      search: 'vac',
    });
  });

  it('atividades: GET /activities/options por operation_uuid (uuid, nunca id)', async () => {
    await listExpenseActivityOptions({ page: 1, operation_uuid: 'op-1' });
    expect(getMock).toHaveBeenCalledWith('/activities/options', {
      page: 1,
      per_page: undefined,
      search: undefined,
      operation_uuid: 'op-1',
    });
  });
});

describe('Área', () => {
  it('listAreaOptionsForExpense: sem include_disabled; without_grazing só quando pedido', async () => {
    await listAreaOptionsForExpense({ search: 'p', withoutGrazing: true });
    expect(getMock).toHaveBeenLastCalledWith('/areas/options', {
      search: 'p',
      without_grazing: 1,
    });
    await listAreaOptionsForExpense({ search: 'p' });
    const params = getMock.mock.calls[1][1];
    expect(params.without_grazing).toBeUndefined();
    expect(params).not.toHaveProperty('include_disabled', true);
  });

  it('listAreaOptions (filtro de Lote/Área) continua fixando include_disabled', async () => {
    await listAreaOptions({ search: 'x' });
    expect(getMock).toHaveBeenCalledWith('/areas/options', {
      search: 'x',
      include_disabled: true,
    });
  });
});

describe('Módulo', () => {
  it('GET /grazings/options FLAT adaptado a 1 página', async () => {
    getMock.mockResolvedValue(flat([{ uuid: 'g1', description: 'Módulo A' }]));
    const page = await listGrazingOptions({ search: 'm' });
    expect(getMock).toHaveBeenCalledWith('/grazings/options', { search: 'm' });
    expect(page.data.items).toEqual([{ uuid: 'g1', description: 'Módulo A' }]);
    expect(page.data.pagination.total_pages).toBe(1);
  });
});

describe('Lote (listBatchOptionsForForm)', () => {
  it('sem area/grazing: params idênticos ao anterior (+ chaves undefined)', async () => {
    await listBatchOptionsForForm({ search: 'l' });
    const params = getMock.mock.calls[0][1];
    expect(params).toMatchObject({ search: 'l', include_empty: 0 });
    expect(params.area_uuid).toBeUndefined();
    expect(params.grazing_uuid).toBeUndefined();
  });

  it('com areaUuid/grazingUuid envia area_uuid/grazing_uuid e mantém include_empty=0', async () => {
    await listBatchOptionsForForm({ areaUuid: 'a-1' });
    expect(getMock.mock.calls[0][1]).toMatchObject({ area_uuid: 'a-1', include_empty: 0 });
    await listBatchOptionsForForm({ grazingUuid: 'g-1' });
    expect(getMock.mock.calls[1][1]).toMatchObject({ grazing_uuid: 'g-1', include_empty: 0 });
  });

  it('mantém o filtro defensivo uuid !== "0"', async () => {
    getMock.mockResolvedValue(
      flat([
        { uuid: '0', label: 'Sem lote' },
        { uuid: 'b-1', label: 'Lote 1' },
      ])
    );
    const page = await listBatchOptionsForForm({ areaUuid: 'a-1' });
    expect(page.data.items).toEqual([{ uuid: 'b-1', label: 'Lote 1' }]);
  });
});

describe('Animal (listAnimalOptions)', () => {
  it('statuses só sai quando pedido', async () => {
    await listAnimalOptions({ batch_uuid: 'b-1' });
    expect(getMock.mock.calls[0][1].statuses).toBeUndefined();
    await listAnimalOptions({ batch_uuid: 'b-1', statuses: ['A', 'P'], per_page: 100 });
    expect(getMock.mock.calls[1][1]).toMatchObject({
      batch_uuid: 'b-1',
      statuses: ['A', 'P'],
      per_page: 100,
    });
    await listAnimalOptions({ batch_uuid: 'b-1', statuses: [] });
    expect(getMock.mock.calls[2][1].statuses).toBeUndefined();
  });
});

describe('Equipamento (listEquipmentCatalogOptions)', () => {
  it('purpose=expense-maintenance é repassado; sem purpose a requisição não o envia', async () => {
    await listEquipmentCatalogOptions({
      per_page: 100,
      search: 't',
      purpose: 'expense-maintenance',
    });
    expect(getMock.mock.calls[0][1]).toMatchObject({
      per_page: 100,
      search: 't',
      purpose: 'expense-maintenance',
    });
    await listEquipmentCatalogOptions({ per_page: 10 });
    expect(getMock.mock.calls[1][1].purpose).toBeUndefined();
  });

  it('preserva family/uses_mileage devolvidos pela API', async () => {
    getMock.mockResolvedValue(
      flat([
        {
          uuid: 'e1',
          code: 'EQ',
          description: 'Caminhão',
          family: { uuid: 'f', description: 'Veículos' },
          uses_mileage: true,
        },
      ])
    );
    const page = await listEquipmentCatalogOptions({ purpose: 'expense-maintenance' });
    expect(page.data.items[0].uses_mileage).toBe(true);
    expect(page.data.items[0].family?.description).toBe('Veículos');
  });
});
