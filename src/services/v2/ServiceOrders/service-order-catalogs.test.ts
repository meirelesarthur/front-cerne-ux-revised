// Execução 086, FE-02 — os catálogos do form de OS chamam os endpoints novos
// (`/options` por finalidade, sem o gate do CRUD) e `POST .../cancel`.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock('@/services/api', () => ({
  default: {
    V2: {
      get: (...args: unknown[]) => getMock(...args),
      post: (...args: unknown[]) => postMock(...args),
    },
  },
}));

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import {
  listStockAvailability,
  listStockAvailableOptions,
} from '@/services/v2/Stocks/stock-service';

import { cancelServiceOrder } from './service-order-service';

const flat = {
  data: { success: true, message: 'ok', data: [{ uuid: 'u' }], errors: null, meta: null },
};

describe('catálogos do form de Ordem de Serviço', () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue(flat);
    postMock.mockReset().mockResolvedValue({ data: { success: true, data: {} } });
  });

  it('insumo/estoque → GET /stocks/available-options (mesmos params; /stocks/available intacto)', async () => {
    await listStockAvailableOptions({
      warehouse_uuid: 'wh-1',
      search: 'gli',
      allow_pointing: true,
    });
    expect(getMock).toHaveBeenCalledWith('/stocks/available-options', {
      warehouse_uuid: 'wh-1',
      search: 'gli',
      product_uuid: undefined,
      allow_pointing: true,
      protocol: undefined,
    });

    getMock.mockClear();
    await listStockAvailability({ warehouse_uuid: 'wh-1' });
    expect(getMock.mock.calls[0][0]).toBe('/stocks/available');
  });

  it('EPI → GET /products/options?purpose=epi', async () => {
    await listProductOptions({ search: 'luva', purpose: 'epi' });
    expect(getMock.mock.calls[0][0]).toBe('/products/options');
    expect(getMock.mock.calls[0][1]).toMatchObject({ search: 'luva', purpose: 'epi' });
  });

  it('sem purpose o catálogo de produtos não envia o param (sem regressão)', async () => {
    await listProductOptions({ search: 'x' });
    expect(getMock.mock.calls[0][1].purpose).toBeUndefined();
  });

  it('máquina → GET /equipments/options?purpose=service-order', async () => {
    await listEquipmentCatalogOptions({ search: 'trator', purpose: 'service-order' });
    expect(getMock.mock.calls[0][0]).toBe('/equipments/options');
    expect(getMock.mock.calls[0][1]).toMatchObject({ search: 'trator', purpose: 'service-order' });
  });

  it('colaborador → GET /employees/options', async () => {
    await listEmployeeOptions({ search: 'mar' });
    expect(getMock.mock.calls[0][0]).toBe('/employees/options');
    expect(getMock.mock.calls[0][1]).toEqual({ search: 'mar' });
  });

  it('fornecedor → GET /providers/options?type=3', async () => {
    await listProviderOptions({ search: 'pre', type: 3 });
    expect(getMock.mock.calls[0][0]).toBe('/providers/options');
    expect(getMock.mock.calls[0][1]).toMatchObject({ search: 'pre', type: 3 });
  });

  it('cancelar → POST /service-orders/{uuid}/cancel com { cancellation_reason }', async () => {
    await cancelServiceOrder('os-1', { cancellation_reason: 'Chuva forte' });
    expect(postMock).toHaveBeenCalledWith('/service-orders/os-1/cancel', {
      cancellation_reason: 'Chuva forte',
    });
  });
});
