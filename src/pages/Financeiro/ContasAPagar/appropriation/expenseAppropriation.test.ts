// UT-000795 — lógica pura da Apropriação Direta Pecuária/Manutenção.
import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import type { ExpenseAppropriationDetail } from '@/@types/v2/Financeiro/expense';

import {
  buildAppropriationPayload,
  EMPTY_APPROPRIATION_FIELDS,
  extractAppropriationErrors,
  hydrateAppropriationDetail,
  isProviderRequiredForAppropriation,
} from './expenseAppropriation';

const opt = (value: string, label = value) => ({ label, value });

function form(overrides: Record<string, unknown> = {}) {
  return {
    appropriation: { label: 'Direta', value: 1 },
    appropriation_type: null,
    aprop_agri_area_uuid: null,
    aprop_agri_activity_uuid: null,
    aprop_agri_operation_uuid: null,
    aprop_agri_cultivation_uuid: null,
    ...EMPTY_APPROPRIATION_FIELDS,
    ...overrides,
  } as any;
}

const PEC_KEYS = [
  'aprop_pec_area_uuid',
  'aprop_pec_grazing_uuid',
  'aprop_pec_batch_uuid',
  'aprop_pec_animal_uuid',
  'aprop_pec_operation_uuid',
  'aprop_pec_activity_uuid',
];
const MAN_KEYS = ['aprop_man_equipment_uuid', 'aprop_man_hour_meter', 'aprop_man_mileage'];
const AGRI_KEYS = [
  'aprop_agri_area_uuid',
  'aprop_agri_activity_uuid',
  'aprop_agri_operation_uuid',
  'aprop_agri_cultivation_uuid',
];

describe('buildAppropriationPayload', () => {
  it('Pecuária: 6 chaves aprop_pec_* com uuid/null; nenhuma man/agri; sem string vazia', () => {
    const payload = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Pecuária', value: 2 },
        aprop_pec_area_uuid: opt('area-1'),
        aprop_pec_batch_uuid: opt('batch-1'),
        aprop_pec_operation_uuid: opt('op-1'),
        aprop_pec_activity_uuid: opt('act-1'),
      })
    ) as Record<string, unknown>;
    expect(payload).toEqual({
      appropriation: 1,
      appropriation_type: 2,
      aprop_pec_area_uuid: 'area-1',
      aprop_pec_grazing_uuid: null,
      aprop_pec_batch_uuid: 'batch-1',
      aprop_pec_animal_uuid: null,
      aprop_pec_operation_uuid: 'op-1',
      aprop_pec_activity_uuid: 'act-1',
    });
    [...MAN_KEYS, ...AGRI_KEYS].forEach((k) => expect(payload).not.toHaveProperty(k));
    Object.values(payload).forEach((v) => expect(v).not.toBe(''));
  });

  it('Pecuária: Área e Módulo nunca vão juntos', () => {
    const payload = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Pecuária', value: 2 },
        aprop_pec_area_uuid: opt('area-1'),
        aprop_pec_grazing_uuid: opt('graz-1'),
        aprop_pec_operation_uuid: opt('op-1'),
        aprop_pec_activity_uuid: opt('act-1'),
      })
    );
    expect(payload.aprop_pec_area_uuid).toBe('area-1');
    expect(payload.aprop_pec_grazing_uuid).toBeNull();
  });

  it('Pecuária: só Módulo é enviado quando não há Área', () => {
    const payload = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Pecuária', value: 2 },
        aprop_pec_grazing_uuid: opt('graz-1'),
      })
    );
    expect(payload.aprop_pec_area_uuid).toBeNull();
    expect(payload.aprop_pec_grazing_uuid).toBe('graz-1');
  });

  it('Manutenção com horímetro: envia hour_meter (1 casa) e NÃO envia mileage', () => {
    const payload = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Manutenção', value: 4 },
        aprop_man_equipment_uuid: { ...opt('eq-1'), uses_mileage: false },
        aprop_man_hour_meter: 1234.5,
        aprop_man_mileage: 99,
      })
    ) as Record<string, unknown>;
    expect(payload).toEqual({
      appropriation: 1,
      appropriation_type: 4,
      aprop_man_equipment_uuid: 'eq-1',
      aprop_man_hour_meter: 1234.5,
    });
    expect(payload).not.toHaveProperty('aprop_man_mileage');
    PEC_KEYS.forEach((k) => expect(payload).not.toHaveProperty(k));
  });

  it('Manutenção com Km: envia mileage inteiro e NÃO envia hour_meter', () => {
    const payload = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Manutenção', value: 4 },
        aprop_man_equipment_uuid: { ...opt('eq-2'), uses_mileage: true },
        aprop_man_hour_meter: 10.5,
        aprop_man_mileage: 45210,
      })
    ) as Record<string, unknown>;
    expect(payload.aprop_man_mileage).toBe(45210);
    expect(payload).not.toHaveProperty('aprop_man_hour_meter');
  });

  it('Manutenção: zero é valor válido e é enviado', () => {
    const hour = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Manutenção', value: 4 },
        aprop_man_equipment_uuid: { ...opt('eq-1'), uses_mileage: false },
        aprop_man_hour_meter: 0,
      })
    );
    expect(hour.aprop_man_hour_meter).toBe(0);
    const km = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Manutenção', value: 4 },
        aprop_man_equipment_uuid: { ...opt('eq-2'), uses_mileage: true },
        aprop_man_mileage: 0,
      })
    );
    expect(km.aprop_man_mileage).toBe(0);
  });

  it('Manutenção: horímetro sem ×10 (H2) e arredondado a 1 casa', () => {
    const payload = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Manutenção', value: 4 },
        aprop_man_equipment_uuid: opt('eq-1'),
        aprop_man_hour_meter: 1234.54,
      })
    );
    expect(payload.aprop_man_hour_meter).toBe(1234.5);
  });

  it('Indireta: só modalidade; tipo nulo; nenhuma aprop_*', () => {
    const payload = buildAppropriationPayload(
      form({
        appropriation: { label: 'Indireta', value: 2 },
        appropriation_type: { label: 'Pecuária', value: 2 },
        aprop_pec_operation_uuid: opt('op-1'),
      })
    );
    expect(payload).toEqual({ appropriation: 2, appropriation_type: null });
  });

  it('Direta + Área: sem chaves aprop_*', () => {
    const payload = buildAppropriationPayload(
      form({ appropriation_type: { label: 'Área', value: 3 } })
    );
    expect(payload).toEqual({ appropriation: 1, appropriation_type: 3 });
  });

  it('Agricultura: as 4 chaves aprop_agri_* idênticas ao payload anterior (regressão)', () => {
    const payload = buildAppropriationPayload(
      form({
        appropriation_type: { label: 'Agricultura', value: 1 },
        aprop_agri_area_uuid: opt('a'),
        aprop_agri_activity_uuid: opt('b'),
        aprop_agri_operation_uuid: null,
        aprop_agri_cultivation_uuid: opt('d'),
      })
    ) as Record<string, unknown>;
    expect(payload).toEqual({
      appropriation: 1,
      appropriation_type: 1,
      aprop_agri_area_uuid: 'a',
      aprop_agri_activity_uuid: 'b',
      aprop_agri_operation_uuid: null,
      aprop_agri_cultivation_uuid: 'd',
    });
    [...PEC_KEYS, ...MAN_KEYS].forEach((k) => expect(payload).not.toHaveProperty(k));
  });
});

