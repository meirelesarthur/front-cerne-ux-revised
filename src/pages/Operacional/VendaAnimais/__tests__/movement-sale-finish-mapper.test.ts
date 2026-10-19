import { describe, expect, it } from 'vitest';

import { movementSaleFiscalDocumentOptions } from '@/constants/GestaoAnimal/MovementSale/options';
import { languages } from '@/constants/languages';

import type { MovementSaleDetail, MovementSaleForm } from '@/@types/v2/MovementSales';

import {
  buildMovementSaleSlaughterManyPayload,
  buildMovementSaleSlaughterPayload,
  mapMovementSaleDetailsToFinishManyFormValues,
  mapMovementSaleDetailToFinishFormValues,
} from '../movement-sale-finish-mapper';
import { buildMovementSalePayload } from '../useMovementSales';

const languageGB = languages.BR;

function makeDetail(overrides: Partial<MovementSaleDetail> = {}): MovementSaleDetail {
  return {
    uuid: 'sale-1',
    code: '1',
    status: 'P',
    dt_sale: '2026-01-10',
    type_sale: 2,
    type_sale_label: 'Abate',
    pricing_type: 1,
    gtas: null,
    items: [],
    categories: [],
    total_products: 0,
    freight: 0,
    other_values: 0,
    discount: 0,
    total: 0,
    seller: null,
    client: null,
    batch: null,
    ...overrides,
  } as unknown as MovementSaleDetail;
}

function makeForm(overrides: Partial<MovementSaleForm> = {}): MovementSaleForm {
  return {
    ...mapMovementSaleDetailToFinishFormValues(makeDetail(), languageGB),
    financial_allocations: [
      {
        category_uuid: { label: 'c', value: 'cat-1' },
        center_uuid: { label: 'k', value: 'cen-1' },
        plan_account_uuid: null,
        value: 0,
      },
    ] as MovementSaleForm['financial_allocations'],
    financial_installments: [
      { date: '2026-02-10', value: 0 },
    ] as MovementSaleForm['financial_installments'],
    ...overrides,
  };
}

describe('hidratação de fiscal_document', () => {
  it('default Sim (true) sem incomes', () => {
    expect(mapMovementSaleDetailToFinishFormValues(makeDetail(), languageGB).fiscal_document).toBe(
      true
    );
    expect(
      mapMovementSaleDetailsToFinishManyFormValues([makeDetail()], languageGB).fiscal_document
    ).toBe(true);
  });

  it('reidrata de incomes[0].fiscal_document=false (individual e lote)', () => {
    const detail = makeDetail({
      incomes: [{ fiscal_document: false }] as unknown as MovementSaleDetail['incomes'],
    });
    expect(mapMovementSaleDetailToFinishFormValues(detail, languageGB).fiscal_document).toBe(false);
    expect(mapMovementSaleDetailsToFinishManyFormValues([detail], languageGB).fiscal_document).toBe(
      false
    );
  });
});

describe('hidratação de fiscal_document (lote — FE-T04)', () => {
  it('lote usa details[0].incomes[0] e ignora incomes das demais vendas', () => {
    const first = makeDetail({
      uuid: 'sale-a',
      incomes: [{ fiscal_document: false }] as unknown as MovementSaleDetail['incomes'],
    });
    const second = makeDetail({
      uuid: 'sale-b',
      incomes: [{ fiscal_document: true }] as unknown as MovementSaleDetail['incomes'],
    });
    expect(
      mapMovementSaleDetailsToFinishManyFormValues([first, second], languageGB).fiscal_document
    ).toBe(false);

    // Primeira venda sem income => default Sim, mesmo que a segunda tenha false.
    const noIncome = makeDetail({ uuid: 'sale-c' });
    const secondFalse = makeDetail({
      uuid: 'sale-d',
      incomes: [{ fiscal_document: false }] as unknown as MovementSaleDetail['incomes'],
    });
    expect(
      mapMovementSaleDetailsToFinishManyFormValues([noIncome, secondFalse], languageGB)
        .fiscal_document
    ).toBe(true);
  });
});

