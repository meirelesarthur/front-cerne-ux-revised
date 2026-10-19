// 088 D3-FE-T2 — regras do schema do financeiro (§3.1/§3.2 do plano de front).
import { describe, expect, it } from 'vitest';
import * as yup from 'yup';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import { movementPurchaseFinancialFields } from './movement-purchase-financial-schema';

const lang = languagePtBr.BR;
const messages = lang.movementPurchases.movementPurchase.form.financial.messages;
const required = lang.defaltStrings.validations.requiredField;

const schema = yup.object({
  has_financial: yup.boolean(),
  financial_write_off: yup.boolean(),
  total: yup.number(),
  ...movementPurchaseFinancialFields(lang),
});

const valid = (over: Record<string, any> = {}) => ({
  has_financial: true,
  financial_write_off: false,
  total: 100,
  financial_number: '123',
  financial_type_title: { label: 'Duplicata', value: 'tt' },
  financial_proprietary: null,
  financial_note: 'Compra',
  financial_has_input: false,
  financial_input_date: null,
  financial_input_value: null,
  financial_fiscal_document: true,
  financial_classification: 'N',
  generator: { count: 3, first_due_date: '2025-01-10', interval_days: 30 },
  financial_installments: [
    { due_date: '2025-01-10', amount: 33.33, origin: 'generated' },
    { due_date: '2025-02-09', amount: 33.33, origin: 'generated' },
    { due_date: '2025-03-11', amount: 33.34, origin: 'generated' },
  ],
  ...over,
});

async function errorsOf(value: Record<string, any>): Promise<Record<string, string>> {
  try {
    await schema.validate(value, { abortEarly: false });
    return {};
  } catch (e) {
    const out: Record<string, string> = {};
    (e as yup.ValidationError).inner.forEach((err) => {
      if (err.path && !out[err.path]) out[err.path] = err.message;
    });
    return out;
  }
}

describe('movementPurchaseFinancialFields', () => {
  it('payload válido não gera erro', async () => {
    expect(await errorsOf(valid())).toEqual({});
  });

  it('sem financeiro nada é obrigatório', async () => {
    const errors = await errorsOf(
      valid({
        has_financial: false,
        financial_number: '',
        financial_type_title: null,
        financial_note: '',
        financial_has_input: null,
        generator: { count: null, first_due_date: null, interval_days: null },
        financial_installments: [],
      })
    );
    expect(errors).toEqual({});
  });

  it('com financeiro: cabeçalho, entrada escolhida, gerador e parcelas são obrigatórios', async () => {
    const errors = await errorsOf(
      valid({
        financial_number: '',
        financial_type_title: null,
        financial_note: '',
        financial_has_input: null,
        generator: { count: null, first_due_date: null, interval_days: null },
        financial_installments: [],
      })
    );
    expect(errors.financial_number).toBe(required);
    expect(errors.financial_type_title).toBe(required);
    expect(errors.financial_note).toBe(required);
    expect(errors.financial_has_input).toBe(required);
    expect(errors['generator.count']).toBeTruthy();
    expect(errors['generator.first_due_date']).toBe(required);
    expect(errors['generator.interval_days']).toBeTruthy();
    expect(errors.financial_installments).toBeTruthy();
  });

  it('proprietário é opcional; intervalo 0 é válido; Histórico não tem máximo no schema', async () => {
    const errors = await errorsOf(
      valid({
        financial_proprietary: null,
        generator: { count: 3, first_due_date: '2025-01-10', interval_days: 0 },
        financial_note: 'x'.repeat(500),
      })
    );
    expect(errors).toEqual({});
  });

  it('entrada: com Sim exige data e valor; 0 < valor < total', async () => {
    const base = {
      financial_has_input: true,
      financial_installments: [
        { due_date: '2025-01-05', amount: 20, origin: 'input' },
        { due_date: '2025-02-05', amount: 80, origin: 'generated' },
      ],
    };
    let errors = await errorsOf(valid(base));
    expect(errors.financial_input_date).toBe(required);
    expect(errors.financial_input_value).toBe(required);

    errors = await errorsOf(
      valid({ ...base, financial_input_date: '2025-01-05', financial_input_value: 100 })
    );
    expect(errors.financial_input_value).toBe(messages.inputLessThanTotal);

    errors = await errorsOf(
      valid({ ...base, financial_input_date: '2025-01-05', financial_input_value: 20 })
    );
    expect(errors.financial_input_value).toBeUndefined();
  });

  it('cada parcela > 0 (P-5) com a posição na mensagem', async () => {
    const errors = await errorsOf(
      valid({
        financial_installments: [
          { due_date: '2025-01-10', amount: 100, origin: 'manual' },
          { due_date: '2025-02-10', amount: 0, origin: 'manual' },
        ],
      })
    );
    expect(errors['financial_installments[1].amount']).toBe(
      messages.installmentPositive.replace('{{position}}', '2')
    );
  });

  it('Σ parcelas em centavos = total (sem tolerância) com a mensagem formatada', async () => {
    const errors = await errorsOf(
      valid({
        financial_installments: [
          { due_date: '2025-01-10', amount: 33.33, origin: 'manual' },
          { due_date: '2025-02-09', amount: 33.33, origin: 'manual' },
          { due_date: '2025-03-11', amount: 33.33, origin: 'manual' },
        ],
      })
    );
    expect(errors.financial_installments).toBe(
      messages.installmentsSumMismatch
        .replace('{{sum}}', (99.99).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
        .replace('{{total}}', (100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
    );
  });

  it('total 0 com financeiro: mensagem totalMustBePositive', async () => {
    const errors = await errorsOf(valid({ total: 0 }));
    expect(errors.financial_installments).toBe(messages.totalMustBePositive);
  });

  it('passivo com baixa (D2): nada é validado', async () => {
    const errors = await errorsOf(
      valid({
        financial_write_off: true,
        financial_number: '',
        financial_installments: [{ due_date: null, amount: 0, origin: 'stored' }],
      })
    );
    expect(errors).toEqual({});
  });
});