describe('isProviderRequiredForAppropriation', () => {
  it('verdadeiro para Direta + 1/2/4', () => {
    expect(isProviderRequiredForAppropriation(1, 1)).toBe(true);
    expect(isProviderRequiredForAppropriation(1, 2)).toBe(true);
    expect(isProviderRequiredForAppropriation(1, 4)).toBe(true);
  });
  it('falso para Direta + Área e para Indireta', () => {
    expect(isProviderRequiredForAppropriation(1, 3)).toBe(false);
    expect(isProviderRequiredForAppropriation(1, null)).toBe(false);
    expect(isProviderRequiredForAppropriation(2, 2)).toBe(false);
    expect(isProviderRequiredForAppropriation(undefined, undefined)).toBe(false);
  });
});

const livestockFull: ExpenseAppropriationDetail = {
  type: 2,
  livestock: {
    uuid: 'pasture-1',
    code: '0007',
    status: 'F',
    date: '2026-10-14',
    amount: 1500.0,
    area: { uuid: 'area-1', description: 'Pasto 1' },
    grazing: { uuid: 'graz-1', description: 'Módulo A' },
    batch: { uuid: 'batch-1', description: 'Lote Engorda 12' },
    animal: { uuid: 'animal-1', identification: 'BR123 - 0045' },
    operation: { uuid: 'op-1', name: 'Vacinação' },
    activity: { uuid: 'act-1', name: 'Aplicação' },
  },
  maintenance: null,
};

