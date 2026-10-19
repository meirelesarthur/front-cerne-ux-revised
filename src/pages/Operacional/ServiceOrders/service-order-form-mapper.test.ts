// Execução 086, FE-02 — hidratação dos 5 blocos da OS no edit e round-trip
// mapper → form → payload (o PUT é replace: nenhuma linha pode sumir).
import { describe, expect, it } from 'vitest';

import { languageServiceOrders } from '@/constants/languages/languagePtBr/languageServiceOrders';
import { getServiceOrderCategoryOptions } from '@/constants/serviceOrders/options/service-order-category-options';
import { serviceOrderLaborTypeOptions } from '@/constants/serviceOrders/options/service-order-labor-type-options';

import { serviceOrderSchema } from '@/validations/schemas/ServiceOrders/service-order-schema';

import type { LanguageDate } from '@/@types/language';
import type { ServiceOrderDetail } from '@/@types/v2/ServiceOrders';

import {
  mapServiceOrderDetailToFormValues,
  measurementLabel,
  warehouseLabel,
} from './service-order-form-mapper';
import {
  buildServiceOrderPayload,
  findFirstLineError,
  ServiceOrderIncompleteLineError,
} from './service-order-payload';
import { computeQuantityPerArea, computeTotalQuantity } from './service-order-product-quantity';

const languageGB = { serviceOrders: languageServiceOrders } as unknown as LanguageDate;
const categoryOptions = getServiceOrderCategoryOptions(languageGB);
const laborTypeOptions = serviceOrderLaborTypeOptions.options(languageGB);

