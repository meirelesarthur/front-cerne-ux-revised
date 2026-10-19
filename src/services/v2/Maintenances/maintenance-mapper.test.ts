/* eslint-disable camelcase -- campos snake_case do contrato da API */
import { describe, expect, it } from 'vitest';

import type { MaintenanceDetailApi, MaintenanceItemApi } from '@/@types/v2/Maintenances';

import {
  canShowGenerateFinancial,
  mapMaintenanceDetail,
  mapMaintenanceItem,
  mapMaintenanceItemToForm,
} from './maintenance-mapper';

function apiItem(overrides: Partial<MaintenanceItemApi> = {}): MaintenanceItemApi {
  return {
    equipment: { uuid: 'eq-1', description: 'Trator' },
    hour_meter: null,
    mileage: null,
    warehouse: null,
    product: null,
    measurement: null,
    quantity: null,
    amount: null,
    total_amount: null,
    executor: null,
    note: null,
    ...overrides,
  };
}

describe('mapMaintenanceItem', () => {
  it('mapeia executor funcionário para campos planos', () => {
    const result = mapMaintenanceItem(
      apiItem({
        executor: {
          type: 'employee',
          employee: { uuid: 'emp-1', name: 'João' },
          quantity: '2.5',
          amount: 40,
          total_amount: '100.00',
        },
      })
    );

    expect(result.executor_type).toBe('employee');
    expect(result.employee).toEqual({ uuid: 'emp-1', name: 'João' });
    expect(result.provider).toBeNull();
    expect(result.employee_quantity).toBe(2.5);
    expect(result.employee_amount).toBe(40);
    expect(result.employee_total_amount).toBe(100);
    expect(result.provider_total).toBeNull();
  });

  it('mapeia executor fornecedor: total_amount vai para custo e provider_total', () => {
    const result = mapMaintenanceItem(
      apiItem({
        executor: {
          type: 'provider',
          provider: { uuid: 'prov-1', name: 'Oficina' },
          total_amount: 350.5,
        },
      })
    );

    expect(result.executor_type).toBe('provider');
    expect(result.provider).toEqual({ uuid: 'prov-1', name: 'Oficina' });
    expect(result.employee).toBeNull();
    expect(result.employee_total_amount).toBe(350.5);
    expect(result.provider_total).toBe(350.5);
    expect(result.employee_quantity).toBeNull();
  });

  it('fornecedor com provider:null mantém provider null sem lançar', () => {
    const result = mapMaintenanceItem(
      apiItem({ executor: { type: 'provider', provider: null, total_amount: 10 } })
    );

    expect(result.executor_type).toBe('provider');
    expect(result.provider).toBeNull();
  });

  it('executor null zera todos os campos de executor', () => {
    const result = mapMaintenanceItem(apiItem({ executor: null }));

    expect(result.executor_type).toBeNull();
    expect(result.employee).toBeNull();
    expect(result.provider).toBeNull();
    expect(result.employee_quantity).toBeNull();
    expect(result.employee_amount).toBeNull();
    expect(result.employee_total_amount).toBeNull();
    expect(result.provider_total).toBeNull();
  });

  it('converte números vindos como string e não inventa uuid de item', () => {
    const result = mapMaintenanceItem(
      apiItem({
        hour_meter: '120.5',
        mileage: 300,
        quantity: '3.000',
        amount: '9.9',
        total_amount: '29.7',
      })
    );

    expect(result.hour_meter).toBe(120.5);
    expect(result.mileage).toBe(300);
    expect(result.quantity).toBe(3);
    expect(result.amount).toBe(9.9);
    expect(result.total_amount).toBeCloseTo(29.7);
    expect(result).not.toHaveProperty('uuid');
  });
});

describe('mapMaintenanceDetail', () => {
  const base: MaintenanceDetailApi = {
    uuid: 'm-1',
    code: 'MNT-1',
    date: '2026-01-01',
    requester: null,
    items: [apiItem()],
  };

  it('has_financial ausente vira false', () => {
    expect(mapMaintenanceDetail(base).has_financial).toBe(false);
  });

  it('preserva has_financial true e normaliza os itens', () => {
    const result = mapMaintenanceDetail({
      ...base,
      has_financial: true,
      items: [
        apiItem({
          executor: { type: 'provider', provider: { uuid: 'p', name: 'P' }, total_amount: 1 },
        }),
      ],
    });

    expect(result.has_financial).toBe(true);
    expect(result.items[0].executor_type).toBe('provider');
  });
});

describe('mapMaintenanceItemToForm (hidratação da Edição)', () => {
  const labels = { employee: 'Funcionário', provider: 'Fornecedor' };

  it('preserva executor funcionário e horas', () => {
    const item = mapMaintenanceItem(
      apiItem({
        executor: {
          type: 'employee',
          employee: { uuid: 'emp-1', name: 'João' },
          quantity: 2,
          amount: 10,
          total_amount: 20,
        },
      })
    );
    const form = mapMaintenanceItemToForm(item, labels);

    expect(form.executor_type).toEqual({ value: 'employee', label: 'Funcionário' });
    expect(form.employee_uuid).toEqual({ value: 'emp-1', label: 'João' });
    expect(form.employee_quantity).toBe(2);
    expect(form.provider_uuid).toBeNull();
  });

  it('preserva executor fornecedor e valor', () => {
    const item = mapMaintenanceItem(
      apiItem({
        executor: {
          type: 'provider',
          provider: { uuid: 'prov-1', name: 'Oficina' },
          total_amount: 99,
        },
      })
    );
    const form = mapMaintenanceItemToForm(item, labels);

    expect(form.executor_type).toEqual({ value: 'provider', label: 'Fornecedor' });
    expect(form.provider_uuid).toEqual({ value: 'prov-1', label: 'Oficina' });
    expect(form.provider_total).toBe(99);
    expect(form.equipment_uuid).toEqual({ value: 'eq-1', label: 'Trator' });
  });

  it('sem executor mantém campos nulos', () => {
    const form = mapMaintenanceItemToForm(mapMaintenanceItem(apiItem()), labels);

    expect(form.executor_type).toBeNull();
    expect(form.employee_uuid).toBeNull();
    expect(form.provider_uuid).toBeNull();
  });
});

describe('canShowGenerateFinancial (botão da Visualização)', () => {
  const detail = (item: MaintenanceItemApi, has_financial?: boolean) =>
    mapMaintenanceDetail({
      uuid: 'm',
      code: 'C',
      date: '2026-01-01',
      requester: null,
      has_financial,
      items: [item],
    });
  const provider = apiItem({
    executor: { type: 'provider', provider: { uuid: 'p', name: 'P' }, total_amount: 5 },
  });
  const employee = apiItem({
    executor: {
      type: 'employee',
      employee: { uuid: 'e', name: 'E' },
      quantity: 1,
      amount: 1,
      total_amount: 1,
    },
  });

  it('só funcionário: sem botão', () => {
    expect(canShowGenerateFinancial(detail(employee), true)).toBe(false);
  });

  it('fornecedor sem despesa: com botão (e sem permissão: sem botão)', () => {
    expect(canShowGenerateFinancial(detail(provider), true)).toBe(true);
    expect(canShowGenerateFinancial(detail(provider), false)).toBe(false);
  });

  it('fornecedor com has_financial: sem botão', () => {
    expect(canShowGenerateFinancial(detail(provider, true), true)).toBe(false);
  });
});