describe('payload de finalização — cálculos e omissões (FE-T01..T03)', () => {
  it('individual: value_real/value_arroba replicados da categoria e value_unit não enviado (calculado no servidor)', () => {
    const form = makeForm({
      items: [
        {
          animal_uuid: { label: 'A1', value: 'animal-1' },
          category_uuid: { label: 'Boi', value: 'cat-1' },
          carcass_weight: 220,
          performance: 55,
        },
      ] as unknown as MovementSaleForm['items'],
      categories: [
        {
          category_uuid: 'cat-1',
          description: 'Boi',
          quantity: 1,
          value_real: 15,
          value_arroba: 225,
          value_head: null,
          value_total: 3300,
        },
      ] as MovementSaleForm['categories'],
    });
    const payload = buildMovementSaleSlaughterPayload(form);
    expect(payload.items).toEqual([
      {
        animal_uuid: 'animal-1',
        carcass_weight: 220,
        performance: 55,
        value_real: 15,
        value_arroba: 225,
      },
    ]);
    expect(payload.items[0]).not.toHaveProperty('value_unit');
  });

  it('total e total_products recalculados de categories (frete+outros-desconto), arredondando 2 casas', () => {
    const form = makeForm({
      categories: [
        {
          category_uuid: 'c1',
          description: 'a',
          quantity: 1,
          value_real: null,
          value_arroba: null,
          value_head: null,
          value_total: 10.004,
        },
        {
          category_uuid: 'c2',
          description: 'b',
          quantity: 1,
          value_real: null,
          value_arroba: null,
          value_head: null,
          value_total: 20.004,
        },
      ] as MovementSaleForm['categories'],
      freight: 5,
      other_values: 2.5,
      discount: 1,
      // valores stale do form NÃO podem vazar para o payload
      total_products: 999,
      total: 999,
    });
    const payload = buildMovementSaleSlaughterPayload(form);
    expect(payload.total_products).toBe(30.01);
    expect(payload.total).toBe(36.51);
    expect(payload.financial?.vl_total).toBe(36.51);
  });

  it('lote: type_payment omitido (includeTypePayment=false) e totais agregados de todas as vendas; individual inclui type_payment só com valor', () => {
    const category = (valueTotal: number) =>
      [
        {
          uuid: 'cat-1',
          description: 'Boi',
          quantity: 1,
          value_real: 0,
          value_arroba: 0,
          value_head: 0,
          value_total: valueTotal,
        },
      ] as unknown as MovementSaleDetail['categories'];
    const a = makeDetail({
      uuid: 'a',
      pricing_type: 1,
      categories: category(100),
      freight: 10,
      discount: 5,
    });
    const b = makeDetail({
      uuid: 'b',
      pricing_type: 1,
      categories: category(200),
      freight: 20,
      discount: 5,
    });
    const form = {
      ...mapMovementSaleDetailsToFinishManyFormValues([a, b], languageGB),
      type_payment: { label: 'Dinheiro', value: '01' },
    };

    const many = buildMovementSaleSlaughterManyPayload(['a', 'b'], form);
    expect(many.sale_uuids).toEqual(['a', 'b']);
    expect(many).not.toHaveProperty('type_payment');
    expect(many.total_products).toBe(300);
    expect(many.freight).toBe(30);
    expect(many.discount).toBe(10);
    expect(many.total).toBe(320);

    // individual: com valor entra o código de 2 caracteres; sem valor, ausente
    expect(buildMovementSaleSlaughterPayload(form).type_payment).toBe('01');
    expect(buildMovementSaleSlaughterPayload({ ...form, type_payment: null })).not.toHaveProperty(
      'type_payment'
    );
    expect(
      buildMovementSaleSlaughterPayload(form, { includeTypePayment: false })
    ).not.toHaveProperty('type_payment');
  });
});

describe('payload de finalização — financial.fiscal_document', () => {
  it('individual: true/false conforme o form quando has_financial=true', () => {
    expect(
      buildMovementSaleSlaughterPayload(makeForm({ fiscal_document: true })).financial
        ?.fiscal_document
    ).toBe(true);
    expect(
      buildMovementSaleSlaughterPayload(makeForm({ fiscal_document: false })).financial
        ?.fiscal_document
    ).toBe(false);
  });

  it('lote: true/false conforme o form quando has_financial=true', () => {
    expect(
      buildMovementSaleSlaughterManyPayload(['a', 'b'], makeForm({ fiscal_document: true }))
        .financial?.fiscal_document
    ).toBe(true);
    expect(
      buildMovementSaleSlaughterManyPayload(['a', 'b'], makeForm({ fiscal_document: false }))
        .financial?.fiscal_document
    ).toBe(false);
  });

  it('ausente no form => true (default Sim)', () => {
    const form = makeForm();
    delete form.fiscal_document;
    expect(buildMovementSaleSlaughterPayload(form).financial?.fiscal_document).toBe(true);
  });

  it('has_financial=false => sem financial (individual e lote)', () => {
    const form = makeForm({ has_financial: false, fiscal_document: true });
    expect(buildMovementSaleSlaughterPayload(form).financial).toBeUndefined();
    expect(buildMovementSaleSlaughterManyPayload(['a'], form).financial).toBeUndefined();
  });
});

describe('regressão Criar/Editar', () => {
  it('buildMovementSalePayload não inclui fiscal_document', () => {
    const form = makeForm({
      fiscal_document: false,
      client_uuid: { label: 'Cliente', value: 'client-1' },
      type_payment: { label: 'Dinheiro', value: '01' },
    });
    const payload = buildMovementSalePayload(form);
    expect(payload.financial ? 'fiscal_document' in payload.financial : false).toBe(false);
  });
});

describe('fábrica de opções', () => {
  it('Sim/Não via i18n e getOption', () => {
    expect(movementSaleFiscalDocumentOptions.options(languageGB).map((o) => o.label)).toEqual([
      languageGB.defaltStrings.yes,
      languageGB.defaltStrings.no,
    ]);
    expect(movementSaleFiscalDocumentOptions.getOption(false, languageGB)?.value).toBe(false);
    expect(movementSaleFiscalDocumentOptions.getLabel(true, languageGB)).toBe(
      languageGB.defaltStrings.yes
    );
  });
});