function detailFixture(overrides: Partial<ServiceOrderDetail> = {}): ServiceOrderDetail {
  return {
    uuid: 'os-1',
    code: '000123',
    dt_emission: '2026-09-01',
    execution_date: '2026-09-05',
    deadline: '2026-09-10',
    category: 2,
    category_label: 'Agricultura',
    status: { value: 1, label: 'Aberta', color: '#858796' },
    weather_requirements: null,
    minimum_temperature: null,
    maximum_temperature: null,
    allowed_working_period_start: null,
    allowed_working_period_end: null,
    environmental_restrictions: null,
    legal_compliance: null,
    service_description: 'Aplicar defensivo',
    expected_result_description: null,
    success_criteria_description: null,
    roadmap_description: null,
    execution_start_date: null,
    execution_end_date: null,
    execution_problems: null,
    corrective_actions: null,
    assessment_grade: null,
    rating_date: null,
    feedback: null,
    recommendations: null,
    area: { uuid: 'area-1', name: 'Talhão 1', description: 'Talhão 1', productive_area: 10 },
    operation: { uuid: 'op-1', name: 'Pulverização' },
    activity: { uuid: 'act-1', name: 'Aplicação' },
    executor: { uuid: 'user-1', name: 'João' },
    employees: [
      {
        id: 1,
        type: 1,
        employee_uuid: 'emp-1',
        function_uuid: null,
        provider_uuid: null,
        label: 'Maria Colaboradora',
        note: 'turno A',
        is_checked: true,
      },
      {
        id: 2,
        type: 2,
        employee_uuid: null,
        function_uuid: 'fun-1',
        provider_uuid: null,
        label: 'Tratorista',
        note: null,
        is_checked: false,
      },
      {
        id: 3,
        type: 3,
        employee_uuid: null,
        function_uuid: null,
        provider_uuid: 'prov-1',
        label: 'Prestadora Ltda',
        note: null,
        is_checked: false,
      },
    ],
    equipments: [
      { equipment_uuid: 'eq-1', label: 'Trator JD 6110', note: 'revisado', is_checked: false },
    ],
    products: [
      {
        stock_uuid: 'stk-1',
        label: 'Glifosato',
        product_description: 'Glifosato',
        measurement_uuid: 'm-1',
        measurement_name: 'Litro',
        warehouse: { uuid: 'wh-1', label: 'AG — Armazém de Insumos' },
        stock_quantity: 150.5,
        quantity: 2,
        total_quantity: 20,
        note: null,
        is_checked: false,
      },
    ],
    productions: [
      {
        product_uuid: 'prod-1',
        label: 'Soja em grão',
        measurement_uuid: 'm-2',
        measurement_name: 'Saca',
        quantity: 30,
        note: 'lote 1',
        is_checked: false,
      },
    ],
    protections: [{ product_uuid: 'epi-1', label: 'Luva nitrílica', note: null, is_checked: true }],
    attachments: [],
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('mapServiceOrderDetailToFormValues — hidratação dos 5 blocos (execução 086)', () => {
  const form = mapServiceOrderDetailToFormValues(
    detailFixture(),
    categoryOptions,
    laborTypeOptions
  );

  it('mão de obra: func_type = Option traduzida + select do tipo com uuid+label (3 tipos)', () => {
    const [employee, fn, provider] = form.employees;

    expect(employee.func_type).toEqual({ value: 1, label: 'Funcionário' });
    expect(employee.employee_uuid).toEqual({ value: 'emp-1', label: 'Maria Colaboradora' });
    expect(employee.function_uuid).toBeNull();
    expect(employee.provider_uuid).toBeNull();
    expect(employee.note).toBe('turno A');
    expect(employee.is_checked).toBe(true);

    expect(fn.func_type).toEqual({ value: 2, label: 'Função' });
    expect(fn.function_uuid).toEqual({ value: 'fun-1', label: 'Tratorista' });
    expect(fn.employee_uuid).toBeNull();

    expect(provider.func_type).toEqual({ value: 3, label: 'Fornecedor' });
    expect(provider.provider_uuid).toEqual({ value: 'prov-1', label: 'Prestadora Ltda' });
    expect(provider.provider_uuid?.label).not.toContain('…');
  });

  it('equipamentos/produção/proteções: label (nunca uuid truncado)', () => {
    expect(form.equipments[0].equipment_uuid).toEqual({ value: 'eq-1', label: 'Trator JD 6110' });
    expect(form.productions[0].product_uuid).toEqual({ value: 'prod-1', label: 'Soja em grão' });
    expect(form.productions[0].measurement_uuid).toEqual({ value: 'm-2', label: 'Saca' });
    expect(form.protections[0].product_uuid).toEqual({ value: 'epi-1', label: 'Luva nitrílica' });
  });

  it('insumos: armazém do bloco + estoque + unidade preenchidos (destrava Produto/Unidade)', () => {
    expect(form.products_warehouse_uuid).toEqual({
      value: 'wh-1',
      label: 'AG — Armazém de Insumos',
    });
    const line = form.products[0];
    expect(line.stock_uuid).toMatchObject({
      value: 'stk-1',
      label: 'Glifosato',
      quantity: 150.5,
      measurement: { value: 'm-1', label: 'Litro' },
    });
    expect(line.measurement_uuid).toEqual({ value: 'm-1', label: 'Litro' });
    expect(line.quantity).toBe(2);
    expect(line.total_quantity).toBe(20);
  });

  it('cabeçalho: categoria traduzida e selects com uuid+nome', () => {
    expect(form.category).toEqual({ value: 2, label: 'Agricultura' });
    expect(form.area_uuid).toMatchObject({ value: 'area-1', label: 'Talhão 1' });
  });

  it('área: Option igual à do select (label, value, description, productive_area)', () => {
    expect(form.area_uuid).toEqual({
      value: 'area-1',
      label: 'Talhão 1',
      description: 'Talhão 1',
      productive_area: 10,
    });
  });

  it('FK órfã: rótulo "—" quando há uuid sem nome; sem uuid a linha fica nula (bloqueia o salvar)', () => {
    const orphan = mapServiceOrderDetailToFormValues(
      detailFixture({
        employees: [
          {
            id: 9,
            type: 1,
            employee_uuid: 'emp-x',
            function_uuid: null,
            provider_uuid: null,
            label: null,
            note: null,
            is_checked: false,
          },
        ],
        equipments: [{ equipment_uuid: null, label: null, note: null, is_checked: false }],
      }),
      categoryOptions,
      laborTypeOptions
    );

    expect(orphan.employees[0].employee_uuid).toEqual({ value: 'emp-x', label: '—' });
    expect(orphan.equipments[0].equipment_uuid).toBeNull();
  });
});

describe('round-trip mapper → form → payload (replace dos 5 blocos)', () => {
  it('o payload preserva TODAS as linhas, inclusive os 3 tipos de mão de obra', () => {
    const payload = buildServiceOrderPayload(
      mapServiceOrderDetailToFormValues(detailFixture(), categoryOptions, laborTypeOptions)
    );

    expect(payload.employees).toEqual([
      {
        employee_uuid: 'emp-1',
        function_uuid: undefined,
        provider_uuid: undefined,
        note: 'turno A',
        is_checked: true,
      },
      {
        employee_uuid: undefined,
        function_uuid: 'fun-1',
        provider_uuid: undefined,
        note: undefined,
        is_checked: false,
      },
      {
        employee_uuid: undefined,
        function_uuid: undefined,
        provider_uuid: 'prov-1',
        note: undefined,
        is_checked: false,
      },
    ]);
    expect(payload.equipments).toEqual([
      { equipment_uuid: 'eq-1', note: 'revisado', is_checked: false },
    ]);
    expect(payload.products).toEqual([
      {
        stock_uuid: 'stk-1',
        measurement_uuid: 'm-1',
        quantity: 2,
        total_quantity: 20,
        note: undefined,
        is_checked: false,
      },
    ]);
    expect(payload.productions).toEqual([
      {
        product_uuid: 'prod-1',
        measurement_uuid: 'm-2',
        quantity: 30,
        note: 'lote 1',
        is_checked: false,
      },
    ]);
    expect(payload.protections).toEqual([
      { product_uuid: 'epi-1', note: undefined, is_checked: true },
    ]);
    // `products_warehouse_uuid` é UI-only, nunca vai ao payload
    expect(payload).not.toHaveProperty('products_warehouse_uuid');
    expect(payload).toMatchObject({
      code: '000123',
      executor_uuid: 'user-1',
      category: 2,
      operation_uuid: 'op-1',
      activity_uuid: 'act-1',
      area_uuid: 'area-1',
    });
  });

  it('linha de mão de obra sem tipo/executor (hidratação sem dado) NÃO é descartada: erro explícito com a linha', () => {
    const form = mapServiceOrderDetailToFormValues(
      detailFixture({
        employees: [
          {
            id: 1,
            type: null,
            employee_uuid: null,
            function_uuid: null,
            provider_uuid: null,
            label: null,
            note: null,
            is_checked: false,
          },
        ],
      }),
      categoryOptions,
      laborTypeOptions
    );

    expect(() => buildServiceOrderPayload(form)).toThrow(ServiceOrderIncompleteLineError);
    try {
      buildServiceOrderPayload(form);
    } catch (error) {
      expect(error).toMatchObject({ block: 'employees', line: 1 });
    }
  });

  it('linhas incompletas dos demais blocos também bloqueiam (nunca descartam)', () => {
    const base = mapServiceOrderDetailToFormValues(
      detailFixture(),
      categoryOptions,
      laborTypeOptions
    );

    expect(() =>
      buildServiceOrderPayload({
        ...base,
        equipments: [{ ...base.equipments[0], equipment_uuid: null }],
      })
    ).toThrow(/equipments/);
    expect(() =>
      buildServiceOrderPayload({
        ...base,
        products: [{ ...base.products[0], measurement_uuid: null }],
      })
    ).toThrow(/products/);
    expect(() =>
      buildServiceOrderPayload({
        ...base,
        productions: [{ ...base.productions[0], product_uuid: null }],
      })
    ).toThrow(/productions/);
    expect(() =>
      buildServiceOrderPayload({
        ...base,
        protections: [{ ...base.protections[0], product_uuid: null }],
      })
    ).toThrow(/protections/);
  });
});

describe('findFirstLineError', () => {
  it('devolve bloco + linha (1-based) do primeiro erro, na ordem das abas', () => {
    const errors = {
      products: [undefined, { stock_uuid: { message: 'x' } }],
      employees: [undefined, undefined, { employee_uuid: { message: 'y' } }],
    } as never;

    expect(findFirstLineError(errors)).toEqual({ block: 'employees', line: 3 });
  });

  it('sem erro de linha devolve null', () => {
    expect(findFirstLineError({ code: { message: 'obrigatório' } } as never)).toBeNull();
  });
});

describe('operação/atividade GLOBAIS (tenant_id NULL) — API-03b', () => {
  // `/operations/options` e `/activities/options` NÃO listam globais no
  // contexto de fazenda (comportamento do legado) — o valor vem do detalhe.
  const globalDetail = detailFixture({
    operation: { uuid: 'op-global', name: 'Tratos Culturais' },
    activity: { uuid: 'act-global', name: 'Pulverização Mecanizada' },
  });

  it('hidrata operation/activity com {value: uuid, label: name} vindos do detalhe', () => {
    const form = mapServiceOrderDetailToFormValues(globalDetail, categoryOptions, laborTypeOptions);

    expect(form.operation_uuid).toEqual({ value: 'op-global', label: 'Tratos Culturais' });
    expect(form.activity_uuid).toEqual({ value: 'act-global', label: 'Pulverização Mecanizada' });
  });

  it('o PUT envia operation_uuid/activity_uuid hidratados (mesmo fora da lista de opções)', () => {
    const payload = buildServiceOrderPayload(
      mapServiceOrderDetailToFormValues(globalDetail, categoryOptions, laborTypeOptions)
    );

    expect(payload.operation_uuid).toBe('op-global');
    expect(payload.activity_uuid).toBe('act-global');
  });
});

describe('o form hidratado é submetível (schema)', () => {
  const schemaLanguage = {
    serviceOrders: languageServiceOrders,
    defaltStrings: { validations: { requiredField: 'obrigatório', invalidValue: 'inválido' } },
  } as unknown as LanguageDate;

  it('OS completa hidratada passa no schema sem tocar em nada (salvar sem mudanças)', async () => {
    const form = mapServiceOrderDetailToFormValues(
      detailFixture(),
      categoryOptions,
      laborTypeOptions
    );

    await expect(serviceOrderSchema(schemaLanguage).validate(form)).resolves.toBeTruthy();
  });

  it('linha de mão de obra sem dado (FK órfã) é bloqueada pelo schema com erro visível', async () => {
    const form = mapServiceOrderDetailToFormValues(
      detailFixture({
        employees: [
          {
            id: 1,
            type: null,
            employee_uuid: null,
            function_uuid: null,
            provider_uuid: null,
            label: null,
            note: null,
            is_checked: false,
          },
        ],
      }),
      categoryOptions,
      laborTypeOptions
    );

    await expect(serviceOrderSchema(schemaLanguage).validate(form)).rejects.toMatchObject({
      path: 'employees[0].func_type',
    });
  });
});

describe('Qtd Total = Qtd/ha × productive_area em linha hidratada (API-03c)', () => {
  const form = mapServiceOrderDetailToFormValues(
    detailFixture(),
    categoryOptions,
    laborTypeOptions
  );
  const productiveArea = Number((form.area_uuid as { productive_area?: number }).productive_area);

  it('a Área hidratada traz a área produtiva usada pela aba Insumos', () => {
    expect(productiveArea).toBe(10);
  });

  it('editar a Qtd/ha da linha antiga recalcula o total corretamente', () => {
    // linha salva: 2 ha × 10 = 20; usuário muda Qtd/ha para 3,5
    expect(computeTotalQuantity(form.products[0].quantity, productiveArea)).toBe(20);
    expect(computeTotalQuantity(3.5, productiveArea)).toBe(35);
  });

  it('editar o total recalcula a Qtd/ha; área 0 não divide por zero', () => {
    expect(computeQuantityPerArea(50, productiveArea)).toBe(5);
    expect(computeQuantityPerArea(50, 0)).toBe(0);
    expect(computeTotalQuantity(null, productiveArea)).toBe(0);
  });
});

describe('horários do GET real (HH:MM:SS) — OS com janela de trabalho', () => {
  const schemaLanguage = {
    serviceOrders: languageServiceOrders,
    defaltStrings: { validations: { requiredField: 'obrigatório', invalidValue: 'inválido' } },
  } as unknown as LanguageDate;

  const withWindow = detailFixture({
    allowed_working_period_start: '06:00:00',
    allowed_working_period_end: '07:30:00',
    minimum_temperature: 12,
    maximum_temperature: 21,
    weather_requirements: 'DIA ENSOLARADO',
  });

  it('hidrata os horários como HH:MM', () => {
    const form = mapServiceOrderDetailToFormValues(withWindow, categoryOptions, laborTypeOptions);

    expect(form.allowed_working_period_start).toBe('06:00');
    expect(form.allowed_working_period_end).toBe('07:30');
  });

  it('o form hidratado passa no schema e o payload (PUT) envia HH:MM', async () => {
    const form = mapServiceOrderDetailToFormValues(withWindow, categoryOptions, laborTypeOptions);

    await expect(serviceOrderSchema(schemaLanguage).validate(form)).resolves.toBeTruthy();
    const payload = buildServiceOrderPayload(form);
    expect(payload.allowed_working_period_start).toBe('06:00');
    expect(payload.allowed_working_period_end).toBe('07:30');
  });

  it('sem janela (null/vazio) segue válido e não envia horário', async () => {
    const form = mapServiceOrderDetailToFormValues(
      detailFixture({ allowed_working_period_start: null, allowed_working_period_end: '' }),
      categoryOptions,
      laborTypeOptions
    );

    await expect(serviceOrderSchema(schemaLanguage).validate(form)).resolves.toBeTruthy();
    const payload = buildServiceOrderPayload(form);
    expect(payload.allowed_working_period_start).toBeUndefined();
    expect(payload.allowed_working_period_end).toBeUndefined();
  });
});

describe('mapServiceOrderDetailToFormValues — labels iguais aos dos selects de criação (086 item 5b)', () => {
  const [baseProduct] = detailFixture().products ?? [];
  if (!baseProduct) throw new Error('fixture sem produtos');

  it('com sigla/descrição da API: armazém "SIGLA — descrição" e unidade pela descrição', () => {
    const form = mapServiceOrderDetailToFormValues(
      detailFixture({
        products: [
          {
            ...baseProduct,
            measurement_name: 'kg',
            measurement_description: 'Quilograma',
            warehouse: { uuid: 'wh-1', label: 'ARMAZEM TESTE', initials: 'AMT' },
          },
        ],
        productions: [
          {
            product_uuid: 'prod-1',
            label: 'Soja',
            measurement_uuid: 'm-9',
            measurement_name: 'kg',
            measurement_description: 'Quilograma',
            quantity: 1,
            note: null,
            is_checked: false,
          },
        ],
      }),
      categoryOptions,
      laborTypeOptions
    );

    expect(form.products_warehouse_uuid?.label).toBe('AMT — ARMAZEM TESTE');
    expect(form.products[0].measurement_uuid?.label).toBe('Quilograma');
    expect(form.productions[0].measurement_uuid?.label).toBe('Quilograma');
  });

  it('sem sigla/descrição (API atual): cai em label/name sem inventar dado', () => {
    const form = mapServiceOrderDetailToFormValues(
      detailFixture({
        products: [
          {
            ...baseProduct,
            measurement_name: 'kg',
            measurement_description: undefined,
            warehouse: { uuid: 'wh-1', label: 'ARMAZEM TESTE' },
          },
        ],
      }),
      categoryOptions,
      laborTypeOptions
    );

    expect(form.products_warehouse_uuid?.label).toBe('ARMAZEM TESTE');
    expect(form.products[0].measurement_uuid?.label).toBe('kg');
  });

  it('helpers puros', () => {
    expect(warehouseLabel('AMT', 'ARMAZEM TESTE')).toBe('AMT — ARMAZEM TESTE');
    expect(warehouseLabel(null, 'ARMAZEM TESTE')).toBe('ARMAZEM TESTE');
    expect(measurementLabel('Quilograma', 'kg')).toBe('Quilograma');
    expect(measurementLabel('', 'kg')).toBe('kg');
    expect(measurementLabel(null, null)).toBeNull();
  });
});
