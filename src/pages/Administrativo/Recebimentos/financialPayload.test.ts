// Execução 081, T-081-FE-10 — chaves do payload de Gerar Financeiro (EXEC-API-05 §4).
import { describe, expect, it } from 'vitest';

import {
  buildFinancialPayload,
  resolveFinancialFarmUuid,
  type FinancialPayloadSource,
} from './financialPayload';

const form: FinancialPayloadSource = {
  financial_number: ' 123 ',
  financial_type_id: { label: 'Boleto', value: 'type-uuid' },
  financial_proprietary_id: null,
  financial_provider_id: { label: 'Forn', value: 'provider-uuid' },
  financial_note: ' Histórico ',
  fiscal_document: { label: 'Sim', value: true },
  vl_total: 1500,
  installments: [
    { due_date: '2026-10-30', value: 750 },
    { due_date: '2026-11-30', value: 750 },
  ],
  ratio: [
    {
      category_uuid: { label: 'Cat', value: 'cat-uuid' },
      center_uuid: { label: 'CC', value: 'center-uuid' },
      plan_account_uuid: { label: 'Conta', value: 'plan-uuid' },
      value: 1500,
    },
  ],
};

describe('buildFinancialPayload', () => {
  it('usa exatamente as chaves do contrato da API', () => {
    const payload = buildFinancialPayload(form, { vlTotalEditable: false });
    expect(payload).toEqual({
      number: '123',
      type_uuid: 'type-uuid',
      proprietary_uuid: null,
      provider_uuid: 'provider-uuid',
      fiscal_document: true,
      note: 'Histórico',
      date_installments: ['2026-10-30', '2026-11-30'],
      value_installments: [750, 750],
      categories: [
        {
          category_uuid: 'cat-uuid',
          center_uuid: 'center-uuid',
          plan_account_uuid: 'plan-uuid',
          value: 1500,
        },
      ],
    });
  });

  it('só o tipo D envia vl_total', () => {
    expect(buildFinancialPayload(form, { vlTotalEditable: false })).not.toHaveProperty('vl_total');
    expect(buildFinancialPayload(form, { vlTotalEditable: true }).vl_total).toBe(1500);
  });

  it('não envia as chaves antigas da SPA', () => {
    const payload = buildFinancialPayload(form, { vlTotalEditable: true }) as unknown as Record<
      string,
      unknown
    >;
    [
      'financial_number',
      'financial_type_id',
      'financial_provider_id',
      'financial_note',
      'installments',
      'ratio',
      'has_input',
      'input_value',
      'qtd_installments',
      'first_installment',
      'int_installments',
    ].forEach((key) => expect(payload).not.toHaveProperty(key));
  });
});

describe('resolveFinancialFarmUuid', () => {
  it('usa a fazenda do contexto', () => {
    expect(resolveFinancialFarmUuid({ farm: { uuid: 'farm-1', description: 'Fazenda' } })).toBe(
      'farm-1'
    );
  });

  it('sem farm (null, ausente ou contexto indefinido) não filtra', () => {
    expect(resolveFinancialFarmUuid({ farm: null })).toBeUndefined();
    expect(resolveFinancialFarmUuid({})).toBeUndefined();
    expect(resolveFinancialFarmUuid(undefined)).toBeUndefined();
  });
});