describe('hydrateAppropriationDetail', () => {
  it('Pecuária completa vira option única {label,value}', () => {
    const result = hydrateAppropriationDetail(livestockFull);
    expect(result.aprop_pec_area_uuid).toEqual({ label: 'Pasto 1', value: 'area-1' });
    expect(result.aprop_pec_grazing_uuid).toEqual({ label: 'Módulo A', value: 'graz-1' });
    expect(result.aprop_pec_batch_uuid).toEqual({ label: 'Lote Engorda 12', value: 'batch-1' });
    expect(result.aprop_pec_animal_uuid).toEqual({ label: 'BR123 - 0045', value: 'animal-1' });
    expect(result.aprop_pec_operation_uuid).toEqual({ label: 'Vacinação', value: 'op-1' });
    expect(result.aprop_pec_activity_uuid).toEqual({ label: 'Aplicação', value: 'act-1' });
    expect(result.aprop_man_equipment_uuid).toBeNull();
    expect(result.aprop_man_hour_meter).toBeNull();
    expect(result.aprop_man_mileage).toBeNull();
  });

  it('Pecuária mínima: só Operação + Atividade; demais null', () => {
    const result = hydrateAppropriationDetail({
      ...livestockFull,
      livestock: {
        ...livestockFull.livestock!,
        area: null,
        grazing: null,
        batch: null,
        animal: null,
      },
    });
    expect(result.aprop_pec_area_uuid).toBeNull();
    expect(result.aprop_pec_grazing_uuid).toBeNull();
    expect(result.aprop_pec_batch_uuid).toBeNull();
    expect(result.aprop_pec_animal_uuid).toBeNull();
    expect(result.aprop_pec_operation_uuid?.value).toBe('op-1');
    expect(result.aprop_pec_activity_uuid?.value).toBe('act-1');
  });

  const maintenance = (
    usesMileage: boolean,
    hour: number,
    km: number
  ): ExpenseAppropriationDetail => ({
    type: 4,
    livestock: null,
    maintenance: {
      uuid: 'm-1',
      code: '0003',
      status: 'F',
      date: '2026-10-14',
      amount: 1500,
      equipment: {
        uuid: 'eq-1',
        code: 'EQ-001',
        description: 'Trator John Deere',
        family: { uuid: 'fam-1', description: 'Veículos' },
        uses_mileage: usesMileage,
      },
      hour_meter: hour,
      mileage: km,
      note: 'nota',
    },
  });

  it('Manutenção horímetro: só hour_meter hidratado; mileage null; sem ×10', () => {
    const result = hydrateAppropriationDetail(maintenance(false, 1234.5, 0));
    expect(result.aprop_man_equipment_uuid).toEqual({
      label: 'Trator John Deere',
      value: 'eq-1',
      uses_mileage: false,
    });
    expect(result.aprop_man_hour_meter).toBe(1234.5);
    expect(result.aprop_man_mileage).toBeNull();
    // H2: passado ao payload, continua 1234.5
    const payload = buildAppropriationPayload(
      form({ appropriation_type: { label: 'M', value: 4 }, ...result })
    );
    expect(payload.aprop_man_hour_meter).toBe(1234.5);
  });

  it('Manutenção Km (hour_meter 0 na API): exibe só Km', () => {
    const result = hydrateAppropriationDetail(maintenance(true, 0, 45210));
    expect(result.aprop_man_mileage).toBe(45210);
    expect(result.aprop_man_hour_meter).toBeNull();
    expect(result.aprop_man_equipment_uuid?.uses_mileage).toBe(true);
  });

  it('horímetro 0 hidratado permanece 0 (não vira null)', () => {
    const result = hydrateAppropriationDetail(maintenance(false, 0, 0));
    expect(result.aprop_man_hour_meter).toBe(0);
  });

  it('null e undefined devolvem tudo null', () => {
    expect(hydrateAppropriationDetail(null)).toEqual(EMPTY_APPROPRIATION_FIELDS);
    expect(hydrateAppropriationDetail(undefined)).toEqual(EMPTY_APPROPRIATION_FIELDS);
    Object.values(EMPTY_APPROPRIATION_FIELDS).forEach((v) => expect(v).toBeNull());
  });
});

describe('extractAppropriationErrors', () => {
  function error422(errors: Record<string, string[]>) {
    return new AxiosError('x', '422', undefined, undefined, {
      status: 422,
      data: { errors },
    } as any);
  }

  it('mapeia chaves planas do 422 por campo e ignora as demais', () => {
    const result = extractAppropriationErrors(
      error422({
        aprop_pec_operation_uuid: ['A operação é obrigatória.'],
        aprop_man_hour_meter: ['Horímetro inválido.'],
        provider_uuid: ['Fornecedor obrigatório.'],
        note: ['ignorado'],
      })
    );
    expect(result).toEqual([
      { key: 'aprop_pec_operation_uuid', message: 'A operação é obrigatória.' },
      { key: 'aprop_man_hour_meter', message: 'Horímetro inválido.' },
      { key: 'provider_uuid', message: 'Fornecedor obrigatório.' },
    ]);
  });

  it('não-422 e erros não-axios devolvem []', () => {
    const e500 = new AxiosError('x', '500', undefined, undefined, {
      status: 500,
      data: { errors: { aprop_pec_operation_uuid: ['x'] } },
    } as any);
    expect(extractAppropriationErrors(e500)).toEqual([]);
    expect(extractAppropriationErrors(new Error('boom'))).toEqual([]);
    expect(extractAppropriationErrors(undefined)).toEqual([]);
  });
});
