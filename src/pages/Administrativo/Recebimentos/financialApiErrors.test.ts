// Execução 081, T-081-FE-10 — 422 flat da API de Gerar Financeiro para os campos do form.
import { describe, expect, it } from 'vitest';

import { mapFinancialApiErrors } from './financialApiErrors';

describe('mapFinancialApiErrors', () => {
  it('mapeia os campos simples do contrato para os campos do formulário', () => {
    expect(
      mapFinancialApiErrors({
        number: ['O número é obrigatório.'],
        provider_uuid: ['Fornecedor obrigatório'],
        vl_total: ['O valor do título deve ser maior que zero'],
        note: ['x'],
        type_uuid: ['y'],
      })
    ).toEqual([
      { name: 'financial_number', message: 'O número é obrigatório.' },
      { name: 'financial_provider_id', message: 'Fornecedor obrigatório' },
      { name: 'vl_total', message: 'O valor do título deve ser maior que zero' },
      { name: 'financial_note', message: 'x' },
      { name: 'financial_type_id', message: 'y' },
    ]);
  });

  it('mapeia rateio e parcelas com índice', () => {
    expect(
      mapFinancialApiErrors({
        'categories.1.center_uuid': ['Centro inválido'],
        'date_installments.0': ['Data inválida'],
        'value_installments.2': ['Valor inválido'],
      })
    ).toEqual([
      { name: 'ratio.1.center_uuid', message: 'Centro inválido' },
      { name: 'installments.0.due_date', message: 'Data inválida' },
      { name: 'installments.2.value', message: 'Valor inválido' },
    ]);
  });

  it('ignora chaves sem campo e entradas vazias', () => {
    expect(mapFinancialApiErrors({ categories: ['x'], 'categories.0.foo': ['y'] })).toEqual([]);
    expect(mapFinancialApiErrors(null)).toEqual([]);
  });
});
